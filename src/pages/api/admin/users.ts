import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const createUserSchema = z.object({
  email: z.string().email("Nieprawidłowy format adresu email"),
  full_name: z.string().min(1, "Imię i nazwisko jest wymagane"),
  password: z.string().min(10, "Hasło musi mieć co najmniej 10 znaków"),
  app_role: z.enum(["employee", "manager", "admin"], {
    errorMap: () => ({ message: "Rola musi być: employee, manager lub admin" }),
  }),
  timezone: z.string().optional(),
});

/**
 * POST /api/admin/users
 * Create a new user (Admin only)
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

    // Create user in Supabase Auth using Admin API with service role key
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (authError) {
      console.error("Error creating user in auth:", authError);

      // Check for duplicate email
      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
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

      return new Response(
        JSON.stringify({
          error: "Auth error",
          message: "Nie udało się utworzyć użytkownika w systemie uwierzytelniania",
          details: authError.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({
          error: "Auth error",
          message: "Nie udało się utworzyć użytkownika",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create user profile in public.users table
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email,
        full_name,
        app_role,
        timezone: timezone || "UTC",
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating user profile:", profileError);

      // Try to delete the auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

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
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
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

    // Fetch all users with their active department
    const { data, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        app_role,
        is_active,
        active_department_id,
        departments:active_department_id (
          id,
          name
        )
      `
      )
      .order("created_at", { ascending: false });

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

    // Transform data to match expected format
    const users = data.map((user) => ({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      app_role: user.app_role,
      is_active: user.is_active,
      active_department: user.departments
        ? {
            id: user.departments.id,
            name: user.departments.name,
          }
        : null,
    }));

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
