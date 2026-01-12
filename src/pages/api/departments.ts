import type { APIRoute } from "astro";

/**
 * GET /api/departments
 *
 * List all departments (authenticated users)
 * Used for task assignment dropdowns
 */
export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
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

    const supabaseAdmin = locals.supabaseAdmin;

    // Fetch all departments
    const { data, error } = await supabaseAdmin
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching departments:", error);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się pobrać listy działów",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/departments:", error);
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
