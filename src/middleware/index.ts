import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey =
  import.meta.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabaseServiceRoleKey =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

/**
 * TEMPORARY: No authentication middleware
 * User is selected via cookie (set on login page)
 * All authentication checks are bypassed
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create simple Supabase client (no auth)
  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
  context.locals.supabase = supabase;

  // Create admin client for all operations (uses service role key to bypass RLS)
  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  context.locals.supabaseAdmin = adminClient;

  // Check for user_id cookie
  const userIdCookie = context.cookies.get("temp_user_id")?.value;

  if (userIdCookie) {
    // Fetch user from database
    try {
      const { data: userData, error } = await adminClient
        .from("users")
        .select("id, email, full_name, app_role, timezone")
        .eq("id", userIdCookie)
        .single();

      if (!error && userData) {
        // Resolve active department (based on active membership)
        let activeDepartment: { id: string; name: string } | null = null;
        try {
          const nowIso = new Date().toISOString();
          const { data: membership } = await adminClient
            .from("memberships")
            .select("department_id")
            .eq("user_id", userData.id)
            .contains("period", nowIso)
            .maybeSingle();

          const departmentId = membership?.department_id ?? null;
          if (departmentId) {
            const { data: dept } = await adminClient
              .from("departments")
              .select("id, name")
              .eq("id", departmentId)
              .single();

            if (dept) {
              activeDepartment = { id: dept.id, name: dept.name };
            }
          }
        } catch (deptError) {
          // Non-fatal: user can exist without an active department.
          console.warn("Could not resolve active department for temp user:", deptError);
        }

        context.locals.user = {
          id: userData.id,
          app_role: userData.app_role,
          email: userData.email,
          full_name: userData.full_name,
          timezone: userData.timezone ?? "UTC",
          active_department: activeDepartment,
        };
        console.log("🔓 TEMP USER:", userData.email, "Role:", userData.app_role);
      }
    } catch (error) {
      console.error("Error fetching temp user:", error);
    }
  }

  // If no user, set null (pages will redirect to login if needed)
  if (!context.locals.user) {
    context.locals.user = null;
  }

  return next();
});
