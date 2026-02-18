import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import VideoPlayerWrapper from "@/components/video/VideoPlayer";
import VideoDetails from "@/components/video/VideoDetails";
import CommentSection from "@/components/comments/CommentSection";

interface WatchPageProps {
  params: Promise<{ videoId: string }>;
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { videoId } = await params;

  const video = await db.video.findUnique({
    where: { id: videoId },
    include: {
      channel: {
        select: {
          id: true,
          userId: true,
          name: true,
          handle: true,
          avatarUrl: true,
          _count: { select: { videos: true, subscribers: true } },
        },
      },
      _count: { select: { comments: true, likes: true } },
    },
  });

  if (!video) notFound();

  const licenseKey = process.env.NEXT_PUBLIC_QENCODE_PLAYER_LICENSE || "";

  // Increment view
  await db.video.update({
    where: { id: videoId },
    data: { viewCount: { increment: 1 } },
  });

  // Get saved playback progress and subscription status for current user
  let initialProgress = 0;
  let isSubscribed = false;
  let isLiked = false;
  const session = await auth();
  if (session?.user?.id) {
    const [history, subscription, like] = await Promise.all([
      db.watchHistory.findUnique({
        where: { userId_videoId: { userId: session.user.id, videoId } },
        select: { progressSeconds: true },
      }),
      db.subscription.findUnique({
        where: {
          userId_channelId: {
            userId: session.user.id,
            channelId: video.channelId,
          },
        },
      }),
      db.like.findUnique({
        where: {
          videoId_userId: { videoId, userId: session.user.id },
        },
      }),
    ]);
    if (history) initialProgress = history.progressSeconds;
    isSubscribed = !!subscription;
    isLiked = !!like;
  }

  // Get recommended videos (same channel + recent)
  const recommended = await db.video.findMany({
    where: {
      status: "READY",
      id: { not: videoId },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      channel: {
        select: { name: true, handle: true, avatarUrl: true },
      },
    },
  });

  const recommendedForGrid = recommended.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        <VideoPlayerWrapper
          hlsUrl={video.hlsUrl}
          mp4Url={video.mp4Url}
          thumbnailUrl={video.thumbnailUrl}
          subtitlesUrl={video.subtitlesUrl}
          videoId={video.id}
          initialProgress={initialProgress}
          licenseKey={licenseKey}
        />
        <VideoDetails
          videoId={video.id}
          title={video.title}
          description={video.description}
          viewCount={video.viewCount + 1}
          likeCount={video.likeCount}
          createdAt={video.createdAt.toISOString()}
          channelId={video.channel.id}
          channelName={video.channel.name}
          channelHandle={video.channel.handle}
          channelAvatar={video.channel.avatarUrl}
          channelVideoCount={video.channel._count.videos}
          subscriberCount={video.channel._count.subscribers}
          isSubscribed={isSubscribed}
          isLiked={isLiked}
        />
        <CommentSection
          videoId={video.id}
          commentCount={video._count.comments}
          videoOwnerId={video.channel.userId}
        />
      </div>

      {/* Sidebar recommendations */}
      <div className="w-full lg:w-96 shrink-0">
        <h3 className="mb-4 text-sm font-semibold">Recommended</h3>
        <div className="flex flex-col gap-3">
          {recommendedForGrid.map((v) => (
            <a
              key={v.id}
              href={`/watch/${v.id}`}
              className="flex gap-2 group"
            >
              <div className="relative aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-muted">
                {v.thumbnailUrl ? (
                  <img
                    src={v.thumbnailUrl}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No thumb
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                  {v.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {v.channel.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {v.viewCount} views
                </p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
