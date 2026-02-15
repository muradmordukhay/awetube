import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { watchHistorySchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseBody(watchHistorySchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { videoId, progressSeconds } = parsed.data;

    await db.watchHistory.upsert({
      where: {
        userId_videoId: { userId: session.user.id, videoId },
      },
      update: {
        watchedAt: new Date(),
        ...(progressSeconds !== undefined && { progressSeconds }),
      },
      create: {
        userId: session.user.id,
        videoId,
        progressSeconds: progressSeconds ?? 0,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording watch history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.watchHistory.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing watch history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
