import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { callbackSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { verifyCallbackSignature } from "@/lib/callback-signature";
import { callbackLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { notifySubscribersOfNewVideo } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = callbackLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    // Verify callback signature
    const url = new URL(req.url);
    const sig = url.searchParams.get("sig");
    const vid = url.searchParams.get("vid");

    if (!sig || !vid) {
      return NextResponse.json(
        { error: "Missing callback signature" },
        { status: 403 }
      );
    }

    const parsed = parseBody(callbackSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { task_token, status, error, error_description, videos, images } =
      parsed.data;

    if (!verifyCallbackSignature(vid, task_token, sig)) {
      console.error(`Invalid callback signature for vid=${vid}`);
      return NextResponse.json(
        { error: "Invalid callback signature" },
        { status: 403 }
      );
    }

    // Find the video by task token
    const video = await db.video.findFirst({
      where: { qencodeTaskToken: task_token },
    });

    if (!video) {
      console.error(`No video found for task_token: ${task_token}`);
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    if (status === "completed") {
      // Extract URLs from results
      let hlsUrl: string | null = null;
      let thumbnailUrl: string | null = null;
      let duration: number | null = null;
      let width: number | null = null;
      let height: number | null = null;

      if (videos && videos.length > 0) {
        // Find HLS manifest
        const hlsVideo = videos.find(
          (v: { url: string; tag?: string }) =>
            v.url.endsWith(".m3u8") || v.tag === "advanced_hls"
        );
        if (hlsVideo) {
          hlsUrl = hlsVideo.url;
          duration = hlsVideo.duration || null;
          width = hlsVideo.width || null;
          height = hlsVideo.height || null;
        }
      }

      if (images && images.length > 0) {
        thumbnailUrl = images[0].url;
      }

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

      // Notify subscribers
      notifySubscribersOfNewVideo(
        updatedVideo.channelId,
        updatedVideo.id,
        updatedVideo.channel.userId
      ).catch(() => {});
    } else if (error || status === "error") {
      console.error(
        `Transcoding failed for video ${video.id}: ${error_description}`
      );
      await db.video.update({
        where: { id: video.id },
        data: { status: "FAILED" },
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Callback processing error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
