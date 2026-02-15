import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { playlistCreateSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

// GET: list user's playlists
export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const playlists = await db.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: {
          orderBy: { position: "asc" },
          take: 1,
          include: {
            video: { select: { thumbnailUrl: true } },
          },
        },
      },
    });

    return NextResponse.json(playlists);
  } catch (error) {
    console.error("Error listing playlists:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: create playlist
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = parseBody(playlistCreateSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const playlist = await db.playlist.create({
      data: {
        userId: session.user.id,
        ...parsed.data,
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.error("Error creating playlist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
