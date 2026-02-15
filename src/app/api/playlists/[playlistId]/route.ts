import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { playlistUpdateSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

type RouteParams = { params: Promise<{ playlistId: string }> };

// GET: playlist details + items
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = await apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const { playlistId } = await params;

    const playlist = await db.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: { select: { id: true, name: true } },
        items: {
          orderBy: { position: "asc" },
          include: {
            video: {
              include: {
                channel: {
                  select: { name: true, handle: true, avatarUrl: true },
                },
              },
            },
          },
        },
        _count: { select: { items: true } },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check access for private playlists
    if (playlist.visibility === "PRIVATE") {
      const session = await auth();
      if (session?.user?.id !== playlist.userId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    return NextResponse.json(playlist);
  } catch (error) {
    logger.error({ err: error }, "Error fetching playlist");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: update playlist
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const parsed = parseBody(playlistUpdateSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const updated = await db.playlist.update({
      where: { id: playlistId },
      data: parsed.data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    logger.error({ err: error }, "Error updating playlist");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: delete playlist
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

    if (!playlist) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (playlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.playlist.delete({ where: { id: playlistId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error deleting playlist");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
