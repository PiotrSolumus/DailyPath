import type { APIRoute } from "astro";
import { sendInvitationSchema } from "../../../lib/schemas/auth.schema";
import { createAdminClient } from "../../../lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/auth/invite
 *
 * Creates an invitation for a new user to register.
 * Only managers and admins can send invitations.
 * Generates a unique token and stores invitation in database.
 * Custom email service will send the invitation email.
 *
 * Request body:
 * - email: string (required, valid email)
 * - app_role: "employee" | "manager" | "admin" (required)
 * - department_id: string (optional, UUID)
 *
 * Response:
 * - 201: Invitation created successfully
 * - 400: Invalid request body
 * - 401: Not authenticated
 * - 403: Insufficient permissions (not manager or admin)
 * - 409: User with this email already exists
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Check authentication
    if (!locals.user) {
      return new Response(
        JSON.stringify({
          error: "Musisz być zalogowany aby wysłać zaproszenie",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check authorization (only managers and admins)
    if (locals.user.app_role !== "manager" && locals.user.app_role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Nie masz uprawnień do wysyłania zaproszeń",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = sendInvitationSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane",
          details: validation.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, app_role, department_id } = validation.data;

    const supabaseAdmin = createAdminClient();

    // Check if user already exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return new Response(
        JSON.stringify({
          error: "Użytkownik z tym adresem email już istnieje",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvitation } = await supabaseAdmin
      .from("invitations")
      .select("id, expires_at, accepted_at")
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({
          error: "Zaproszenie dla tego adresu email już istnieje",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabaseAdmin
      .from("invitations")
      .insert({
        email,
        token,
        app_role,
        department_id: department_id || null,
        invited_by: locals.user.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (invitationError) {
      console.error("Error creating invitation:", invitationError);
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć zaproszenia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Invitation created for ${email} by ${locals.user.email}`);

    // Send invitation email
    const { sendInvitationEmail } = await import("../../../lib/services/email.service");
    const invitationUrl = `${new URL(request.url).origin}/register?token=${invitation.token}`;

    const emailSent = await sendInvitationEmail({
      to: email,
      inviterName: locals.user.full_name || locals.user.email,
      invitationUrl,
    });

    if (!emailSent) {
      console.warn("⚠️  Failed to send invitation email, but invitation was created");
    }

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expires_at: invitation.expires_at,
          // Don't return token in production - it should only be in the email
          // For development/testing, we return it:
          token: invitation.token,
        },
        message: "Zaproszenie zostało utworzone. Email zostanie wysłany wkrótce.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in invite endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas tworzenia zaproszenia",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
