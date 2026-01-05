import type { APIRoute } from "astro";
import { timeLogQuerySchema, createTimeLogSchema } from "@/lib/schemas/time-log.schema";
import { listTimeLogs, createTimeLog } from "@/lib/services/time-log.service";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * GET /api/time-logs
 *
 * List time logs with filtering
 * Includes automatic 15-minute rounding and 7-day edit restrictions
 *
 * Query Parameters:
 * - user_id: Filter by user (UUID)
 * - task_id: Filter by task (UUID)
 * - start_date: Filter by start date (ISO datetime string)
 * - end_date: Filter by end date (ISO datetime string)
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce role-based access control
 *
 * Response: 200 OK with TimeLogDTO[] or error response
 */

/**
 * POST /api/time-logs
 *
 * Create a new time log entry
 * The period will be automatically rounded to 15-minute intervals
 *
 * Body: CreateTimeLogCommand
 *
 * Authentication: Required (Supabase session)
 * Authorization: User must be authenticated (RLS handles further checks)
 *
 * Response: 201 Created with time log ID or error response
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
      task_id: searchParams.get("task_id") ?? undefined,
      start_date: searchParams.get("start_date") ?? undefined,
      end_date: searchParams.get("end_date") ?? undefined,
    };

    // Validate with Zod schema
    const validation = timeLogQuerySchema.safeParse(rawParams);

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

    // 3. Force scope to current user (time logs are always per logged-in user)
    // SECURITY: In no-auth/dev mode we use service role (bypass RLS), so we must enforce this here.
    const scopedFilters = { ...validation.data, user_id: locals.user.id };

    // 4. Call service layer with validated parameters
    // Use admin client to bypass RLS since we've already verified authentication
    const timeLogs = await listTimeLogs(
      locals.supabaseAdmin,
      locals.user.id,
      locals.user.app_role,
      scopedFilters
    );

    // 5. Return successful response
    return new Response(JSON.stringify(timeLogs), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30", // Cache for 30 seconds
      },
    });
  } catch (error) {
    // 6. Handle errors with centralized error handler
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
    const validation = createTimeLogSchema.safeParse(body);

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

    // 4. Call service layer to create time log
    // Use admin client to bypass RLS since we've already verified authentication
    const timeLogId = await createTimeLog(locals.supabaseAdmin, locals.user.id, validation.data);

    // 5. Return successful response
    return new Response(
      JSON.stringify({ id: timeLogId, message: "Time log created successfully" }),
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

