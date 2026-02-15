import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { watchLaterToggleSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const WATCH_LATER_TITLE = "Watch Later";

async function getOrCreateWatchLater(userId: string) {
  const existing = await db.playlist.findFirst({
    where: { userId, title: WATCH_LATER_TITLE },
  });
  if (existing) return existing;

  try {
    return await db.playlist.create({
      data: { userId, title: WATCH_LATER_TITLE, visibility: "PRIVATE" },
    });
  } catch {
    // Race: another request created it first, fetch it
    const retry = await db.playlist.findFirst({
      where: { userId, title: WATCH_LATER_TITLE },
    });
    if (!retry) throw new Error("Failed to create Watch Later playlist");
    return retry;
  }
}

// GET: get or create Watch Later playlist
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlist = await getOrCreateWatchLater(session.user.id);

    // Re-fetch with count
    const withCount = await db.playlist.findUnique({
      where: { id: playlist.id },
      include: { _count: { select: { items: true } } },
    });

    return NextResponse.json(withCount);
  } catch (error) {
    logger.error({ err: error }, "Error fetching Watch Later");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: toggle video in Watch Later
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseBody(watchLaterToggleSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { videoId } = parsed.data;

    const playlist = await getOrCreateWatchLater(session.user.id);

    // Toggle
    const existing = await db.playlistItem.findUnique({
      where: {
        playlistId_videoId: { playlistId: playlist.id, videoId },
      },
    });

    if (existing) {
      await db.playlistItem.delete({ where: { id: existing.id } });
      return NextResponse.json({ saved: false });
    }

    const lastItem = await db.playlistItem.findFirst({
      where: { playlistId: playlist.id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    await db.playlistItem.create({
      data: {
        playlistId: playlist.id,
        videoId,
        position: (lastItem?.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    logger.error({ err: error }, "Error toggling Watch Later");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
