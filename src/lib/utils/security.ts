/**
 * Security utilities and helpers
 *
 * This file contains security-related utilities for the application.
 * For production deployment, consider implementing:
 * - Rate limiting (e.g., using Redis or Upstash)
 * - CSRF protection (Astro provides some built-in protection)
 * - Request validation
 * - IP-based blocking
 */

/**
 * Simple in-memory rate limiter (for development/small deployments)
 * For production with multiple instances, use Redis-based rate limiting
 *
 * Example usage:
 * ```ts
 * const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
 * if (!limiter.check(ipAddress)) {
 *   return new Response('Too many requests', { status: 429 });
 * }
 * ```
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor({ maxRequests = 5, windowMs = 60000 }: { maxRequests?: number; windowMs?: number }) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request should be allowed
   * @param key - Identifier (e.g., IP address, user ID)
   * @returns true if request is allowed, false if rate limit exceeded
   */
  check(key: string): boolean {
    const now = Date.now();
    const requestTimes = this.requests.get(key) || [];

    // Remove old requests outside the time window
    const recentRequests = requestTimes.filter((time) => now - time < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    // Cleanup old entries periodically (simple memory management)
    if (Math.random() < 0.01) {
      this.cleanup();
    }

    return true;
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, times] of this.requests.entries()) {
      const recentTimes = times.filter((time) => now - time < this.windowMs);
      if (recentTimes.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentTimes);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }
}

/**
 * Get client IP address from request
 * Handles various proxy headers
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Fallback to "unknown" if no IP found
  return "unknown";
}

/**
 * Create rate limiters for different endpoints
 */
export const authRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // per 15 minutes
});

export const generalRateLimiter = new RateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
});

/**
 * Security best practices checklist:
 *
 * ✅ HTTP-only cookies for session management (@supabase/ssr handles this)
 * ✅ HTTPS in production (configure in hosting provider)
 * ✅ Password strength requirements (min 6 chars, enforced in schema)
 * ✅ Email enumeration prevention (always return success on password reset)
 * ✅ RLS policies enabled in Supabase (defined in migrations)
 * ✅ Input validation with Zod schemas
 * ⚠️  Rate limiting (basic implementation provided, consider Redis for production)
 * ⚠️  CSRF protection (Astro provides some built-in, consider explicit tokens)
 * ⚠️  Brute force protection (implement account lockout after N failed attempts)
 * ⚠️  Session expiration (configure in Supabase Auth settings)
 *
 * TODO for production:
 * - Implement Redis-based rate limiting for distributed deployments
 * - Add explicit CSRF tokens for state-changing operations
 * - Implement account lockout mechanism
 * - Set up monitoring and alerting for suspicious activity
 * - Configure Content Security Policy (CSP) headers
 * - Enable audit logging for sensitive operations
 */
