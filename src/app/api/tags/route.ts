import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagSearchSchema } from "@/lib/validation";
import { parseSearchParams } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const parsed = parseSearchParams(
      tagSearchSchema,
      req.nextUrl.searchParams
    );
    if (!parsed.success) return parsed.response;
    const { q, cursor, limit } = parsed.data;

    const tags = await db.tag.findMany({
      where: q
        ? { name: { contains: q.toLowerCase(), mode: "insensitive" } }
        : undefined,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { name: "asc" },
      include: { _count: { select: { videos: true } } },
    });

    const hasMore = tags.length > limit;
    const items = hasMore ? tags.slice(0, limit) : tags;

    return NextResponse.json({
      tags: items,
      nextCursor: hasMore ? items[items.length - 1].id : null,
    });
  } catch (error) {
    logger.error({ err: error }, "Error listing tags");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
