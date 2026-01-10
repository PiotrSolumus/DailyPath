import { defineMiddleware } from "astro:middleware";
import { createClient, createAdminClient } from "../lib/supabase/server";

/**
 * Authentication middleware for DailyPath application.
 *
 * This middleware:
 * 1. Creates Supabase clients (user session + admin) for each request
 * 2. Retrieves and validates user session from cookies
 * 3. Fetches user profile and active department membership
 * 4. Makes user data available via context.locals
 *
 * Uses @supabase/ssr for proper SSR session management with RLS enforcement.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create Supabase client with user session (enforces RLS)
  const supabase = createClient(context.cookies, context.request.headers);
  context.locals.supabase = supabase;

  // Create admin client for elevated operations (bypasses RLS)
  const supabaseAdmin = createAdminClient();
  context.locals.supabaseAdmin = supabaseAdmin;

  // Get current session from Supabase Auth
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Error getting session:", sessionError);
    context.locals.user = null;
    return next();
  }

  // If no session, user is not authenticated
  if (!session) {
    context.locals.user = null;
    return next();
  }

  // Fetch user profile from our users table
  try {
    // Try to find by ID first (matches auth user ID if user was created through auth)
    let { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, email, full_name, app_role, timezone")
      .eq("id", session.user.id)
      .maybeSingle();

    // If not found by ID, try by email (handles case where user was created in public.users before auth.users)
    if (!userData && session.user.email) {
      const { data: emailUserData, error: emailError } = await supabase
        .from("users")
        .select("id, email, full_name, app_role, timezone")
        .eq("email", session.user.email)
        .maybeSingle();

      if (emailError) {
        console.error("Error fetching user profile by email:", emailError);
      } else if (emailUserData) {
        userData = emailUserData;
      }
    }

    // If still not found, try using admin client (bypasses RLS)
    // This handles cases where RLS blocks access due to ID mismatch
    if (!userData && session.user.email) {
      console.warn("User not found via RLS, trying admin client for:", session.user.email);
      const { data: adminUserData, error: adminError } = await supabaseAdmin
        .from("users")
        .select("id, email, full_name, app_role, timezone")
        .eq("email", session.user.email)
        .maybeSingle();

      if (adminError) {
        console.error("Error fetching user profile with admin client:", adminError);
      } else if (adminUserData) {
        userData = adminUserData;
        console.warn(
          `⚠️ User found via admin client. ID mismatch: public.users.id (${adminUserData.id}) != auth.users.id (${session.user.id}). ` +
            `RLS policies may not work correctly.`
        );
      }
    }

    if (!userData) {
      console.error("User profile not found for auth user:", session.user.email || session.user.id);
      // User has auth session but no profile - this shouldn't happen
      // Clear the session and force re-login
      await supabase.auth.signOut();
      context.locals.user = null;
      return next();
    }

    // Resolve active department (based on active membership)
    let activeDepartment: { id: string; name: string } | null = null;
    try {
      const nowIso = new Date().toISOString();
      const { data: membership } = await supabase
        .from("memberships")
        .select("department_id")
        .eq("user_id", userData.id)
        .contains("period", nowIso)
        .maybeSingle();

      const departmentId = membership?.department_id ?? null;
      if (departmentId) {
        const { data: dept } = await supabase.from("departments").select("id, name").eq("id", departmentId).single();

        if (dept) {
          activeDepartment = { id: dept.id, name: dept.name };
        }
      }
    } catch (deptError) {
      // Non-fatal: user can exist without an active department
      console.warn("Could not resolve active department:", deptError);
    }

    // Set user in context
    context.locals.user = {
      id: userData.id,
      app_role: userData.app_role,
      email: userData.email,
      full_name: userData.full_name,
      timezone: userData.timezone ?? "UTC",
      active_department: activeDepartment,
    };

    console.log("✅ Authenticated user:", userData.email, "Role:", userData.app_role);
  } catch (error) {
    console.error("Unexpected error in auth middleware:", error);
    context.locals.user = null;
  }

  return next();
});
