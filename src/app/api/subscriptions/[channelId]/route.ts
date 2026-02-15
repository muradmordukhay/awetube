import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiLimiter, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ channelId: string }> };

// Toggle subscribe/unsubscribe
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channelId } = await params;

    // Prevent self-subscription
    const channel = await db.channel.findUnique({
      where: { id: channelId },
      select: { userId: true },
    });

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 });
    }

    if (channel.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot subscribe to your own channel" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const result = await db.$transaction(async (tx) => {
      const existing = await tx.subscription.findUnique({
        where: {
          userId_channelId: { userId, channelId },
        },
      });

      if (existing) {
        await tx.subscription.delete({ where: { id: existing.id } });
      } else {
        await tx.subscription.create({
          data: { userId, channelId },
        });
      }

      const subscriberCount = await tx.subscription.count({
        where: { channelId },
      });

      return { subscribed: !existing, subscriberCount };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Check subscription status
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const ip = getClientIp(req);
    const rl = apiLimiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ subscribed: false });
    }

    const { channelId } = await params;

    const existing = await db.subscription.findUnique({
      where: {
        userId_channelId: { userId: session.user.id, channelId },
      },
    });

    return NextResponse.json({ subscribed: !!existing });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
