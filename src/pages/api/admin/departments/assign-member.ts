import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const assignMemberSchema = z.object({
  user_id: z.string().uuid({ message: "Nieprawidłowe ID użytkownika" }),
  department_id: z.string().uuid({ message: "Nieprawidłowe ID działu" }),
  start_date: z.string().optional(),
});

const removeMemberSchema = z.object({
  user_id: z.string().uuid({ message: "Nieprawidłowe ID użytkownika" }),
  department_id: z.string().uuid({ message: "Nieprawidłowe ID działu" }),
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
 * POST /api/admin/departments/assign-member
 * Przypisuje użytkownika do działu (tworzy nowe członkostwo od wskazanej daty)
 */
export const POST: APIRoute = async ({ request, locals }) => {
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
          message: "Tylko administrator może przypisywać użytkowników do działów",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const validation = assignMemberSchema.safeParse(body);

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

    const { user_id, department_id, start_date } = validation.data;
    const startDate = start_date ? new Date(start_date) : new Date();
    const startDateStr = startDate.toISOString().split("T")[0];

    // Validate target user
    const { data: targetUser } = await supabaseAdmin.from("users").select("id").eq("id", user_id).maybeSingle();
    if (!targetUser) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Użytkownik nie istnieje",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate target department
    const { data: targetDept } = await supabaseAdmin
      .from("departments")
      .select("id, name")
      .eq("id", department_id)
      .single();
    if (!targetDept) {
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

    // Fetch memberships and determine active one in JS (avoid contains on daterange)
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("memberships")
      .select("id, period, department_id")
      .eq("user_id", user_id);

    if (membershipsError) {
      console.error("Error fetching memberships:", membershipsError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się sprawdzić bieżącego działu użytkownika",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const activeMembership = memberships?.find((membership) => {
      const period = membership.period as string;
      if (typeof period !== "string") return false;
      const { lower, upper } = parsePeriodBounds(period);
      if (!lower) return false;
      return startDateStr >= lower && (!upper || startDateStr < upper);
    });

    // If already assigned to the same department, return success (idempotent)
    if (activeMembership && activeMembership.department_id === department_id) {
      return new Response(
        JSON.stringify({
          message: "Użytkownik już należy do tego działu",
          department: { id: targetDept.id, name: targetDept.name },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Close existing membership if present
    if (activeMembership) {
      const periodStr = activeMembership.period as string;
      const commaIdx = periodStr.indexOf(",");
      const lowerBound = commaIdx > 1 ? periodStr.slice(1, commaIdx) : null;

      if (!lowerBound) {
        return new Response(
          JSON.stringify({
            error: "Invalid state",
            message: "Nie można odczytać obecnego okresu członkostwa",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Prevent closing with a date before the start of the existing membership
      if (startDateStr <= lowerBound) {
        return new Response(
          JSON.stringify({
            error: "Validation error",
            message: "Data rozpoczęcia musi być późniejsza niż początek obecnego członkostwa",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const closedPeriod = `[${lowerBound},${startDateStr})`;
      const { error: closeError } = await supabaseAdmin
        .from("memberships")
        .update({ period: closedPeriod })
        .eq("id", activeMembership.id);

      if (closeError) {
        console.error("Error closing previous membership:", closeError);
        return new Response(
          JSON.stringify({
            error: "Database error",
            message: "Nie udało się zamknąć poprzedniego członkostwa",
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Create new open-ended membership
    const { error: insertError } = await supabaseAdmin.from("memberships").insert({
      user_id,
      department_id,
      period: `[${startDateStr},)`,
    });

    if (insertError) {
      console.error("Error assigning membership:", insertError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się przypisać użytkownika do działu",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Użytkownik został przypisany do działu",
        department: { id: targetDept.id, name: targetDept.name },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/departments/assign-member:", error);
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
 * DELETE /api/admin/departments/assign-member
 * Kończy aktywne członkostwo użytkownika w dziale (ustawia górną granicę na dziś)
 */
export const DELETE: APIRoute = async ({ request, locals }) => {
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
          message: "Tylko administrator może usuwać członków z działu",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const validation = removeMemberSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: "Nieprawidłowe dane",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { user_id, department_id } = validation.data;
    const today = new Date().toISOString().split("T")[0];

    // Ensure department exists
    const { data: department } = await supabaseAdmin.from("departments").select("id").eq("id", department_id).single();
    if (!department) {
      return new Response(
        JSON.stringify({ error: "Not found", message: "Dział nie został znaleziony" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Find active membership in department
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("memberships")
      .select("id, period")
      .eq("user_id", user_id)
      .eq("department_id", department_id);

    if (membershipsError) {
      console.error("Error fetching memberships for removal:", membershipsError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się pobrać członkostw użytkownika",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const activeMembership = memberships?.find((membership) => {
      const period = membership.period as string;
      if (typeof period !== "string") return false;
      const { lower, upper } = parsePeriodBounds(period);
      if (!lower) return false;
      return today >= lower && (!upper || today < upper);
    });

    if (!activeMembership) {
      return new Response(
        JSON.stringify({
          error: "Not found",
          message: "Brak aktywnego członkostwa w tym dziale",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const { lower } = parsePeriodBounds(activeMembership.period as string);
    if (!lower) {
      return new Response(
        JSON.stringify({
          error: "Invalid state",
          message: "Nie można odczytać okresu członkostwa",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (today < lower) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: "Data zakończenia nie może być wcześniejsza niż początek członkostwa",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const closedPeriod = `[${lower},${today})`;
    const { error: closeError } = await supabaseAdmin
      .from("memberships")
      .update({ period: closedPeriod })
      .eq("id", activeMembership.id);

    if (closeError) {
      console.error("Error closing membership on removal:", closeError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się usunąć członka z działu",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Członek został usunięty z działu",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/departments/assign-member:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

