import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/schemas/auth.schema";
import { createAdminClient } from "../../../lib/supabase/server";

/**
 * POST /api/auth/register
 *
 * Registers a new user with an invitation token.
 * Creates user in Supabase Auth and user profile in database.
 * Marks invitation as accepted.
 *
 * Request body:
 * - email: string (required)
 * - password: string (required, min 6 chars)
 * - full_name: string (required, min 2 chars)
 * - token: string (required, invitation token)
 *
 * Response:
 * - 201: Registration successful
 * - 400: Invalid request body or invalid token
 * - 409: User already exists
 * - 500: Server error
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

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

    const { email, password, full_name, token } = validation.data;

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Token zaproszenia jest wymagany",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Validate invitation token
    const { data: validationResult, error: validationError } = await supabaseAdmin.rpc("validate_invitation_token", {
      p_token: token,
    });

    if (validationError) {
      console.error("Error validating invitation token:", validationError);
      return new Response(
        JSON.stringify({
          error: "Nie udało się zweryfikować tokena zaproszenia",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const invitation = validationResult[0];

    if (!invitation || !invitation.is_valid) {
      return new Response(
        JSON.stringify({
          error: "Token zaproszenia jest nieprawidłowy, wygasł lub został już użyty",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Verify email matches invitation
    if (email.toLowerCase() !== invitation.email.toLowerCase()) {
      return new Response(
        JSON.stringify({
          error: "Adres email nie pasuje do zaproszenia",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already exists in auth.users
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser.users.some((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (userExists) {
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

    // Create user in Supabase Auth (without sending confirmation email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email since they were invited
      user_metadata: {
        full_name,
      },
    });

    if (authError || !authData.user) {
      console.error("Error creating auth user:", authError);
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć konta użytkownika",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Create user profile in users table
    const { error: profileError } = await supabaseAdmin.from("users").insert({
      id: authData.user.id,
      email,
      full_name,
      app_role: invitation.app_role,
      timezone: "UTC", // Default timezone, user can change later
      is_active: true,
    });

    if (profileError) {
      console.error("Error creating user profile:", profileError);
      // Rollback: delete auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          error: "Nie udało się utworzyć profilu użytkownika",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // If department was specified in invitation, create membership
    if (invitation.department_id) {
      const startDate = new Date();
      const { error: membershipError } = await supabaseAdmin.from("memberships").insert({
        user_id: authData.user.id,
        department_id: invitation.department_id,
        period: `[${startDate.toISOString()},)`, // Open-ended membership
      });

      if (membershipError) {
        console.error("Error creating membership:", membershipError);
        // Non-fatal: user was created successfully, membership can be added later
      }
    }

    // Mark invitation as accepted
    await supabaseAdmin
      .from("invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.invitation_id);

    console.log(`✅ User registered: ${email} (${invitation.app_role})`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Rejestracja zakończona pomyślnie. Możesz się teraz zalogować.",
        user: {
          id: authData.user.id,
          email,
          full_name,
          app_role: invitation.app_role,
        },
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in register endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
