import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/schemas/auth.schema";
import { createClient, createAdminClient } from "../../../lib/supabase/server";
import { authRateLimiter, getClientIp } from "../../../lib/utils/security";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with email and password.
 * Creates a session stored in HTTP-only cookies.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required, min 6 chars)
 *
 * Response:
 * - 200: Login successful, user data returned
 * - 400: Invalid request body
 * - 401: Invalid credentials
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Rate limiting check
    const clientIp = getClientIp(request);
    if (!authRateLimiter.check(clientIp)) {
      return new Response(
        JSON.stringify({
          error: "Zbyt wiele prób logowania. Spróbuj ponownie za kilka minut.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

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

    const { email, password } = validation.data;

    // Create Supabase client
    const supabase = createClient(cookies, request.headers);
    // Create admin client to bypass RLS when fetching user profile
    const supabaseAdmin = createAdminClient();

    // Attempt to sign in with email and password
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      console.error("Login error details:", {
        message: error.message,
        status: error.status,
        email: email,
      });

      // Don't expose specific error details for security in production
      // But log them for debugging
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowy email lub hasło",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.session || !data.user) {
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć sesji",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user profile from our users table by email using admin client
    // (bypasses RLS - needed because user ID might not match auth.uid() yet)
    // Note: We use email instead of ID because users may have been created
    // in public.users before auth.users, so IDs might not match initially
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, app_role")
      .eq("email", email)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user profile:", userError);
      return new Response(
        JSON.stringify({
          error: "Profil użytkownika nie został znaleziony",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If user ID doesn't match auth user ID, we need to handle this carefully
    // Updating ID could break foreign key relationships in other tables
    // For now, we'll use the existing ID from public.users and log a warning
    if (userData.id !== data.user.id) {
      console.warn(
        `⚠️ User ID mismatch: public.users.id (${userData.id}) != auth.users.id (${data.user.id}) for ${email}. ` +
        `Using public.users.id. RLS policies may not work correctly. Consider updating the user ID manually.`
      );
      // Don't update ID automatically as it could break foreign key relationships
      // The user can still log in, but RLS might not work correctly until IDs are synced
    }

    console.log("✅ User logged in:", userData.email);

    // Return user data (session is already stored in cookies by @supabase/ssr)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          app_role: userData.app_role,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in login endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
