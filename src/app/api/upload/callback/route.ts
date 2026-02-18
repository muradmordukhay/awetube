import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { callbackSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { verifyCallbackWithTimestamp } from "@/lib/callback-signature";
import { callbackLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { notifySubscribersOfNewVideo } from "@/lib/notifications";
import { parseCallbackResults } from "@/lib/qencode/callback-parser";
import { QENCODE } from "@/lib/constants";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    // Verify signature before rate limiting — invalid signatures must not
    // consume rate limit slots (cheap check vs. expensive Redis round-trip).
    const url = new URL(req.url);
    const sig = url.searchParams.get("sig");
    const vid = url.searchParams.get("vid");
    const ts = url.searchParams.get("ts");

    if (!sig || !vid || !ts) {
      return NextResponse.json(
        { error: "Missing callback signature" },
        { status: 403 }
      );
    }

    const parsed = parseBody(callbackSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { task_token, status, error, error_description, videos, images } =
      parsed.data;

    if (!verifyCallbackWithTimestamp(vid, task_token, sig, Number(ts))) {
      logger.warn({ vid, ts }, "Invalid or expired callback signature");
      return NextResponse.json(
        { error: "Invalid callback signature" },
        { status: 403 }
      );
    }

    // Rate limit after signature is confirmed valid.
    const ip = getClientIp(req);
    const rl = await callbackLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const video = await db.video.findFirst({
      where: { qencodeTaskToken: task_token },
    });

    if (!video) {
      logger.warn({ task_token }, "No video found for task token");
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (status === QENCODE.STATUS_COMPLETED) {
      const { hlsUrl, thumbnailUrl, duration, width, height } =
        parseCallbackResults({ task_token, status, error, videos, images });

      const updatedVideo = await db.video.update({
        where: { id: video.id },
        data: {
          status: "READY",
          hlsUrl,
          thumbnailUrl,
          duration,
          width,
          height,
          publishedAt: new Date(),
        },
        include: { channel: { select: { userId: true } } },
      });

      notifySubscribersOfNewVideo(
        updatedVideo.channelId,
        updatedVideo.id,
        updatedVideo.channel.userId
      ).catch((err) =>
        logger.warn({ err }, "Failed to notify subscribers of new video")
      );
    } else if (
      // Qencode error codes: 0 = success, non-zero = failure.
      (error !== undefined && error !== QENCODE.ERROR_CODE_SUCCESS) ||
      status === QENCODE.STATUS_ERROR
    ) {
      logger.error(
        { videoId: video.id, error, error_description },
        "Transcoding failed"
      );
      await db.video.update({
        where: { id: video.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Callback processing error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
