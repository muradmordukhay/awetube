import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = await apiLimiter.check(ip);
  if (!rl.success) return rateLimitResponse(rl.resetIn);

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
      _debug_auth: {
        AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST ?? "NOT_SET",
        AUTH_URL: process.env.AUTH_URL ?? "NOT_SET",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT_SET",
        HAS_NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
        NODE_ENV: process.env.NODE_ENV ?? "NOT_SET",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
