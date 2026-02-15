import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { qencode } from "@/lib/qencode/client";
import { uploadInitiateSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { uploadLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = await uploadLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseBody(uploadInitiateSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { title, description } = parsed.data;

    // Get user's channel
    const channel = await db.channel.findUnique({
      where: { userId: session.user.id },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "You need a channel to upload videos" },
        { status: 400 }
      );
    }

    // Create Qencode task to get upload URL
    const task = await qencode.createTask();

    // Create video record in DB
    const video = await db.video.create({
      data: {
        channelId: channel.id,
        title,
        description: description || null,
        status: "UPLOADING",
        qencodeTaskToken: task.task_token,
      },
    });

    return NextResponse.json({
      videoId: video.id,
      uploadUrl: task.upload_url,
      taskToken: task.task_token,
    });
  } catch (error) {
    logger.error({ err: error }, "Upload initiate error");
    return NextResponse.json(
      { error: "Failed to initiate upload" },
      { status: 500 }
    );
  }
}
