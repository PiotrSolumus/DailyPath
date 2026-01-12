import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const changePasswordSchema = z.object({
  current_password: z.string().min(1, "Aktualne hasło jest wymagane"),
  new_password: z.string().min(8, "Nowe hasło musi mieć co najmniej 8 znaków"),
});

/**
 * POST /api/users/change-password
 * Change current user's password
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: validation.error.errors[0]?.message || "Nieprawidłowe dane",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { current_password, new_password } = validation.data;

    // First, verify the current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current_password,
    });

    if (signInError) {
      return new Response(
        JSON.stringify({
          error: "Authentication error",
          message: "Aktualne hasło jest nieprawidłowe",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update the password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({
          error: "Update error",
          message: "Nie udało się zmienić hasła",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Hasło zostało zmienione pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in POST /api/users/change-password:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
