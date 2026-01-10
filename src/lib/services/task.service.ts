import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { TaskDTO, CreateTaskCommand } from "@/types";
import type { TaskQueryParams } from "@/lib/schemas/task.schema";
import { batchCalculateETA } from "@/lib/utils/eta-calculator";
import { getManagerDepartments } from "./auth.service";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

/**
 * Task Service
 * Handles business logic for task retrieval with filtering, ETA calculation, and privacy masking
 */

/**
 * List tasks with filtering, ETA calculation, and privacy masking
 *
 * This function:
 * 1. Builds a filtered query based on provided parameters
 * 2. Executes the query (RLS policies automatically filter based on user role)
 * 3. Batch calculates ETA for all returned tasks
 * 4. Applies privacy masking to task descriptions
 * 5. Returns TaskDTO array
 *
 * @param supabase - Supabase client instance (should be from context.locals)
 * @param userId - Current authenticated user ID
 * @param userRole - Current user's app_role (admin/manager/employee)
 * @param filters - Query parameters for filtering tasks
 * @returns Array of TaskDTO objects with calculated ETA and masked privacy
 */
export async function listTasks(
  supabase: SupabaseClient<Database>,
  userId: string,
  userRole: string,
  filters: TaskQueryParams
): Promise<TaskDTO[]> {
  try {
    // Build base query with join for assigned_by user (name/email)
    let query = supabase
      .from("tasks")
      .select(
        `
          *,
          assigned_by:users!tasks_assigned_by_user_id_fkey (
            full_name,
            email
          )
        `,
      );

    // Apply filters
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }

    if (filters.department_id) {
      query = query.eq("assigned_department_id", filters.department_id);
    }

    if (filters.assigned_to_user_id) {
      query = query.eq("assigned_user_id", filters.assigned_to_user_id);
    }

    if (filters.is_private !== undefined) {
      query = query.eq("is_private", filters.is_private);
    }

    // Execute query (RLS policies automatically filter based on user permissions)
    const { data: tasks, error } = await query;

    if (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }

    // Return empty array if no tasks found
    if (!tasks || tasks.length === 0) {
      return [];
    }

    // Batch calculate ETA for all tasks
    const taskIds = tasks.map((t) => t.id);
    const etaMap = await batchCalculateETA(supabase, taskIds);

    // Prefetch manager departments for privacy masking
    // Only needed if user is manager or admin, and there are private tasks
    const hasPrivateTasks = tasks.some((t) => t.is_private);
    const managerDepartments =
      hasPrivateTasks && (userRole === "manager" || userRole === "admin")
        ? await getManagerDepartments(supabase, userId)
        : new Set<string>();

    // Map to DTO with ETA and privacy masking
    const taskDTOs: TaskDTO[] = tasks.map((task) => {
      const eta = etaMap.get(task.id) ?? null;

      // Apply privacy masking
      const description = applyPrivacyMask(task, userId, userRole, managerDepartments);

      return {
        id: task.id,
        title: task.title,
        description,
        priority: task.priority,
        status: task.status,
        estimate_minutes: task.estimate_minutes,
        due_date: task.due_date,
        assigned_to_type: task.assigned_to_type,
        assigned_user_id: task.assigned_user_id,
        assigned_department_id: task.assigned_department_id,
        assigned_by_user_id: task.assigned_by_user_id,
        assigned_by_user_name: task.assigned_by?.full_name ?? task.assigned_by?.email ?? null,
        created_by_user_id: task.created_by_user_id,
        is_private: task.is_private,
        eta,
      };
    });

    return taskDTOs;
  } catch (error) {
    console.error("Error in listTasks service:", error);
    throw error;
  }
}

/**
 * Fetch tasks by explicit IDs.
 * Used by calendar views to guarantee tasks referenced by plan slots are present
 * even when the general list is paginated/filtered.
 */
export async function getTasksByIds(
  supabase: SupabaseClient<Database>,
  userId: string,
  userRole: string,
  ids: string[]
): Promise<TaskDTO[]> {
  try {
    if (ids.length === 0) return [];

    const { data: tasks, error } = await supabase.from("tasks").select("*").in("id", ids);

    if (error) {
      console.error("Error fetching tasks by ids:", error);
      throw error;
    }

    if (!tasks || tasks.length === 0) {
      return [];
    }

    const etaMap = await batchCalculateETA(supabase, tasks.map((t) => t.id));

    const hasPrivateTasks = tasks.some((t) => t.is_private);
    const managerDepartments =
      hasPrivateTasks && (userRole === "manager" || userRole === "admin")
        ? await getManagerDepartments(supabase, userId)
        : new Set<string>();

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: applyPrivacyMask(task, userId, userRole, managerDepartments),
      priority: task.priority,
      status: task.status,
      estimate_minutes: task.estimate_minutes,
      due_date: task.due_date,
      assigned_to_type: task.assigned_to_type,
      assigned_user_id: task.assigned_user_id,
      assigned_department_id: task.assigned_department_id,
      assigned_by_user_id: task.assigned_by_user_id,
      created_by_user_id: task.created_by_user_id,
      is_private: task.is_private,
      eta: etaMap.get(task.id) ?? null,
    }));
  } catch (error) {
    console.error("Error in getTasksByIds service:", error);
    throw error;
  }
}

/**
 * Apply privacy masking to task description
 *
 * Rules:
 * - If task is not private: return description as-is
 * - If task is private:
 *   - Owner (assigned_user_id) can see full description
 *   - Admin can see full description
 *   - Manager of the task's department can see full description
 *   - Others: description is masked to null
 *
 * @param task - Task row from database
 * @param userId - Current user ID
 * @param userRole - Current user's role
 * @param managerDepartments - Set of department IDs managed by current user
 * @returns Description (original or null if masked)
 */
function applyPrivacyMask(
  task: TaskRow,
  userId: string,
  userRole: string,
  managerDepartments: Set<string>
): string | null {
  // Non-private tasks: return description as-is
  if (!task.is_private) {
    return task.description;
  }

  // Private tasks: check permissions
  const isOwner = task.assigned_user_id === userId;
  const isAdmin = userRole === "admin";
  const isManagerOfTaskDepartment = task.assigned_department_id ? managerDepartments.has(task.assigned_department_id) : false;

  // User has permission to see full description
  if (isOwner || isAdmin || isManagerOfTaskDepartment) {
    return task.description;
  }

  // Mask description for unauthorized users
  return null;
}

/**
 * Get a single task by ID
 * Includes ETA calculation and privacy masking
 *
 * @param supabase - Supabase client instance
 * @param taskId - Task ID to retrieve
 * @param userId - Current authenticated user ID
 * @param userRole - Current user's app_role
 * @returns TaskDTO or null if not found/unauthorized
 */
export async function getTaskById(
  supabase: SupabaseClient<Database>,
  taskId: string,
  userId: string,
  userRole: string
): Promise<TaskDTO | null> {
  try {
    const { data: task, error } = await supabase.from("tasks").select("*").eq("id", taskId).single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found or RLS denied access
        return null;
      }
      throw error;
    }

    if (!task) return null;

    // Calculate ETA
    const etaMap = await batchCalculateETA(supabase, [task.id]);
    const eta = etaMap.get(task.id) ?? null;

    // Privacy masking
    const managerDepartments =
      task.is_private && (userRole === "manager" || userRole === "admin")
        ? await getManagerDepartments(supabase, userId)
        : new Set<string>();

    const description = applyPrivacyMask(task, userId, userRole, managerDepartments);

    return {
      id: task.id,
      title: task.title,
      description,
      priority: task.priority,
      status: task.status,
      estimate_minutes: task.estimate_minutes,
      due_date: task.due_date,
      assigned_to_type: task.assigned_to_type,
      assigned_user_id: task.assigned_user_id,
      assigned_department_id: task.assigned_department_id,
      assigned_by_user_id: task.assigned_by_user_id,
      created_by_user_id: task.created_by_user_id,
      is_private: task.is_private,
      eta,
    };
  } catch (error) {
    console.error("Error in getTaskById service:", error);
    throw error;
  }
}

/**
 * Create a new task
 *
 * @param supabase - Supabase client instance
 * @param userId - Current authenticated user ID
 * @param data - Task creation data
 * @returns Created task ID
 */
export async function createTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CreateTaskCommand
): Promise<string> {
  try {
    // Prepare insert data
    const insertData: Database["public"]["Tables"]["tasks"]["Insert"] = {
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      estimate_minutes: data.estimate_minutes,
      assigned_to_type: data.assigned_to_type,
      is_private: data.is_private,
      due_date: data.due_date,
      created_by_user_id: userId,
      assigned_by_user_id: userId,
      status: "todo",
    };

    // Set assigned_user_id or assigned_department_id based on assigned_to_type
    if (data.assigned_to_type === "user") {
      insertData.assigned_user_id = data.assigned_id || userId; // Default to current user if not specified
    } else {
      insertData.assigned_department_id = data.assigned_id || null;
    }

    // Insert task
    const { data: task, error } = await supabase
      .from("tasks")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating task:", error);
      throw error;
    }

    if (!task) {
      throw new Error("Failed to create task");
    }

    return task.id;
  } catch (error) {
    console.error("Error in createTask service:", error);
    throw error;
  }
}

/**
 * Update an existing task
 *
 * @param supabase - Supabase client instance
 * @param taskId - Task ID to update
 * @param data - Task update data (partial)
 * @returns void
 */
export async function updateTask(
  supabase: SupabaseClient<Database>,
  taskId: string,
  data: UpdateTaskCommand
): Promise<void> {
  try {
    // Fetch current assignment to detect changes
    const { data: currentTask, error: fetchError } = await supabase
      .from("tasks")
      .select("assigned_to_type, assigned_user_id")
      .eq("id", taskId)
      .single();

    if (fetchError) {
      console.error("Error fetching current task before update:", fetchError);
      throw fetchError;
    }

    if (!currentTask) {
      throw new Error("Task not found");
    }

    const previousAssignee = currentTask.assigned_to_type === "user" ? currentTask.assigned_user_id : null;
    const nextAssignedToType = data.assigned_to_type ?? currentTask.assigned_to_type;
    const nextAssignee = nextAssignedToType === "user"
      ? data.assigned_user_id ?? currentTask.assigned_user_id
      : null;

    // Prepare update data
    const updateData: Database["public"]["Tables"]["tasks"]["Update"] = {
      ...data,
      updated_at: new Date().toISOString(),
    };    // Update task
    const { error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      throw error;
    }    // Keep plan slots in sync with task assignment
    if (previousAssignee !== nextAssignee) {
      if (nextAssignee) {
        const { error: reassignError } = await supabase
          .from("plan_slots")
          .update({ user_id: nextAssignee })
          .eq("task_id", taskId);

        if (reassignError) {
          console.error("Error reassigning plan slots to new user:", reassignError);
          throw reassignError;
        }
      } else {
        // No direct assignee anymore (e.g., assigned to department) — remove user-specific plan slots
        const { error: deleteError } = await supabase.from("plan_slots").delete().eq("task_id", taskId);

        if (deleteError) {
          console.error("Error removing plan slots after unassigning task:", deleteError);
          throw deleteError;
        }
      }
    }
  } catch (error) {
    console.error("Error in updateTask service:", error);
    throw error;
  }
}