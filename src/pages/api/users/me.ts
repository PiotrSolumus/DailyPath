import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const updateProfileSchema = z.object({
  full_name: z.string().min(1, "Imię i nazwisko nie może być puste").optional(),
  timezone: z.string().optional(),
});

/**
 * GET /api/users/me
 * Get current user's profile
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return user from locals (already in UserMeDTO format from middleware)
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/users/me:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

/**
 * PATCH /api/users/me
 * Update current user's profile
 */
export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: validation.error.errors[0]?.message || "Nieprawidłowe dane",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const { full_name, timezone } = validation.data;

    // Build update object with only provided fields
    const updateData: { full_name?: string; timezone?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }

    if (timezone !== undefined) {
      updateData.timezone = timezone;
    }

    // Update user profile
    const { data, error } = await supabase.from("users").update(updateData).eq("id", user.id).select().single();

    if (error) {
      console.error("Error updating user profile:", error);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się zaktualizować profilu",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in PATCH /api/users/me:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

