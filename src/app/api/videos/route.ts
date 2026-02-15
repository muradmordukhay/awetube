import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validation";
import { parseSearchParams } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const { searchParams } = new URL(req.url);
    const parsed = parseSearchParams(paginationSchema, searchParams);
    if (!parsed.success) return parsed.response;
    const { cursor, limit } = parsed.data;

    const videos = await db.video.findMany({
      where: { status: "READY" },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
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
    logger.error({ err: error }, "Error fetching videos");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
