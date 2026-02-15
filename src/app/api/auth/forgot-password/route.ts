import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import {
  passwordResetLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = passwordResetLimiter.check(ip);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const parsed = parseBody(forgotPasswordSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { email } = parsed.data;

    // Always return 200 to prevent email enumeration
    const successResponse = NextResponse.json({
      message:
        "If an account with that email exists, we sent a password reset link.",
    });

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return successResponse;

    // Delete any existing tokens for this user
    await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

    // Generate token: store SHA-256 hash in DB, send raw token in email
    const rawToken = randomBytes(32).toString("hex");
    const hashedToken = createHash("sha256").update(rawToken).digest("hex");

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    await sendPasswordResetEmail(email, rawToken);

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
