import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { playlistItemAddSchema, playlistItemRemoveSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ playlistId: string }> };

// POST: add video to playlist
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { playlistId } = await params;
    const playlist = await db.playlist.findUnique({
      where: { id: playlistId },
      select: { userId: true },
    });

    if (!playlist || playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parsed = parseBody(playlistItemAddSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { videoId } = parsed.data;

    // Get next position
    const lastItem = await db.playlistItem.findFirst({
      where: { playlistId },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const position = (lastItem?.position ?? -1) + 1;

    const item = await db.playlistItem.create({
      data: { playlistId, videoId, position },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error adding to playlist");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: remove video from playlist
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { playlistId } = await params;
    const playlist = await db.playlist.findUnique({
      where: { id: playlistId },
      select: { userId: true },
    });

    if (!playlist || playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const parsed = parseBody(playlistItemRemoveSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { videoId } = parsed.data;

    await db.playlistItem.delete({
      where: { playlistId_videoId: { playlistId, videoId } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error removing from playlist");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
