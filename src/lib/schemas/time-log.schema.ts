import { z } from "zod";

/**
 * Query parameters schema for GET /api/time-logs endpoint
 * Validates filtering options for time log retrieval
 */
export const timeLogQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export type TimeLogQueryParams = z.infer<typeof timeLogQuerySchema>;

/**
 * Schema for POST /api/time-logs endpoint
 * Validates time log creation payload
 * 
 * Note: The period will be automatically rounded to 15-minute intervals by the database
 */
export const createTimeLogSchema = z.object({
  task_id: z.string().uuid({ message: "Valid task ID is required" }),
  period: z.string().min(1, "Period is required"),
});

export type CreateTimeLogInput = z.infer<typeof createTimeLogSchema>;

/**
 * Schema for PATCH /api/time-logs/:id endpoint
 * Validates time log update payload
 * 
 * Note: Can only update time logs from the last 7 days (enforced by database)
 */
export const updateTimeLogSchema = z.object({
  period: z.string().min(1, "Period is required"),
});

export type UpdateTimeLogInput = z.infer<typeof updateTimeLogSchema>;

