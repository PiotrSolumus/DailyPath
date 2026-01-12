import type { APIRoute } from "astro";
import { planSlotQuerySchema, createPlanSlotSchema } from "@/lib/schemas/plan-slot.schema";
import { listPlanSlots, createPlanSlot } from "@/lib/services/plan-slot.service";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * GET /api/plan-slots
 *
 * List plan slots for a specific user and date range
 *
 * Query Parameters:
 * - user_id: User ID (UUID, required)
 * - start_date: Start date (YYYY-MM-DD, required)
 * - end_date: End date (YYYY-MM-DD, required)
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce access control
 *
 * Response: 200 OK with PlanSlotDTO[] or error response
 */

/**
 * POST /api/plan-slots
 *
 * Create a new plan slot
 *
 * Body: CreatePlanSlotCommand
 * - task_id: Task ID (UUID)
 * - user_id: User ID (UUID)
 * - period: Time range (tstzrange format)
 * - allow_overlap: Allow overlapping slots (boolean)
 *
 * Validation:
 * - 15-minute alignment required
 * - Only managers can create slots for other users
 * - No overlaps allowed if allow_overlap is false
 *
 * Authentication: Required (Supabase session)
 * Authorization: User must be authenticated
 *
 * Response: 201 Created with slot ID or error response
 */

// Disable prerendering for API routes
export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  // 1. Verify authentication
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
      user_id: searchParams.get("user_id") ?? undefined,
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
    };

    // Validate with Zod schema
    const validation = planSlotQuerySchema.safeParse(rawParams);

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
    // and the service will filter by user_id anyway
    const planSlots = await listPlanSlots(locals.supabaseAdmin, locals.user.id, validation.data);

    // 4. Return successful response
    return new Response(JSON.stringify(planSlots), {
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
  // 1. Verify authentication
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
    const validation = createPlanSlotSchema.safeParse(body);

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

    // 4. Call service layer to create plan slot
    // Use admin client to bypass RLS since we've already verified authentication
    const slotId = await createPlanSlot(locals.supabaseAdmin, locals.user.id, locals.user.app_role, validation.data);

    // 5. Return successful response
    return new Response(JSON.stringify({ id: slotId, message: "Plan slot created successfully" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 6. Handle errors with centralized error handler
    return handleApiError(error);
  }
};
