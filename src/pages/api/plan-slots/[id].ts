import type { APIRoute } from "astro";
import { updatePlanSlotSchema } from "@/lib/schemas/plan-slot.schema";
import { updatePlanSlot, deletePlanSlot } from "@/lib/services/plan-slot.service";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * PATCH /api/plan-slots/:id
 *
 * Update an existing plan slot
 *
 * Body: UpdatePlanSlotInput (partial)
 * - period: Time range (tstzrange format, optional)
 * - allow_overlap: Allow overlapping slots (boolean, optional)
 *
 * Validation:
 * - 15-minute alignment required if period is updated
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce access control
 *
 * Response: 200 OK or error response
 */

/**
 * DELETE /api/plan-slots/:id
 *
 * Delete a plan slot
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce access control
 *
 * Response: 204 No Content or error response
 */

// Disable prerendering for API routes
export const prerender = false;

export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

  // 2. Validate slot ID
  const slotId = params.id;
  if (!slotId) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        message: "Slot ID is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 3. Parse request body
    const body = await request.json();

    // 4. Validate with Zod schema
    const validation = updatePlanSlotSchema.safeParse(body);

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

    // 5. Call service layer to update plan slot
    // Use admin client to bypass RLS since we've already verified authentication
    await updatePlanSlot(locals.supabaseAdmin, locals.user.id, slotId, validation.data);

    // 6. Return successful response
    return new Response(JSON.stringify({ message: "Plan slot updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 7. Handle errors with centralized error handler
    return handleApiError(error);
  }
};

export const DELETE: APIRoute = async ({ locals, params }) => {
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

  // 2. Validate slot ID
  const slotId = params.id;
  if (!slotId) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        message: "Slot ID is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 3. Call service layer to delete plan slot
    // Use admin client to bypass RLS since we've already verified authentication
    await deletePlanSlot(locals.supabaseAdmin, locals.user.id, slotId);

    // 4. Return successful response
    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    // 5. Handle errors with centralized error handler
    return handleApiError(error);
  }
};
