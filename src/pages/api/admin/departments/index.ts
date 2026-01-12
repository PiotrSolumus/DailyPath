import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const createDepartmentSchema = z.object({
  name: z.string().min(1, "Nazwa działu jest wymagana"),
  description: z.string().optional(),
});

/**
 * GET /api/admin/departments
 * Get all departments with member counts (Admin only)
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabaseAdmin = locals.supabaseAdmin;
    const user = locals.user;

    // Check if user is authenticated
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    if (user.app_role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Tylko administrator może przeglądać listę działów",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch all departments with member counts and managers
    const { data: departments, error: deptError } = await supabaseAdmin
      .from("departments")
      .select("id, name, created_at, updated_at")
      .order("name", { ascending: true });

    if (deptError) {
      console.error("Error fetching departments:", deptError);
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

    // For each department, get member count and managers
    const departmentsWithDetails = await Promise.all(
      departments.map(async (dept) => {
        // Get all memberships for this department
        const { data: memberships } = await supabaseAdmin
          .from("memberships")
          .select("period")
          .eq("department_id", dept.id);

        // Count active memberships (where upper(period) IS NULL - open-ended range)
        // Since Supabase doesn't support SQL functions directly in queries,
        // we filter in JavaScript
        const memberCount =
          memberships?.filter((m) => {
            // In PostgreSQL, an open-ended range has no upper bound
            // This is represented in the period string, e.g., "[2024-01-01,)"
            const periodStr = m.period as string;
            return periodStr && periodStr.endsWith(",)");
          }).length || 0;

        // Get department managers
        const { data: managers } = await supabaseAdmin
          .from("department_managers")
          .select(
            `
            users:manager_user_id (
              id,
              full_name
            )
          `
          )
          .eq("department_id", dept.id);

        return {
          id: dept.id,
          name: dept.name,
          member_count: memberCount || 0,
          manager:
            managers && managers.length > 0 && managers[0].users
              ? {
                  id: managers[0].users.id,
                  full_name: managers[0].users.full_name,
                }
              : null,
        };
      })
    );

    return new Response(JSON.stringify(departmentsWithDetails), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/departments:", error);
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

/**
 * POST /api/admin/departments
 * Create a new department (Admin only)
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabaseAdmin = locals.supabaseAdmin;
    const user = locals.user;

    // Check if user is authenticated
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    if (user.app_role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Tylko administrator może dodawać działy",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createDepartmentSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: "Nieprawidłowe dane",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { name } = validation.data;

    // Check if department with this name already exists
    const { data: existingDept } = await supabaseAdmin.from("departments").select("id").eq("name", name).single();

    if (existingDept) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Dział o tej nazwie już istnieje",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create department
    const { data: department, error: createError } = await supabaseAdmin
      .from("departments")
      .insert({ name })
      .select()
      .single();

    if (createError) {
      console.error("Error creating department:", createError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się utworzyć działu",
          details: createError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Dział został utworzony pomyślnie",
        department: {
          id: department.id,
          name: department.name,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/departments:", error);
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
