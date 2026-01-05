import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const createUserSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  full_name: z.string().min(1, "Imię i nazwisko jest wymagane"),
  password: z.string().min(10, "Hasło musi mieć co najmniej 10 znaków"), // ⚠️ Not used temporarily
  app_role: z.enum(["employee", "manager", "admin"], {
    errorMap: () => ({ message: "Rola musi być: employee, manager lub admin" }),
  }),
  timezone: z.string().optional(),
});

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
 * 
 * ⚠️ TEMPORARY: Auth creation is disabled - users are created directly in the database
 * Users created this way will NOT be able to log in until Auth is enabled
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;
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
          message: "Tylko administrator może dodawać użytkowników",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createUserSchema.safeParse(body);

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

    const { email, full_name, password, app_role, timezone } = validation.data;

    // TEMPORARY: Skip Auth creation, generate random UUID
    // Generate a random UUID for the user
    const userId = crypto.randomUUID();

    console.log("⚠️ TEMPORARY: Creating user without Auth -", email);

    // Check for duplicate email in users table (use admin client to bypass RLS)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: "Conflict",
          message: "Użytkownik z tym adresem email już istnieje",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create user profile in public.users table directly
    // Use supabaseAdmin (service_role) to bypass foreign key constraint to auth.users
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("users")
      .insert({
        id: userId,
        email,
        full_name,
        app_role,
        timezone: timezone || "UTC",
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating user profile:", profileError);

      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się utworzyć profilu użytkownika",
          details: profileError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Użytkownik został utworzony pomyślnie",
        user: {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          app_role: profileData.app_role,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in POST /api/admin/users:", error);
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
 * GET /api/admin/users
 * Get all users (Admin only)
 * 
 * ⚠️ Uses supabaseAdmin to bypass RLS since users may not have Auth accounts
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
          message: "Tylko administrator może przeglądać listę użytkowników",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch all users (keep selection conservative to avoid schema mismatch across envs)
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, app_role, is_active, timezone")
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

    // Fetch memberships (will filter active ones in code)
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from("memberships")
      .select("user_id, department_id, period");

    if (membershipsError) {
      console.error("Error fetching memberships:", membershipsError);
      return new Response(
        JSON.stringify({
          error: "Database error",
          message: "Nie udało się pobrać przypisań użytkowników",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { data: departments, error: departmentsError } = await supabaseAdmin
      .from("departments")
      .select("id, name");

    if (departmentsError) {
      console.error("Error fetching departments for memberships:", departmentsError);
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

    const membershipMap = new Map<string, string>();
    memberships?.forEach((membership) => {
      if (membership.user_id && membership.department_id) {
        const period = membership.period as string;
        // treat open-ended range as active (ends with ",)")
        if (typeof period === "string" && period.endsWith(",)")) {
          membershipMap.set(membership.user_id, membership.department_id);
        }
      }
    });

    const departmentMap = new Map<string, string>();
    departments?.forEach((dept) => {
      departmentMap.set(dept.id, dept.name);
    });

    // Transform data to match expected format (with active department)
    const users = data.map((user) => {
      const departmentId = membershipMap.get(user.id);
      const departmentName = departmentId ? departmentMap.get(departmentId) : null;

      return {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        app_role: user.app_role,
        is_active: user.is_active,
        timezone: user.timezone,
        active_department:
          departmentId && departmentName
            ? {
                id: departmentId,
                name: departmentName,
              }
            : null,
      };
    });

    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error in GET /api/admin/users:", error);
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
