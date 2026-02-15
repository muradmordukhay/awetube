import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { paginationSchema } from "@/lib/validation";
import { parseSearchParams } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = parseSearchParams(paginationSchema, searchParams);
    if (!parsed.success) return parsed.response;
    const { cursor, limit } = parsed.data;

    // Get subscribed channel IDs
    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      select: { channelId: true },
    });

    const channelIds = subscriptions.map((s) => s.channelId);

    if (channelIds.length === 0) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    const videos = await db.video.findMany({
      where: {
        status: "READY",
        channelId: { in: channelIds },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        channel: {
          select: { name: true, handle: true, avatarUrl: true },
        },
      },
    });

    const hasMore = videos.length > limit;
    const items = hasMore ? videos.slice(0, limit) : videos;

    return NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
      hasMore,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching subscription feed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
