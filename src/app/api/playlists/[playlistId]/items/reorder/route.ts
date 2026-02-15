import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { playlistReorderSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ playlistId: string }> }
) {
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

    const parsed = parseBody(playlistReorderSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { itemIds } = parsed.data;

    // Fetch existing item IDs
    const existingItems = await db.playlistItem.findMany({
      where: { playlistId },
      select: { id: true },
    });

    const existingIds = new Set(existingItems.map((i) => i.id));
    const providedIds = new Set(itemIds);

    // Validate: provided IDs must exactly match existing IDs
    if (
      existingIds.size !== providedIds.size ||
      ![...existingIds].every((id) => providedIds.has(id))
    ) {
      return NextResponse.json(
        { error: "Item IDs do not match existing playlist items" },
        { status: 400 }
      );
    }

    // Update positions in a transaction
    await db.$transaction(
      itemIds.map((id, index) =>
        db.playlistItem.update({
          where: { id },
          data: { position: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Error reordering playlist items");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
