import type { APIRoute } from "astro";
import { taskQuerySchema, createTaskSchema } from "@/lib/schemas/task.schema";
import { listTasks, createTask } from "@/lib/services/task.service";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * GET /api/tasks
 *
 * List tasks with filtering for dashboard/plan view
 * Includes calculated ETA based on planned slots and privacy masking
 *
 * Query Parameters:
 * - status: Filter by task status (todo, in_progress, blocked, done)
 * - priority: Filter by priority (low, medium, high)
 * - department_id: Filter by assigned department (UUID)
 * - assigned_to_user_id: Filter by assigned user (UUID)
 * - is_private: Filter by privacy flag (boolean)
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce role-based access control
 *
 * Response: 200 OK with TaskDTO[] or error response
 */

/**
 * POST /api/tasks
 *
 * Create a new task
 *
 * Body: CreateTaskCommand
 *
 * Authentication: Required (Supabase session)
 * Authorization: User must be authenticated (RLS handles further checks)
 *
 * Response: 201 Created with task ID or error response
 */

// Disable prerendering for API routes
export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  // 1. Verify user selection (no real auth in test mode)
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Proszę wybrać użytkownika na stronie /login",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 2. Parse and validate query parameters
    const searchParams = url.searchParams;
    const rawParams = {
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      department_id: searchParams.get("department_id") ?? undefined,
      assigned_to_user_id: searchParams.get("assigned_to_user_id") ?? undefined,
      is_private: searchParams.get("is_private") ?? undefined,
    };

    // Validate with Zod schema
    const validation = taskQuerySchema.safeParse(rawParams);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          message: "One or more query parameters are invalid",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Call service layer with validated parameters
    // Use admin client to bypass RLS since we've already verified authentication
    const tasks = await listTasks(locals.supabaseAdmin, locals.user.id, locals.user.app_role, validation.data);

    // 4. Return successful response
    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30", // Cache for 30 seconds
      },
    });
  } catch (error) {
    // 5. Handle errors with centralized error handler
    return handleApiError(error);
  }
};

export const POST: APIRoute = async ({ locals, request }) => {
  // 1. Verify user selection (no real auth in test mode)
  if (!locals.user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Proszę wybrać użytkownika na stronie /login",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 2. Parse request body
    const body = await request.json();

    // 3. Validate with Zod schema
    const validation = createTaskSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          message: "One or more fields are invalid",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 4. Call service layer to create task
    // Use admin client to bypass RLS since we've already verified authentication
    const taskId = await createTask(locals.supabaseAdmin, locals.user.id, validation.data);

    // 5. Return successful response
    return new Response(
      JSON.stringify({ id: taskId, message: "Task created successfully" }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // 6. Handle errors with centralized error handler
    return handleApiError(error);
  }
};

