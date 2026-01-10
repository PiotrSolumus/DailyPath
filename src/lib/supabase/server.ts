import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "../../db/database.types";

/**
 * Creates a Supabase client for server-side operations with proper cookie handling.
 * This client uses the user's session from cookies and enforces RLS.
 *
 * @param cookies - Astro cookies object from context
 * @param headers - Request headers (needed to parse cookies)
 * @returns Supabase client with user session
 */
export function createClient(cookies: AstroCookies, headers?: Headers) {
  const supabaseUrl = import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    import.meta.env.SUPABASE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Use Supabase's parseCookieHeader if headers are available
        if (headers) {
          const cookieHeader = headers.get('cookie');
          if (cookieHeader) {
            return parseCookieHeader(cookieHeader);
          }
        }
        return [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, options as any);
        });
      },
    },
  });
}

/**
 * Creates a Supabase admin client for server-side operations that bypass RLS.
 * Use ONLY for administrative operations that require elevated privileges.
 *
 * WARNING: This client has full access to the database. Use with caution.
 *
 * @returns Supabase admin client with service_role key
 */
export function createAdminClient() {
  const supabaseUrl = import.meta.env.SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseServiceRoleKey =
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

  return createServerClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // Admin client doesn't need to set cookies
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
