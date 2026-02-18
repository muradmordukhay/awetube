import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@awetube.ai";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error(
        "RESEND_API_KEY environment variable is not set. Email sending is unavailable."
      );
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password/${token}`;

  await getResendClient().emails.send({
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

export async function sendLoginLinkEmail(
  email: string,
  token: string
): Promise<void> {
  const loginUrl = `${APP_URL}/verify?token=${token}`;

  if (process.env.NODE_ENV !== "production") {
    console.log(`\n🔗 Login URL: ${loginUrl}\n`);
    return;
  }

  await getResendClient().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Sign in to AweTube",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Sign in to AweTube</h2>
        <p>Click the link below to securely sign in. This link expires in 1 hour.</p>
        <p>
          <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 6px;">
            Sign in
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
