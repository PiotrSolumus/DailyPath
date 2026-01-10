import type { APIRoute } from "astro";
import { requestPasswordResetSchema } from "../../../lib/schemas/auth.schema";
import { createClient } from "../../../lib/supabase/server";

/**
 * POST /api/auth/request-password-reset
 *
 * Initiates password reset process for a user.
 * Sends password reset email with token.
 *
 * Security note: Always returns success to prevent email enumeration attacks.
 *
 * Request body:
 * - email: string (required, valid email)
 *
 * Response:
 * - 200: Request processed (email sent if user exists)
 * - 400: Invalid request body
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = requestPasswordResetSchema.safeParse(body);

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

    const { email } = validation.data;

    const supabase = createClient(cookies, request.headers);

    // Request password reset email
    // Note: Supabase will only send email if user exists
    // Error is not exposed to prevent email enumeration
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/reset-password`,
    });

    if (error) {
      console.error("Error requesting password reset:", error);
      // Still return success to prevent email enumeration
    }

    console.log(`✅ Password reset requested for: ${email}`);

    // Always return success message (security best practice)
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Jeśli konto o podanym adresie email istnieje, wysłaliśmy link do resetu hasła.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in request-password-reset endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas przetwarzania żądania",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
