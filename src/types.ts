import type { Tables, TablesInsert, TablesUpdate, Enums } from "./db/database.types";

/**
 * Common type for Postgres ranges (tstzrange, int4range, etc.)
 * which are transferred as strings in JSON.
 */
export type PgRange = string;

// --- Users & Profile ---

/**
 * GET /api/users/me
 * Returns the current authenticated user's profile and active department.
 */
export interface UserMeDTO extends Pick<Tables<"users">, "id" | "email" | "full_name" | "app_role" | "timezone"> {
  active_department: {
    id: string;
    name: string;
  } | null;
}

/**
 * Working hour period for a single weekday.
 */
export interface WorkingHourScheduleItem {
  weekday: number;
  periods: string[]; // Array of time ranges like "[480, 720)"
}

/**
 * GET /api/users/:id/working-hours
 * Returns the weekly working hour configuration for a user.
 */
export interface UserWorkingHoursDTO {
  user_id: string;
  schedule: WorkingHourScheduleItem[];
}

// --- Tasks ---

/**
 * GET /api/tasks
 * List tasks with filtering for dashboard/plan view.
 * Includes calculated ETA based on planned slots.
 */
export interface TaskDTO extends Omit<Tables<"tasks">, "created_at" | "updated_at"> {
  /** Dynamic ETA calculated by summing planned slots */
  eta: string | null;
  assigned_by_user_name?: string | null;
}

/**
 * POST /api/tasks
 * Command model for creating a new task.
 */
export interface CreateTaskCommand
  extends Pick<
    TablesInsert<"tasks">,
    "title" | "description" | "priority" | "estimate_minutes" | "assigned_to_type" | "is_private" | "due_date"
  > {
  /**
   * Maps to assigned_user_id or assigned_department_id
   * depending on assigned_to_type.
   */
  assigned_id?: string;
}

/**
 * PATCH /api/tasks/:id
 * Command model for updating an existing task.
 */
export type UpdateTaskCommand = Partial<
  Pick<
    TablesUpdate<"tasks">,
    | "title"
    | "description"
    | "priority"
    | "status"
    | "estimate_minutes"
    | "assigned_to_type"
    | "assigned_user_id"
    | "assigned_department_id"
    | "is_private"
    | "due_date"
  >
>;

// --- Planning (Calendar) ---

/**
 * GET /api/plan-slots
 * Data Transfer Object for a planning entry.
 */
export interface PlanSlotDTO extends Pick<Tables<"plan_slots">, "id" | "task_id" | "user_id" | "allow_overlap"> {
  /** String representation of tstzrange */
  period: PgRange;
}

/**
 * POST /api/plan-slots
 * Command model for creating a plan slot.
 */
export interface CreatePlanSlotCommand
  extends Pick<TablesInsert<"plan_slots">, "task_id" | "user_id" | "allow_overlap"> {
  /** String representation of tstzrange (must be 15-minute aligned) */
  period: PgRange;
}

// --- Time Tracking ---

/**
 * GET /api/time-logs (implied for list views)
 */
export interface TimeLogDTO extends Pick<Tables<"time_logs">, "id" | "task_id" | "user_id"> {
  /** String representation of tstzrange */
  period: PgRange;
}

/**
 * POST /api/time-logs
 * Command model for recording work against a task.
 */
export interface CreateTimeLogCommand extends Pick<TablesInsert<"time_logs">, "task_id"> {
  /** String representation of tstzrange (must be 15-minute aligned) */
  period: PgRange;
}

/**
 * PATCH /api/time-logs/:id
 * Command model for updating a time log.
 */
export interface UpdateTimeLogCommand {
  /** String representation of tstzrange */
  period: PgRange;
}

// --- Reports & Analytics ---

/**
 * GET /api/reports/daily
 * Aggregated metrics for a specific date/department/user.
 */
export interface DailyReportDTO {
  date: string;
  user_id?: string;
  user_name?: string;
  department_id?: string;
  department_name?: string | null;
  logged_minutes: number;
  plan_minutes: number;
  task_summary: {
    status: Enums<"task_status">;
    count: number;
  }[];
}

/**
 * POST /api/events
 * Command model for tracking custom events.
 */
export interface CreateEventCommand {
  event_type: string;
  props?: Record<string, unknown>;
}
