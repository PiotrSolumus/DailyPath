import { z } from "zod";

/**
 * Query parameters schema for GET /api/plan-slots endpoint
 * Validates filtering options for plan slot retrieval
 */
export const planSlotQuerySchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)"),
});

export type PlanSlotQueryParams = z.infer<typeof planSlotQuerySchema>;

/**
 * Schema for POST /api/plan-slots endpoint
 * Validates plan slot creation payload
 */
export const createPlanSlotSchema = z.object({
  task_id: z.string().uuid("Invalid task ID"),
  user_id: z.string().uuid("Invalid user ID"),
  period: z.string().regex(/^\[.+,\s*.+\)$/, "Invalid period format (expected tstzrange)"),
  allow_overlap: z.boolean().default(false),
});

export type CreatePlanSlotInput = z.infer<typeof createPlanSlotSchema>;

/**
 * Schema for PATCH /api/plan-slots/:id endpoint
 * Validates plan slot update payload
 */
export const updatePlanSlotSchema = z.object({
  period: z
    .string()
    .regex(/^\[.+,\s*.+\)$/, "Invalid period format (expected tstzrange)")
    .optional(),
  allow_overlap: z.boolean().optional(),
});

export type UpdatePlanSlotInput = z.infer<typeof updatePlanSlotSchema>;
