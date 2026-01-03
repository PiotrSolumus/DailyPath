import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

/**
 * Auth Service
 * Provides authentication and authorization helper functions
 */

/**
 * Get the current user's role from the database
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to query
 * @returns The user's app_role
 */
export async function getCurrentUserRole(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("users").select("app_role").eq("id", userId).single();

  if (error) throw error;
  return data.app_role;
}

/**
 * Get all departments managed by a specific user
 * Used for privacy masking and authorization checks
 *
 * @param supabase - Supabase client instance
 * @param userId - Manager user ID
 * @returns Set of department IDs managed by the user
 */
export async function getManagerDepartments(supabase: SupabaseClient<Database>, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from("department_managers")
    .select("department_id")
    .eq("manager_user_id", userId);

  if (error) {
    console.error("Error fetching manager departments:", error);
    return new Set<string>();
  }

  return new Set(data?.map((d) => d.department_id) ?? []);
}

/**
 * Get the current department of a user
 * Based on active membership (period contains current date)
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to query
 * @returns Department ID or null if no active membership
 */
export async function getUserDepartment(supabase: SupabaseClient<Database>, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("memberships")
    .select("department_id")
    .eq("user_id", userId)
    .contains("period", new Date().toISOString())
    .single();

  if (error) {
    // It's okay if user has no active membership
    return null;
  }

  return data?.department_id ?? null;
}

/**
 * Check if a user is a manager of a specific department
 *
 * @param supabase - Supabase client instance
 * @param managerId - Manager user ID
 * @param departmentId - Department ID to check
 * @returns True if user is manager of the department
 */
export async function isManagerOfDepartment(
  supabase: SupabaseClient<Database>,
  managerId: string,
  departmentId: string
): Promise<boolean> {
  const { count, error } = await supabase
    .from("department_managers")
    .select("*", { count: "exact", head: true })
    .eq("manager_user_id", managerId)
    .eq("department_id", departmentId);

  if (error) {
    console.error("Error checking manager status:", error);
    return false;
  }

  return (count ?? 0) > 0;
}
