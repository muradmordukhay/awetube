import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import ErrorState from "@/components/ui/error-state";

export default async function SubscriptionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let channelIds: string[] = [];
  let videos: Array<{
    id: string;
    title: string;
    thumbnailUrl: string | null;
    viewCount: number;
    createdAt: string;
    duration: number | null;
    channel: {
      name: string;
      handle: string;
      avatarUrl: string | null;
    };
  }> = [];
  let hasError = false;

  try {
    const subscriptions = await db.subscription.findMany({
      where: { userId: session.user.id },
      select: { channelId: true },
    });

    channelIds = subscriptions.map((s) => s.channelId);

    if (channelIds.length > 0) {
      const dbVideos = await db.video.findMany({
        where: {
          status: "READY",
          channelId: { in: channelIds },
        },
        orderBy: { createdAt: "desc" },
        take: 48,
        include: {
          channel: {
            select: { name: true, handle: true, avatarUrl: true },
          },
        },
      });

      videos = dbVideos.map((v) => ({
        ...v,
        createdAt: v.createdAt.toISOString(),
      }));
    }
  } catch {
    hasError = true;
  }

  return (
    <div className="py-4">
      <h1 className="mb-4 text-lg font-semibold">Subscriptions</h1>
      {hasError ? (
        <ErrorState
          title="Could not load subscriptions"
          description="Something went wrong. Please try again later."
        />
      ) : channelIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No subscriptions yet</p>
          <p className="text-sm">Subscribe to channels to see their videos here.</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No videos yet</p>
          <p className="text-sm">Your subscribed channels haven&apos;t uploaded any videos yet.</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
