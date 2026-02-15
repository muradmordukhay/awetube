import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@awetube.com";

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password/${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your AweTube password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your AweTube account.</p>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
