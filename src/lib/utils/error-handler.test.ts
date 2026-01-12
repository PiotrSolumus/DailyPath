import { describe, it, expect, vi } from "vitest";
import { ZodError, z } from "zod";
import { handleApiError } from "./error-handler";
import { HttpError } from "./http-error";
import type { PostgrestError } from "@supabase/supabase-js";

describe("error-handler", () => {
  describe("handleApiError", () => {
    it("should handle HttpError correctly", async () => {
      const error = new HttpError({
        status: 401,
        error: "Unauthorized",
        message: "Authentication required",
        code: "AUTH_REQUIRED",
      });

      const response = handleApiError(error);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toMatchInlineSnapshot(`
        {
          "code": "AUTH_REQUIRED",
          "error": "Unauthorized",
          "message": "Authentication required",
        }
      `);
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle HttpError with details", async () => {
      const error = new HttpError({
        status: 400,
        error: "Validation error",
        message: "Invalid input",
        details: {
          field1: ["Error 1", "Error 2"],
          field2: ["Error 3"],
        },
      });

      const response = handleApiError(error);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.details).toEqual({
        field1: ["Error 1", "Error 2"],
        field2: ["Error 3"],
      });
    });

    it("should handle ZodError correctly", async () => {
      const schema = z.object({
        name: z.string().min(3),
        age: z.number().min(18),
      });

      let zodError: ZodError;
      try {
        schema.parse({ name: "ab", age: 15 });
      } catch (error) {
        zodError = error as ZodError;
      }

      const response = handleApiError(zodError!);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error).toBe("Validation error");
      expect(body.message).toBe("Invalid query parameters");
      expect(body.details).toBeDefined();
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should handle PostgrestError correctly", async () => {
      const postgresError: PostgrestError = {
        message: "Database connection failed",
        details: "Connection timeout",
        hint: "Check network connection",
        code: "PGRST301",
      };

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = handleApiError(postgresError);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Database error");
      expect(body.message).toBe("Database connection failed");
      expect(body.code).toBe("PGRST301");
      expect(consoleSpy).toHaveBeenCalledWith("Database error:", postgresError);

      consoleSpy.mockRestore();
    });

    it("should handle PostgrestError without message", async () => {
      const postgresError: PostgrestError = {
        message: null,
        details: null,
        hint: null,
        code: "PGRST301",
      };

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = handleApiError(postgresError);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Database error");
      expect(body.message).toBe("A database error occurred");

      consoleSpy.mockRestore();
    });

    it("should handle unknown errors correctly", async () => {
      const unknownError = new Error("Unexpected error");
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = handleApiError(unknownError);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(body.message).toBe("An unexpected error occurred");
      expect(consoleSpy).toHaveBeenCalledWith("Unexpected error:", unknownError);

      consoleSpy.mockRestore();
    });

    it("should handle string errors", async () => {
      const stringError = "Simple string error";
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = handleApiError(stringError);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(consoleSpy).toHaveBeenCalledWith("Unexpected error:", stringError);

      consoleSpy.mockRestore();
    });

    it("should handle null errors", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const response = handleApiError(null);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error).toBe("Internal server error");
      expect(consoleSpy).toHaveBeenCalledWith("Unexpected error:", null);

      consoleSpy.mockRestore();
    });
  });
});
