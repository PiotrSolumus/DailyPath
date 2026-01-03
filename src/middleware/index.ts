import { defineMiddleware } from "astro:middleware";
import { createServerClient } from "@supabase/ssr";
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
 * Astro middleware for authentication and authorization
 * Optional authentication - pages work without login
 * 
 * Supports two authentication methods:
 * 1. Bearer token in Authorization header (for API clients, testing)
 * 2. Session cookies (for browser-based requests)
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Create a Supabase client with access to cookies
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(key) {
        return context.cookies.get(key)?.value;
      },
      set(key, value, options) {
        context.cookies.set(key, value, options);
      },
      remove(key, options) {
        context.cookies.delete(key, options);
      },
    },
  });

  // Set Supabase client in context for all requests
  context.locals.supabase = supabase;

  // Create admin client for admin operations (uses service role key)
  const adminClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  context.locals.supabaseAdmin = adminClient;

  // Default to no user (pages will work without auth)
  context.locals.user = null;

  // Check for Authorization header first (Bearer token) - for API testing
  const authHeader = context.request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        const userRole = user.app_metadata?.app_role || "employee";
        context.locals.user = {
          id: user.id,
          app_role: userRole,
          email: user.email || "",
        };
      }
    } catch (error) {
      // Silently fail - user stays null
      console.error("Error getting user from Bearer token:", error);
    }
  } else {
    // Try to get session from cookies
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
      } else if (session?.user) {
        const userRole = session.user.app_metadata?.app_role || "employee";
        context.locals.user = {
          id: session.user.id,
          app_role: userRole,
          email: session.user.email || "",
        };
        console.log("User authenticated:", context.locals.user.email, "Role:", context.locals.user.app_role);
      }
    } catch (error) {
      // Silently fail - user stays null
      console.error("Unexpected error in session check:", error);
    }
  }

  return next();
});
