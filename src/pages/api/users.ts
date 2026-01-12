import type { APIRoute } from "astro";

/**
 * GET /api/users
 *
 * TEMPORARY: List all users (no authentication required in test mode)
 * This endpoint is for testing purposes only
 */
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabaseAdmin = locals.supabaseAdmin;

    // Fetch all users
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, app_role, is_active")
      .order("app_role", { ascending: false })
      .order("email", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się pobrać listy użytkowników",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/users:", error);
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
