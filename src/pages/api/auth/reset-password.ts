import type { APIRoute } from "astro";
import { resetPasswordSchema } from "../../../lib/schemas/auth.schema";
import { createClient } from "../../../lib/supabase/server";

/**
 * POST /api/auth/reset-password
 *
 * Completes password reset process with token.
 * Updates user password in Supabase Auth.
 *
 * Request body:
 * - token: string (required, password reset token from email)
 * - password: string (required, min 6 chars)
 *
 * Response:
 * - 200: Password reset successful
 * - 400: Invalid request body or invalid/expired token
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = resetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { token, password } = validation.data;

    const supabase = createClient(cookies, request.headers);

    // Verify the reset token by exchanging it for a session
    const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (sessionError || !sessionData.session) {
      console.error("Error verifying reset token:", sessionError);
      return new Response(
        JSON.stringify({
          error: "Token resetowania hasła jest nieprawidłowy lub wygasł",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update user password
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      return new Response(
        JSON.stringify({
          error: "Nie udało się zaktualizować hasła",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Password reset successful for user: ${sessionData.user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hasło zostało zmienione pomyślnie. Możesz się teraz zalogować.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in reset-password endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas resetowania hasła",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
