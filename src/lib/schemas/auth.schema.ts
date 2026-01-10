import { z } from "zod";

/**
 * Schema for login request
 */
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

/**
 * Schema for registration request
 */
export const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
  full_name: z.string().min(2, "Imię i nazwisko muszą mieć co najmniej 2 znaki"),
  token: z.string().optional(), // Invitation token
});

export type RegisterRequest = z.infer<typeof registerSchema>;

/**
 * Schema for password reset request
 */
export const requestPasswordResetSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
});

export type RequestPasswordResetRequest = z.infer<typeof requestPasswordResetSchema>;

/**
 * Schema for setting new password with reset token
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token resetu jest wymagany"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

/**
 * Schema for sending invitation
 */
export const sendInvitationSchema = z.object({
  email: z.string().email("Nieprawidłowy adres email"),
  app_role: z.enum(["employee", "manager", "admin"]),
  department_id: z.string().uuid().optional(),
});

export type SendInvitationRequest = z.infer<typeof sendInvitationSchema>;
