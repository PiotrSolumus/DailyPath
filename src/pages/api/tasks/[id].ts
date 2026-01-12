import type { APIRoute } from "astro";
import { updateTaskSchema } from "@/lib/schemas/task.schema";
import { updateTask, deleteTask } from "@/lib/services/task.service";
import { handleApiError } from "@/lib/utils/error-handler";

/**
 * PATCH /api/tasks/:id
 *
 * Update an existing task
 *
 * Body: UpdateTaskCommand
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce role-based access control
 *
 * Response: 200 OK or error response
 */

// Disable prerendering for API routes
export const prerender = false;

export const PATCH: APIRoute = async ({ locals, params, request }) => {
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

  // 2. Validate task ID parameter
  const taskId = params.id;
  if (!taskId) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        message: "Task ID is required",
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
    const validation = updateTaskSchema.safeParse(body);

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

    // 5. Call service layer to update task
    // Use admin client to bypass RLS since we've already verified authentication
    await updateTask(locals.supabaseAdmin, taskId, validation.data);

    // 6. Return successful response
    return new Response(JSON.stringify({ message: "Task updated successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 7. Handle errors with centralized error handler
    return handleApiError(error);
  }
};

/**
 * DELETE /api/tasks/:id
 *
 * Delete an existing task
 *
 * Authentication: Required (Supabase session)
 * Authorization: RLS policies enforce role-based access control
 *
 * Response: 200 OK or error response
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

  // 2. Validate task ID parameter
  const taskId = params.id;
  if (!taskId) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        message: "Task ID is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // 3. Call service layer to delete task
    // Use admin client to bypass RLS since we've already verified authentication
    await deleteTask(locals.supabaseAdmin, taskId);

    // 4. Return successful response
    return new Response(JSON.stringify({ message: "Task deleted successfully" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // 5. Handle errors with centralized error handler
    return handleApiError(error);
  }
};
