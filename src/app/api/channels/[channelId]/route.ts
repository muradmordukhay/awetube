import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { channelUpdateSchema } from "@/lib/validation";
import { parseBody } from "@/lib/api-utils";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const ip = getClientIp(_req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const { channelId } = await params;

    const channel = await db.channel.findFirst({
      where: {
        OR: [{ handle: channelId }, { id: channelId }],
      },
      include: {
        _count: { select: { videos: true } },
      },
    });

    if (!channel) {
      return NextResponse.json(
        { error: "Channel not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(channel);
  } catch (error) {
    console.error("Error fetching channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;
    const parsed = parseBody(channelUpdateSchema, await req.json());
    if (!parsed.success) return parsed.response;
    const { name, description } = parsed.data;

    const channel = await db.channel.findFirst({
      where: {
        OR: [{ handle: channelId }, { id: channelId }],
      },
    });

    if (!channel || channel.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.channel.update({
      where: { id: channel.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating channel:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
