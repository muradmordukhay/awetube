import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { db } from "@/lib/db";
import { emailLinkRequestSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import {
  emailLinkLimiter,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { sendLoginLinkEmail } from "@/lib/email";
import { featureFlags } from "@/lib/feature-flags";
import { normalizeEmail } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  try {
    if (!featureFlags.authEmailLinks) {
      return NextResponse.json(
        { error: "Email link sign-in is disabled" },
        { status: 404 }
      );
    }

    const ip = getClientIp(req);
    if (featureFlags.authRateLimit) {
      const limit = await emailLinkLimiter.check(ip);
      if (!limit.success) return rateLimitResponse(limit.resetIn);
    }

    const parsed = parseBody(emailLinkRequestSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const email = normalizeEmail(parsed.data.email);

    if (!process.env.NEXT_PUBLIC_APP_URL) {
      logger.error("NEXT_PUBLIC_APP_URL is not configured");
      return NextResponse.json(
        { error: "Email sign-in is not configured" },
        { status: 500 }
      );
    }

    const successResponse = NextResponse.json({
      message:
        "If an account with that email exists, we sent a sign-in link.",
    });

    await db.loginToken.deleteMany({ where: { email } });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await db.loginToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });

    await sendLoginLinkEmail(email, rawToken);

    return successResponse;
  } catch (error) {
    logger.error({ err: error }, "Email link error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
