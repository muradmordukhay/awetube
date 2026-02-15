import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const ip = getClientIp(_req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId } = await params;
    const userId = session.user.id;

    const result = await db.$transaction(async (tx) => {
      const video = await tx.video.findUnique({
        where: { id: videoId },
        select: { id: true },
      });
      if (!video) {
        return { error: "Video not found" } as const;
      }

      const existingLike = await tx.like.findUnique({
        where: {
          videoId_userId: { videoId, userId },
        },
      });

      if (existingLike) {
        await tx.like.delete({ where: { id: existingLike.id } });
        await tx.video.update({
          where: { id: videoId },
          data: { likeCount: { decrement: 1 } },
        });
        return { liked: false };
      } else {
        await tx.like.create({
          data: { videoId, userId },
        });
        await tx.video.update({
          where: { id: videoId },
          data: { likeCount: { increment: 1 } },
        });
        return { liked: true };
      }
    });

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ err: error }, "Error toggling like");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
