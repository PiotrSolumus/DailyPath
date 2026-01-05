import type { APIRoute } from "astro";
import { z } from "zod";
import { getTasksByIds } from "@/lib/services/task.service";
import { handleApiError } from "@/lib/utils/error-handler";

export const prerender = false;

const querySchema = z.object({
  ids: z
    .string()
    .min(1, "ids is required")
    .transform((v) => v.split(",").map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string().uuid()).min(1, "ids must include at least one UUID").max(200, "Too many ids")),
});

/**
 * GET /api/tasks/by-ids?ids=uuid,uuid,...
 *
 * Fetches tasks by explicit IDs. Useful for calendar views where you only need
 * tasks referenced by plan slots.
 */
export const GET: APIRoute = async ({ locals, url }) => {
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
    const raw = { ids: url.searchParams.get("ids") ?? "" };
    const validation = querySchema.safeParse(raw);

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

    const tasks = await getTasksByIds(
      locals.supabaseAdmin,
      locals.user.id,
      locals.user.app_role,
      validation.data.ids
    );

    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=30",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
};



