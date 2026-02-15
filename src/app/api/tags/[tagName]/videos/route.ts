import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tagVideosSchema } from "@/lib/validation";
import { parseSearchParams } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tagName: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const { tagName } = await params;

    const parsed = parseSearchParams(
      tagVideosSchema,
      req.nextUrl.searchParams
    );
    if (!parsed.success) return parsed.response;
    const { cursor, limit } = parsed.data;

    const tag = await db.tag.findFirst({
      where: { name: decodeURIComponent(tagName).toLowerCase() },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    const videoTags = await db.videoTag.findMany({
      where: {
        tagId: tag.id,
        video: { status: "READY" },
      },
      take: limit + 1,
      ...(cursor && { cursor: { videoId_tagId: { videoId: cursor, tagId: tag.id } }, skip: 1 }),
      orderBy: { video: { createdAt: "desc" } },
      include: {
        video: {
          include: {
            channel: {
              select: { id: true, name: true, handle: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const hasMore = videoTags.length > limit;
    const items = hasMore ? videoTags.slice(0, limit) : videoTags;

    return NextResponse.json({
      videos: items.map((vt) => vt.video),
      nextCursor: hasMore ? items[items.length - 1].video.id : null,
    });
  } catch (error) {
    logger.error({ err: error }, "Error listing videos by tag");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
