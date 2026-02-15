import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ip = getClientIp(req);
  const rl = apiLimiter.check(ip);
  if (!rl.success) return rateLimitResponse(rl.resetIn);

  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      db: "connected",
      timestamp: new Date().toISOString(),
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
