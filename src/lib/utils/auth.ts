/**
 * Authentication utilities for Astro pages
 * 
 * This module provides helper functions for protecting routes and checking user authentication.
 * Based on Supabase Auth with SSR support via @supabase/ssr.
 * 
 * Usage in Astro pages:
 * ```astro
 * ---
 * import { requireAuth } from '../lib/utils/auth';
 * 
 * const user = requireAuth(Astro);
 * // If user is not authenticated, they will be redirected to /login
 * ---
 * ```
 */

import type { AstroGlobal } from "astro";
import type { UserMeDTO } from "../../types";

/**
 * Requires authentication for the current request.
 * If the user is not authenticated, they will be redirected to the login page.
 * 
 * @param Astro - The Astro global object
 * @param redirectTo - Optional URL to redirect to after successful login (defaults to current page)
 * @returns The authenticated user object
 * @throws Redirects to /login if user is not authenticated (via Astro.redirect)
 * 
 * @example
 * ```astro
 * ---
 * import { requireAuth } from '../lib/utils/auth';
 * 
 * const user = requireAuth(Astro);
 * ---
 * ```
 */
export function requireAuth(
  Astro: AstroGlobal,
  redirectTo?: string
): UserMeDTO {
  const user = Astro.locals.user;

  if (!user) {
    // Build redirect URL with the current page as the return destination
    const returnUrl = redirectTo || Astro.url.pathname + Astro.url.search;
    const loginUrl = `/login?redirect=${encodeURIComponent(returnUrl)}`;
    
    // Redirect to login page
    return Astro.redirect(loginUrl) as never;
  }

  return user;
}

/**
 * Checks if the current user is authenticated.
 * Unlike requireAuth, this does not redirect - it simply returns true/false.
 * 
 * @param Astro - The Astro global object
 * @returns true if user is authenticated, false otherwise
 * 
 * @example
 * ```astro
 * ---
 * import { isAuthenticated } from '../lib/utils/auth';
 * 
 * const isLoggedIn = isAuthenticated(Astro);
 * ---
 * ```
 */
export function isAuthenticated(Astro: AstroGlobal): boolean {
  return Astro.locals.user !== null;
}

/**
 * Requires a specific role for the current request.
 * If the user is not authenticated or doesn't have the required role,
 * they will be redirected to an appropriate page.
 * 
 * @param Astro - The Astro global object
 * @param requiredRole - The required role ('admin' | 'manager' | 'employee')
 * @returns The authenticated user object (with the required role)
 * 
 * @example
 * ```astro
 * ---
 * import { requireRole } from '../lib/utils/auth';
 * 
 * const user = requireRole(Astro, 'admin');
 * ---
 * ```
 */
export function requireRole(
  Astro: AstroGlobal,
  requiredRole: "admin" | "manager" | "employee"
): UserMeDTO {
  // First ensure user is authenticated
  const user = requireAuth(Astro);

  // Check if user has the required role
  if (user.app_role !== requiredRole) {
    // Redirect to dashboard with error message
    return Astro.redirect("/dashboard?error=insufficient_permissions") as never;
  }

  return user;
}

/**
 * Checks if the current user has a specific role.
 * Unlike requireRole, this does not redirect - it simply returns true/false.
 * 
 * @param Astro - The Astro global object
 * @param role - The role to check ('admin' | 'manager' | 'employee')
 * @returns true if user has the specified role, false otherwise
 * 
 * @example
 * ```astro
 * ---
 * import { hasRole } from '../lib/utils/auth';
 * 
 * const isAdmin = hasRole(Astro, 'admin');
 * ---
 * ```
 */
export function hasRole(
  Astro: AstroGlobal,
  role: "admin" | "manager" | "employee"
): boolean {
  const user = Astro.locals.user;
  return user?.app_role === role;
}

/**
 * Redirects authenticated users to the dashboard.
 * Useful for login/register pages that should not be accessible when already logged in.
 * 
 * @param Astro - The Astro global object
 * 
 * @example
 * ```astro
 * ---
 * import { redirectIfAuthenticated } from '../lib/utils/auth';
 * 
 * redirectIfAuthenticated(Astro);
 * // If user is authenticated, they will be redirected to /dashboard
 * ---
 * ```
 */
export function redirectIfAuthenticated(Astro: AstroGlobal): void {
  const user = Astro.locals.user;

  if (user) {
    return Astro.redirect("/dashboard") as never;
  }
}
