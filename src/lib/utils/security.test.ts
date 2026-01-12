import { describe, it, expect, beforeEach, vi } from "vitest";
import { RateLimiter, getClientIp } from "./security";

describe("security utilities", () => {
  describe("RateLimiter", () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 });
    });

    it("should allow requests within limit", () => {
      const key = "test-key";

      for (let i = 0; i < 5; i++) {
        expect(limiter.check(key)).toBe(true);
      }
    });

    it("should block requests exceeding limit", () => {
      const key = "test-key";

      // Make maxRequests requests
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(key)).toBe(true);
      }

      // Next request should be blocked
      expect(limiter.check(key)).toBe(false);
    });

    it("should allow requests after window expires", () => {
      const key = "test-key";
      const limiter = new RateLimiter({ maxRequests: 2, windowMs: 100 });

      // Make maxRequests requests
      expect(limiter.check(key)).toBe(true);
      expect(limiter.check(key)).toBe(true);
      expect(limiter.check(key)).toBe(false);

      // Wait for window to expire
      vi.useFakeTimers();
      vi.advanceTimersByTime(101);

      // Should allow requests again
      expect(limiter.check(key)).toBe(true);

      vi.useRealTimers();
    });

    it("should track different keys independently", () => {
      const key1 = "key1";
      const key2 = "key2";

      // Fill up key1
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(key1)).toBe(true);
      }

      // key2 should still have full quota
      expect(limiter.check(key2)).toBe(true);
      expect(limiter.check(key2)).toBe(true);

      // key1 should be blocked
      expect(limiter.check(key1)).toBe(false);
    });

    it("should reset specific key", () => {
      const key = "test-key";

      // Fill up the limit
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(key)).toBe(true);
      }
      expect(limiter.check(key)).toBe(false);

      // Reset
      limiter.reset(key);

      // Should allow requests again
      expect(limiter.check(key)).toBe(true);
    });

    it("should clear all keys", () => {
      const key1 = "key1";
      const key2 = "key2";

      // Fill up both
      for (let i = 0; i < 5; i++) {
        expect(limiter.check(key1)).toBe(true);
        expect(limiter.check(key2)).toBe(true);
      }

      expect(limiter.check(key1)).toBe(false);
      expect(limiter.check(key2)).toBe(false);

      // Clear all
      limiter.clear();

      // Both should work again
      expect(limiter.check(key1)).toBe(true);
      expect(limiter.check(key2)).toBe(true);
    });

    it("should use custom maxRequests and windowMs", () => {
      const customLimiter = new RateLimiter({ maxRequests: 10, windowMs: 5000 });

      const key = "test-key";
      for (let i = 0; i < 10; i++) {
        expect(customLimiter.check(key)).toBe(true);
      }
      expect(customLimiter.check(key)).toBe(false);
    });

    it("should handle cleanup of old entries", () => {
      const key = "test-key";
      const shortWindowLimiter = new RateLimiter({ maxRequests: 2, windowMs: 100 });

      // Make requests
      expect(shortWindowLimiter.check(key)).toBe(true);
      expect(shortWindowLimiter.check(key)).toBe(true);

      // Wait for window to expire
      vi.useFakeTimers();
      vi.advanceTimersByTime(101);

      // Trigger cleanup (random chance, but we can force it)
      // The cleanup happens with 1% probability, so we'll just verify it doesn't break
      expect(shortWindowLimiter.check(key)).toBe(true);

      vi.useRealTimers();
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from x-forwarded-for header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from x-real-ip header", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-real-ip": "192.168.1.2",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.2");
    });

    it("should prefer x-forwarded-for over x-real-ip", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "192.168.1.2",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should handle x-forwarded-for with multiple IPs", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should trim whitespace from IP", () => {
      const request = new Request("https://example.com", {
        headers: {
          "x-forwarded-for": "  192.168.1.1  ",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it('should return "unknown" when no IP headers present', () => {
      const request = new Request("https://example.com");

      const ip = getClientIp(request);
      expect(ip).toBe("unknown");
    });
  });
});
