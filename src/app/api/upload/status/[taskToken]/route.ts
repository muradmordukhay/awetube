import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { qencode } from "@/lib/qencode/client";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskToken: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskToken } = await params;

    // Verify the user owns this video
    const video = await db.video.findFirst({
      where: { qencodeTaskToken: taskToken },
      select: { channel: { select: { userId: true } } },
    });

    if (!video || video.channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const result = await qencode.getStatus([taskToken]);

    const taskStatus = result.statuses?.[taskToken];
    if (!taskStatus) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: taskStatus.status,
      percent: taskStatus.percent || 0,
      error: taskStatus.error_description || null,
    });
  } catch (error) {
    logger.error({ err: error }, "Status check error");
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
