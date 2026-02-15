import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await db.notification.count({
      where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    logger.error({ err: error }, "Error fetching unread count");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
