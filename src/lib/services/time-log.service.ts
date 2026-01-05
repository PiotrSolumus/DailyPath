import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";
import type { TimeLogDTO, CreateTimeLogCommand, UpdateTimeLogCommand } from "@/types";
import { HttpError } from "@/lib/utils/http-error";

/**
 * Time Log Service
 * Handles business logic for time log management (CRUD operations)
 * 
 * Rules:
 * - Time logs are automatically rounded to 15-minute intervals by database trigger
 * - Users can only edit/delete logs from the last 7 days
 * - Managers can view time logs for their department members
 * - Admin can view all time logs
 */

/**
 * Parse PostgreSQL tstzrange format to extract upper bound timestamp
 * @param tstzrange - Range string like '["2026-01-05 14:00:00+00","2026-01-05 16:00:00+00")'
 * @returns Upper bound timestamp or null if parsing fails
 */
function parsePeriodUpperBound(tstzrange: string): string | null {
  try {
    const match = tstzrange.match(/,\s*"([^"]+)"[\)\]]/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error("Error parsing tstzrange:", tstzrange, error);
    return null;
  }
}

export interface TimeLogQueryParams {
  user_id?: string;
  task_id?: string;
  start_date?: string; // ISO date string
  end_date?: string;   // ISO date string
}

/**
 * List time logs with filtering
 * 
 * @param supabase - Supabase client instance (from context.locals)
 * @param userId - Current authenticated user ID
 * @param userRole - Current user's app_role
 * @param filters - Query parameters for filtering
 * @returns Array of TimeLogDTO
 */
export async function listTimeLogs(
  supabase: SupabaseClient<Database>,
  userId: string,
  userRole: string,
  filters: TimeLogQueryParams
): Promise<TimeLogDTO[]> {
  try {
    // Build base query
    // Note: Cannot order by tstzrange type directly, so we'll sort in-memory
    let query = supabase
      .from("time_logs")
      .select("id, task_id, user_id, period");

    // SECURITY: In no-auth/dev mode we often use service role (bypass RLS).
    // Force scope to the current user unless explicitly overridden elsewhere.
    const effectiveUserId = filters.user_id ?? userId;

    // Apply filters
    query = query.eq("user_id", effectiveUserId);

    if (filters.task_id) {
      query = query.eq("task_id", filters.task_id);
    }

    // Date range filtering (filter by lower(period))
    if (filters.start_date) {
      query = query.gte("period", `[${filters.start_date},)`);
    }

    if (filters.end_date) {
      query = query.lte("period", `(,${filters.end_date}]`);
    }

    // Execute query (RLS policies automatically filter based on user permissions)
    const { data: timeLogs, error } = await query;

    if (error) {
      console.error("Error fetching time logs:", error);
      throw error;
    }

    if (!timeLogs || timeLogs.length === 0) {
      return [];
    }

    // Map to DTO
    const timeLogDTOs: TimeLogDTO[] = timeLogs.map((log) => ({
      id: log.id.toString(),
      task_id: log.task_id,
      user_id: log.user_id,
      period: log.period,
    }));

    // Sort by period in memory (descending - newest first)
    timeLogDTOs.sort((a, b) => {
      const periodA = parsePeriodUpperBound(a.period);
      const periodB = parsePeriodUpperBound(b.period);
      if (!periodA || !periodB) return 0;
      return new Date(periodB).getTime() - new Date(periodA).getTime();
    });

    return timeLogDTOs;
  } catch (error) {
    console.error("Error in listTimeLogs service:", error);
    throw error;
  }
}

/**
 * Create a new time log
 * 
 * Note: The period will be automatically rounded to 15-minute intervals by the database trigger
 * 
 * @param supabase - Supabase client instance
 * @param userId - Current authenticated user ID
 * @param data - Time log creation data
 * @returns Created time log ID
 */
export async function createTimeLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  data: CreateTimeLogCommand
): Promise<string> {
  try {
    // Prepare insert data
    const insertData: Database["public"]["Tables"]["time_logs"]["Insert"] = {
      task_id: data.task_id,
      user_id: userId,
      period: data.period,
      created_by_user_id: userId,
    };

    // Insert time log
    const { data: timeLog, error } = await supabase
      .from("time_logs")
      .insert(insertData)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating time log:", error);
      throw error;
    }

    if (!timeLog) {
      throw new Error("Failed to create time log");
    }

    return timeLog.id.toString();
  } catch (error) {
    console.error("Error in createTimeLog service:", error);
    throw error;
  }
}

/**
 * Update a time log
 * 
 * Note: Can only update time logs from the last 7 days (enforced by database trigger)
 * 
 * @param supabase - Supabase client instance
 * @param timeLogId - Time log ID to update
 * @param data - Update data
 * @returns Success boolean
 */
export async function updateTimeLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  timeLogId: string,
  data: UpdateTimeLogCommand
): Promise<boolean> {
  try {
    // SECURITY: ensure user can only edit their own time logs (service role bypasses RLS)
    const { data: existing, error: existingError } = await supabase
      .from("time_logs")
      .select("id, user_id")
      .eq("id", timeLogId)
      .single();

    if (existingError) {
      console.error("Error fetching time log before update:", existingError);
      throw existingError;
    }

    if (!existing || existing.user_id !== userId) {
      throw new HttpError({
        status: 403,
        error: "Forbidden",
        message: "Nie masz dostępu do tego logu czasu",
      });
    }

    const updateData: Database["public"]["Tables"]["time_logs"]["Update"] = {
      period: data.period,
    };

    const { error } = await supabase
      .from("time_logs")
      .update(updateData)
      .eq("id", timeLogId);

    if (error) {
      console.error("Error updating time log:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in updateTimeLog service:", error);
    throw error;
  }
}

/**
 * Delete a time log
 * 
 * Note: Can only delete time logs from the last 7 days (enforced by database trigger)
 * 
 * @param supabase - Supabase client instance
 * @param timeLogId - Time log ID to delete
 * @returns Success boolean
 */
export async function deleteTimeLog(
  supabase: SupabaseClient<Database>,
  userId: string,
  timeLogId: string
): Promise<boolean> {
  try {
    // SECURITY: ensure user can only delete their own time logs (service role bypasses RLS)
    const { data: existing, error: existingError } = await supabase
      .from("time_logs")
      .select("id, user_id")
      .eq("id", timeLogId)
      .single();

    if (existingError) {
      console.error("Error fetching time log before delete:", existingError);
      throw existingError;
    }

    if (!existing || existing.user_id !== userId) {
      throw new HttpError({
        status: 403,
        error: "Forbidden",
        message: "Nie masz dostępu do tego logu czasu",
      });
    }

    const { error } = await supabase
      .from("time_logs")
      .delete()
      .eq("id", timeLogId);

    if (error) {
      console.error("Error deleting time log:", error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteTimeLog service:", error);
    throw error;
  }
}

/**
 * Get time logs for a specific task
 * Helper function to aggregate total logged time for a task
 * 
 * @param supabase - Supabase client instance
 * @param taskId - Task ID
 * @returns Total logged minutes for the task
 */
export async function getTaskLoggedMinutes(
  supabase: SupabaseClient<Database>,
  taskId: string
): Promise<number> {
  try {
    const { data: logs, error } = await supabase
      .from("time_logs")
      .select("period")
      .eq("task_id", taskId);

    if (error) {
      console.error("Error fetching task time logs:", error);
      throw error;
    }

    if (!logs || logs.length === 0) {
      return 0;
    }

    // Parse tstzrange and calculate total minutes
    // tstzrange format: "[2024-01-01 10:00:00+00,2024-01-01 10:15:00+00)"
    let totalMinutes = 0;
    for (const log of logs) {
      const match = log.period.match(/\[(.*?),(.*?)\)/);
      if (match) {
        const start = new Date(match[1]);
        const end = new Date(match[2]);
        const minutes = (end.getTime() - start.getTime()) / (1000 * 60);
        totalMinutes += minutes;
      }
    }

    return totalMinutes;
  } catch (error) {
    console.error("Error in getTaskLoggedMinutes service:", error);
    throw error;
  }
}

