import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string; tagId: string }> }
) {
  try {
    const ip = getClientIp(_req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, tagId } = await params;

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

    const videoTag = await db.videoTag.findUnique({
      where: { videoId_tagId: { videoId, tagId } },
    });

    if (!videoTag) {
      return NextResponse.json(
        { error: "Tag not found on this video" },
        { status: 404 }
      );
    }

    await db.videoTag.delete({
      where: { videoId_tagId: { videoId, tagId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error removing tag from video");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
