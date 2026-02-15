import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { tagAddSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const MAX_TAGS_PER_VIDEO = 10;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;

    const video = await db.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (video.channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = parseBody(tagAddSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { name } = parsed.data;

    // Check tag count limit
    const tagCount = await db.videoTag.count({
      where: { videoId },
    });

    if (tagCount >= MAX_TAGS_PER_VIDEO) {
      return NextResponse.json(
        { error: `Maximum ${MAX_TAGS_PER_VIDEO} tags per video` },
        { status: 400 }
      );
    }

    // Upsert the tag (create if new, find if existing)
    const tag = await db.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });

    // Check for duplicate
    const existing = await db.videoTag.findUnique({
      where: { videoId_tagId: { videoId, tagId: tag.id } },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tag already added to this video" },
        { status: 409 }
      );
    }

    const videoTag = await db.videoTag.create({
      data: { videoId, tagId: tag.id },
      include: { tag: true },
    });

    return NextResponse.json(videoTag, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error adding tag to video");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
