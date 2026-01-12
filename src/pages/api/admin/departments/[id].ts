import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const updateDepartmentSchema = z.object({
  name: z.string().min(1, "Nazwa działu jest wymagana"),
  description: z.string().optional(),
});

const parsePeriodBounds = (period: string): { lower: string | null; upper: string | null } => {
  const match = period.match(/^\[([^,]+),([^\)]*)\)/);
  if (!match) return { lower: null, upper: null };
  const lower = match[1] ?? null;
  const upperRaw = match[2] ?? "";
  const upper = upperRaw.length > 0 ? upperRaw : null; // null means open-ended
  return { lower, upper };
};

/**
 * GET /api/admin/departments/:id
 * List active members of a department (Admin only)
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    const supabaseAdmin = locals.supabaseAdmin;
    const user = locals.user;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Musisz być zalogowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (user.app_role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Forbidden",
          message: "Tylko administrator może przeglądać członków działu",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const departmentId = params.id;
    if (!departmentId) {
      return new Response(JSON.stringify({ error: "Bad request", message: "ID działu jest wymagane" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure department exists
    const { data: department } = await supabaseAdmin.from("departments").select("id").eq("id", departmentId).single();
    if (!department) {
      return new Response(JSON.stringify({ error: "Not found", message: "Dział nie został znaleziony" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get memberships and resolve active ones in JS
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("memberships")
      .select(
        `
        period,
        users:user_id (
          id,
          full_name,
          email
        )
      `
      )
      .eq("department_id", departmentId);

    if (membershipsError) {
      console.error("Error fetching department members:", membershipsError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się pobrać członków działu",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const activeMembers =
      memberships
        ?.filter((membership) => {
          const period = membership.period as string;
          if (typeof period !== "string") return false;
          const { lower, upper } = parsePeriodBounds(period);
          if (!lower) return false;
          return today >= lower && (!upper || today < upper);
        })
        .map((membership) => ({
          id: membership.users?.id ?? "",
          full_name: membership.users?.full_name ?? "",
          email: membership.users?.email ?? "",
        }))
        .filter((member) => member.id && member.full_name && member.email) ?? [];

    return new Response(JSON.stringify(activeMembers), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/departments/:id:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/admin/departments/:id
 * Update a department (Admin only)
 */
export const PATCH: APIRoute = async ({ request, locals, params }) => {
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
          message: "Tylko administrator może edytować działy",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get department ID from params
    const departmentId = params.id;

    if (!departmentId) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "ID działu jest wymagane",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = updateDepartmentSchema.safeParse(body);

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

    // Check if department exists
    const { data: existingDept } = await supabaseAdmin.from("departments").select("id").eq("id", departmentId).single();

    if (!existingDept) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Dział nie został znaleziony",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if another department with this name exists
    const { data: duplicateDept } = await supabaseAdmin
      .from("departments")
      .select("id")
      .eq("name", name)
      .neq("id", departmentId)
      .single();

    if (duplicateDept) {
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

    // Update department
    const { data: department, error: updateError } = await supabaseAdmin
      .from("departments")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", departmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating department:", updateError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się zaktualizować działu",
          details: updateError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Dział został zaktualizowany pomyślnie",
        department: {
          id: department.id,
          name: department.name,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in PATCH /api/admin/departments/:id:", error);
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
 * DELETE /api/admin/departments/:id
 * Delete a department (Admin only)
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
          message: "Tylko administrator może usuwać działy",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get department ID from params
    const departmentId = params.id;

    if (!departmentId) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "ID działu jest wymagane",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if department exists
    const { data: existingDept } = await supabaseAdmin.from("departments").select("id").eq("id", departmentId).single();

    if (!existingDept) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Dział nie został znaleziony",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if department has active memberships
    const { data: memberships } = await supabaseAdmin
      .from("memberships")
      .select("period")
      .eq("department_id", departmentId);

    // Count active memberships (where upper(period) IS NULL - open-ended range)
    const activeMemberCount =
      memberships?.filter((m) => {
        const periodStr = m.period as string;
        return periodStr && periodStr.endsWith(",)");
      }).length || 0;

    if (activeMemberCount > 0) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Nie można usunąć działu, który ma aktywnych członków",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete department
    const { error: deleteError } = await supabaseAdmin.from("departments").delete().eq("id", departmentId);

    if (deleteError) {
      console.error("Error deleting department:", deleteError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się usunąć działu",
          details: deleteError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Dział został usunięty pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/departments/:id:", error);
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
