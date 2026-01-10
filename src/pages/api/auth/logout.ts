import type { APIRoute } from "astro";
import { createClient } from "../../../lib/supabase/server";

/**
 * POST /api/auth/logout
 *
 * Logs out the current user and clears their session.
 * Removes session cookies.
 *
 * Response:
 * - 200: Logout successful
 * - 500: Server error
 */
export const POST: APIRoute = async ({ cookies, request }) => {
  try {
    const supabase = createClient(cookies, request.headers);

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({
          error: "Wystąpił błąd podczas wylogowywania",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ User logged out");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in logout endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas wylogowywania",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
