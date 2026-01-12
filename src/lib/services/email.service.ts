/**
 * Email service for sending transactional emails
 *
 * This service provides email sending capabilities using Resend API.
 * For local development without Resend API key, emails are logged to console.
 *
 * To use Resend in production:
 * 1. Sign up at https://resend.com
 * 2. Get your API key
 * 3. Set RESEND_API_KEY environment variable
 * 4. Install resend package: npm install resend
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

interface SendInvitationEmailParams {
  to: string;
  inviterName: string;
  invitationUrl: string;
}

interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

/**
 * Send email using Resend API or log to console in development
 */
async function sendEmail({ to, subject, html, from }: SendEmailParams): Promise<boolean> {
  const resendApiKey = import.meta.env.RESEND_API_KEY;
  const fromEmail = from || "DailyPath <noreply@dailypath.app>";

  // If no API key, just log the email (for local development)
  if (!resendApiKey) {
    console.log("📧 [EMAIL SERVICE - DEV MODE]");
    console.log(`To: ${to}`);
    console.log(`From: ${fromEmail}`);
    console.log(`Subject: ${subject}`);
    console.log("---");
    console.log(html);
    console.log("---");
    return true;
  }

  try {
    // Use Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to send email via Resend:", error);
      return false;
    }

    console.log(`✅ Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Send invitation email to new user
 */
export async function sendInvitationEmail({
  to,
  inviterName,
  invitationUrl,
}: SendInvitationEmailParams): Promise<boolean> {
  const subject = "Zaproszenie do DailyPath";
  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zaproszenie do DailyPath</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">Witaj w DailyPath!</h1>
    <p style="font-size: 16px;">
      <strong>${inviterName}</strong> zaprosił Cię do dołączenia do zespołu w DailyPath.
    </p>
    <p style="font-size: 16px;">
      DailyPath to aplikacja do planowania czasu pracy, zarządzania zadaniami i raportowania aktywności.
    </p>
  </div>
  
  <div style="margin: 30px 0;">
    <a href="${invitationUrl}" 
       style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: 600;">
      Aktywuj konto
    </a>
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    <p>Zaproszenie wygasa za 7 dni.</p>
    <p>Jeśli nie spodziewałeś się tego zaproszenia, możesz zignorować tę wiadomość.</p>
    <p style="margin-top: 20px;">
      Pozdrawiamy,<br>
      Zespół DailyPath
    </p>
  </div>
</body>
</html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailParams): Promise<boolean> {
  const subject = "Reset hasła - DailyPath";
  const html = `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset hasła - DailyPath</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin-top: 0;">Reset hasła</h1>
    <p style="font-size: 16px;">
      Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w DailyPath.
    </p>
    <p style="font-size: 16px;">
      Kliknij w poniższy przycisk, aby ustawić nowe hasło:
    </p>
  </div>
  
  <div style="margin: 30px 0;">
    <a href="${resetUrl}" 
       style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: 600;">
      Zresetuj hasło
    </a>
  </div>
  
  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
    <p>Link do resetowania hasła wygasa za 1 godzinę.</p>
    <p>Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość. Twoje hasło pozostanie bez zmian.</p>
    <p style="margin-top: 20px;">
      Pozdrawiamy,<br>
      Zespół DailyPath
    </p>
  </div>
</body>
</html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Test email service configuration
 */
export async function testEmailService(): Promise<boolean> {
  console.log("Testing email service...");
  const resendApiKey = import.meta.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.log("⚠️  RESEND_API_KEY not configured - running in development mode");
    console.log("   Emails will be logged to console instead of being sent");
    return true;
  }

  console.log("✅ RESEND_API_KEY is configured");
  return true;
}
