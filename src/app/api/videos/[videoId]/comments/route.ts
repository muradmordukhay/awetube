import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { commentPaginationSchema, commentCreateSchema } from "@/lib/validation";
import { parseSearchParams, parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { notifyCommentReply } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const { videoId } = await params;
    const { searchParams } = new URL(req.url);
    const parsed = parseSearchParams(commentPaginationSchema, searchParams);
    if (!parsed.success) return parsed.response;
    const { cursor, limit } = parsed.data;

    const comments = await db.comment.findMany({
      where: { videoId, parentId: null },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          take: 3,
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: { select: { replies: true } },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;

    return NextResponse.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].id : undefined,
      hasMore,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching comments");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const parsed = parseBody(commentCreateSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { content, parentId } = parsed.data;

    // Validate parentId exists and belongs to the same video
    if (parentId) {
      const parent = await db.comment.findUnique({
        where: { id: parentId },
        select: { videoId: true },
      });
      if (!parent || parent.videoId !== videoId) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        videoId,
        userId: session.user.id,
        content,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    // Notify parent comment author of reply
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
        select: { userId: true },
      });
      if (parentComment) {
        notifyCommentReply(
          parentComment.userId,
          session.user.id,
          videoId,
          comment.id
        ).catch((err) => logger.warn({ err }, "Failed to notify comment reply"));
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error creating comment");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
