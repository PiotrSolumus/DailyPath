import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const deleteUserSchema = z.object({
  id: z.string().uuid({ message: "Nieprawidłowe ID użytkownika" }),
});

const parsePeriodBounds = (period: string): { lower: string | null; upper: string | null } => {
  const match = period.match(/^\[([^,]+),([^\)]*)\)/);
  if (!match) return { lower: null, upper: null };
  const lower = match[1] ?? null;
  const upperRaw = match[2] ?? "";
  const upper = upperRaw.length > 0 ? upperRaw : null; // null -> open-ended
  return { lower, upper };
};

/**
 * DELETE /api/admin/users/:id
 * Soft delete: deaktywuje użytkownika, domyka aktywne członkostwa, usuwa role managera.
 * Nie usuwa rekordów zadań (FK restrict); pole is_active = false.
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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
        JSON.stringify({ error: "Forbidden", message: "Tylko administrator może usuwać użytkowników" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const validation = deleteUserSchema.safeParse({ id: params.id });
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Validation error",
          message: "Nieprawidłowe ID użytkownika",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = validation.data.id;
    const today = new Date().toISOString().split("T")[0];

    // Check user exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, is_active")
      .eq("id", userId)
      .maybeSingle();

    if (!existingUser) {
      return new Response(
        JSON.stringify({ error: "Not found", message: "Użytkownik nie został znaleziony" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Close active memberships
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("memberships")
      .select("id, period")
      .eq("user_id", userId);

    if (membershipsError) {
      console.error("Error fetching memberships for user delete:", membershipsError);
      return new Response(
        JSON.stringify({ error: "Database error", message: "Nie udało się pobrać członkostw" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (memberships?.length) {
      const updates = memberships
        .map((membership) => {
          const period = membership.period as string;
          if (typeof period !== "string") return null;
          const { lower, upper } = parsePeriodBounds(period);
          if (!lower) return null;
          // Close only open-ended or future-upper memberships
          if (!upper || today < upper) {
            if (today < lower) {
              return { id: membership.id, period: null }; // will skip update
            }
            return { id: membership.id, period: `[${lower},${today})` };
          }
          return null;
        })
        .filter((u): u is { id: number; period: string } => !!u && !!u.period);

      if (updates.length > 0) {
        const { error: updateMembershipsError } = await supabaseAdmin
          .from("memberships")
          .upsert(updates as any); // upsert for batch updates

        if (updateMembershipsError) {
          console.error("Error closing memberships on user delete:", updateMembershipsError);
          return new Response(
            JSON.stringify({ error: "Database error", message: "Nie udało się domknąć członkostw" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Remove manager mappings (safe to delete)
    const { error: managersDeleteError } = await supabaseAdmin
      .from("department_managers")
      .delete()
      .eq("manager_user_id", userId);

    if (managersDeleteError) {
      console.error("Error removing manager mappings:", managersDeleteError);
      return new Response(
        JSON.stringify({ error: "Database error", message: "Nie udało się usunąć ról managera" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Soft delete user
    const { error: userUpdateError } = await supabaseAdmin
      .from("users")
      .update({ is_active: false, app_role: "employee" })
      .eq("id", userId);

    if (userUpdateError) {
      console.error("Error deactivating user:", userUpdateError);
      return new Response(
        JSON.stringify({ error: "Database error", message: "Nie udało się usunąć użytkownika" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Użytkownik został usunięty (dezaktywowany)" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in DELETE /api/admin/users/:id:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Wystąpił nieoczekiwany błąd",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

