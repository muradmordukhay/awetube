import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import {
  passwordResetLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const limit = passwordResetLimiter.check(ip);
    if (!limit.success) return rateLimitResponse(limit.resetIn);

    const parsed = parseBody(resetPasswordSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { token, password } = parsed.data;

    const hashedToken = createHash("sha256").update(token).digest("hex");

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Delete all tokens for this user
    await db.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });

    return NextResponse.json({
      message: "Password reset successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Reset password error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
