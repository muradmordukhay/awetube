import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { videoUpdateSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const ip = getClientIp(_req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const { videoId } = await params;

    const video = await db.video.findUnique({
      where: { id: videoId },
      include: {
        channel: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatarUrl: true,
          },
        },
        tags: { include: { tag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Increment view count (fire and forget)
    db.video
      .update({
        where: { id: videoId },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json(video);
  } catch (error) {
    logger.error({ err: error }, "Error fetching video");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    const parsed = parseBody(videoUpdateSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { title, description } = parsed.data;

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

    const updated = await db.video.update({
      where: { id: videoId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error({ err: error }, "Error updating video");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const ip = getClientIp(_req);
    const rl = apiLimiter.check(ip);
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

    await db.video.delete({ where: { id: videoId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error deleting video");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
