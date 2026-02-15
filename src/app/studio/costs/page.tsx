import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CostDashboard from "@/components/costs/CostDashboard";
import type { PlatformStats } from "@/lib/cost-calculator";

export default async function CostsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get the user's channel
  const channel = await db.channel.findUnique({
    where: { userId: session.user.id },
  });

  // Channel-level stats
  let channelStats: PlatformStats = {
    videoCount: 0,
    totalDurationSeconds: 0,
    totalViews: 0,
    subscriberCount: 0,
  };

  if (channel) {
    const [videoAgg, subCount] = await Promise.all([
      db.video.aggregate({
        where: { channelId: channel.id, status: "READY" },
        _count: true,
        _sum: { duration: true, viewCount: true },
      }),
      db.subscription.count({
        where: { channelId: channel.id },
      }),
    ]);

    channelStats = {
      videoCount: videoAgg._count,
      totalDurationSeconds: videoAgg._sum.duration ?? 0,
      totalViews: videoAgg._sum.viewCount ?? 0,
      subscriberCount: subCount,
    };
  }

  // Platform-wide stats
  const [platformAgg, totalSubs] = await Promise.all([
    db.video.aggregate({
      where: { status: "READY" },
      _count: true,
      _sum: { duration: true, viewCount: true },
    }),
    db.subscription.count(),
  ]);

  const platformStats: PlatformStats = {
    videoCount: platformAgg._count,
    totalDurationSeconds: platformAgg._sum.duration ?? 0,
    totalViews: platformAgg._sum.viewCount ?? 0,
    subscriberCount: totalSubs,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <CostDashboard
        channelStats={channelStats}
        platformStats={platformStats}
        hasChannel={!!channel}
      />
    </div>
  );
}
