import type { APIRoute } from "astro";
import { updateTimeLogSchema } from "@/lib/schemas/time-log.schema";
import { updateTimeLog, deleteTimeLog } from "@/lib/services/time-log.service";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * PATCH /api/time-logs/:id
 *
 * Update an existing time log
 * Can only update time logs from the last 7 days (enforced by database)
 *
 * Body: UpdateTimeLogCommand
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce role-based access control
 *
 * Response: 200 OK or error response
 */

/**
 * DELETE /api/time-logs/:id
 *
 * Delete an existing time log
 * Can only delete time logs from the last 7 days (enforced by database)
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce role-based access control
 *
 * Response: 200 OK or error response
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

  // 2. Validate time log ID parameter
  const timeLogId = params.id;
  if (!timeLogId) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        message: "Time log ID is required",
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
    const validation = updateTimeLogSchema.safeParse(body);

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

    // 5. Call service layer to update time log
    // Use admin client to bypass RLS since we've already verified authentication
    await updateTimeLog(locals.supabaseAdmin, locals.user.id, timeLogId, validation.data);

    // 6. Return successful response
    return new Response(
      JSON.stringify({ message: "Time log updated successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
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

  // 2. Validate time log ID parameter
  const timeLogId = params.id;
  if (!timeLogId) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        message: "Time log ID is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 3. Call service layer to delete time log
    // Use admin client to bypass RLS since we've already verified authentication
    await deleteTimeLog(locals.supabaseAdmin, locals.user.id, timeLogId);

    // 4. Return successful response
    return new Response(
      JSON.stringify({ message: "Time log deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // 5. Handle errors with centralized error handler
    return handleApiError(error);
  }
};

