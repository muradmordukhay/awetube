import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { commentUpdateSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ videoId: string; commentId: string }> };

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { commentId } = await params;
    const parsed = parseBody(commentUpdateSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { content } = parsed.data;

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error({ err: error }, "Error updating comment");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, commentId } = await params;

    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { userId: true, videoId: true },
    });

    if (!comment || comment.videoId !== videoId) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check authorization: comment author OR video owner can delete
    let authorized = comment.userId === session.user.id;

    if (!authorized) {
      const video = await db.video.findUnique({
        where: { id: comment.videoId },
        select: { channel: { select: { userId: true } } },
      });
      authorized = video?.channel.userId === session.user.id;
    }

    if (!authorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.comment.delete({ where: { id: commentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error deleting comment");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
