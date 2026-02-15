import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import VideoGrid from "@/components/video/VideoGrid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SubscribeButton from "@/components/channel/SubscribeButton";

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;

  // channelId can be a handle or an id
  const channel = await db.channel.findFirst({
    where: {
      OR: [{ handle: channelId }, { id: channelId }],
    },
    include: {
      _count: { select: { videos: true, subscribers: true } },
    },
  });

  if (!channel) notFound();

  // Check subscription status
  let isSubscribed = false;
  const session = await auth();
  if (session?.user?.id) {
    const subscription = await db.subscription.findUnique({
      where: {
        userId_channelId: {
          userId: session.user.id,
          channelId: channel.id,
        },
      },
    });
    isSubscribed = !!subscription;
  }

  const videos = await db.video.findMany({
    where: { channelId: channel.id, status: "READY" },
    orderBy: { createdAt: "desc" },
    include: {
      channel: {
        select: { name: true, handle: true, avatarUrl: true },
      },
    },
  });

  const videosForGrid = videos.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Channel banner area */}
      {channel.bannerUrl && (
        <div className="relative h-32 overflow-hidden rounded-xl bg-muted sm:h-48">
          <img
            src={channel.bannerUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Channel info */}
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={channel.avatarUrl || undefined} />
          <AvatarFallback className="text-2xl">
            {channel.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{channel.name}</h1>
          <p className="text-sm text-muted-foreground">
            @{channel.handle} &middot; {channel._count.subscribers} subscribers &middot; {channel._count.videos} videos
          </p>
          {channel.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {channel.description}
            </p>
          )}
          <div className="mt-2">
            <SubscribeButton
              channelId={channel.id}
              initialSubscribed={isSubscribed}
              initialCount={channel._count.subscribers}
            />
          </div>
        </div>
      </div>

      {/* Videos */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Videos</h2>
        <VideoGrid videos={videosForGrid} />
      </div>
    </div>
  );
}
