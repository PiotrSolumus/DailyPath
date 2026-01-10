import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "../../db/database.types";

/**
 * Creates a Supabase client for browser-side operations.
 * This client automatically manages auth state and sessions in the browser.
 *
 * @returns Supabase client for browser use
 */
export function createClient() {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey =
    import.meta.env.PUBLIC_SUPABASE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
