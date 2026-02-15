import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { qencode } from "@/lib/qencode/client";
import { buildTranscodingQuery } from "@/lib/qencode/transcoding";
import { startTranscodeSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { signCallbackUrlWithTimestamp } from "@/lib/callback-signature";
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

    const parsed = parseBody(startTranscodeSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { videoId, taskToken, tusUri } = parsed.data;

    // Verify ownership
    const video = await db.video.findUnique({
      where: { id: videoId },
      include: { channel: true },
    });

    if (!video || video.channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build transcoding profile and start encoding
    const ts = Math.floor(Date.now() / 1000);
    const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/upload/callback?vid=${videoId}&sig=${sig}&ts=${ts}`;
    const query = buildTranscodingQuery(tusUri, videoId, callbackUrl);

    await qencode.startEncode(taskToken, query);

    // Update video status
    await db.video.update({
      where: { id: videoId },
      data: {
        status: "PROCESSING",
        sourceUrl: tusUri,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Start transcode error");
    return NextResponse.json(
      { error: "Failed to start transcoding" },
      { status: 500 }
    );
  }
}
