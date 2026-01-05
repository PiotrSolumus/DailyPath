import { z } from "zod";

/**
 * Query parameters schema for GET /api/tasks endpoint
 * Validates filtering options for task retrieval
 */
export const taskQuerySchema = z.object({
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  department_id: z.string().uuid().optional(),
  assigned_to_user_id: z.string().uuid().optional(),
  is_private: z.coerce.boolean().optional(),
});

export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

/**
 * Schema for POST /api/tasks endpoint
 * Validates task creation payload
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  description: z.string().max(5000, "Description is too long").nullable().default(null),
  priority: z.enum(["low", "medium", "high"]),
  estimate_minutes: z.number().min(15, "Estimate must be at least 15 minutes").multipleOf(15, "Estimate must be a multiple of 15"),
  assigned_to_type: z.enum(["user", "department"]),
  is_private: z.boolean().default(false),
  due_date: z.string().nullable().default(null),
  assigned_id: z.string().uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * Schema for PATCH /api/tasks/:id endpoint
 * Validates task update payload - all fields are optional
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title is too long").optional(),
  description: z.string().max(5000, "Description is too long").nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["todo", "in_progress", "blocked", "done"]).optional(),
  estimate_minutes: z.number().min(15, "Estimate must be at least 15 minutes").multipleOf(15, "Estimate must be a multiple of 15").optional(),
  assigned_to_type: z.enum(["user", "department"]).optional(),
  assigned_user_id: z.string().uuid().nullable().optional(),
  assigned_department_id: z.string().uuid().nullable().optional(),
  is_private: z.boolean().optional(),
  due_date: z.string().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
