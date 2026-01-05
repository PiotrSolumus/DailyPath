import { ZodError } from "zod";
import type { PostgrestError } from "@supabase/supabase-js";
import { HttpError } from "@/lib/utils/http-error";

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, string[]>;
  code?: string;
}

/**
 * Centralized API error handler
 * Handles different types of errors and returns appropriate HTTP responses
 *
 * @param error - The error to handle (can be ZodError, PostgrestError, or unknown)
 * @returns Response object with appropriate status code and error message
 */
export function handleApiError(error: unknown): Response {
  // Handle explicit HTTP errors (e.g., authorization/forbidden)
  if (error instanceof HttpError) {
    return new Response(
      JSON.stringify({
        error: error.error,
        message: error.message,
        details: error.details,
        code: error.code,
      } as ErrorResponse),
      {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return new Response(
      JSON.stringify({
        error: "Validation error",
        message: "Invalid query parameters",
        details: error.flatten().fieldErrors,
      } as ErrorResponse),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle Supabase/PostgreSQL errors
  if (isPostgrestError(error)) {
    console.error("Database error:", error);
    return new Response(
      JSON.stringify({
        error: "Database error",
        message: error.message || "A database error occurred",
        code: error.code,
      } as ErrorResponse),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Handle unexpected errors
  console.error("Unexpected error:", error);
  return new Response(
    JSON.stringify({
      error: "Internal server error",
      message: "An unexpected error occurred",
    } as ErrorResponse),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

/**
 * Type guard to check if error is a PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === "object" && error !== null && "code" in error && "message" in error && "details" in error;
}
