import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Clock, ThumbsUp, ListVideo, ChevronRight } from "lucide-react";
import VideoCard from "@/components/video/VideoCard";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Fetch recent watch history (4 items)
  const recentHistory = await db.watchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
    take: 4,
    include: {
      video: {
        include: {
          channel: {
            select: { name: true, handle: true, avatarUrl: true },
          },
        },
      },
    },
  });

  const historyVideos = recentHistory
    .filter((h) => h.video.status === "READY")
    .map((h) => ({
      ...h.video,
      createdAt: h.video.createdAt.toISOString(),
    }));

  // Fetch recent likes (4 items)
  const recentLikes = await db.like.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "desc" },
    take: 4,
    include: {
      video: {
        include: {
          channel: {
            select: { name: true, handle: true, avatarUrl: true },
          },
        },
      },
    },
  });

  const likedVideos = recentLikes
    .filter((l) => l.video.status === "READY")
    .map((l) => ({
      ...l.video,
      createdAt: l.video.createdAt.toISOString(),
    }));

  // Fetch recent playlists (4 items)
  const recentPlaylists = await db.playlist.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 4,
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

  return (
    <div className="py-4">
      <h1 className="mb-6 text-lg font-semibold">Library</h1>

      {/* History section */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">History</h2>
          </div>
          <Link
            href="/history"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {historyVideos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No watch history yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {historyVideos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                channelName={video.channel.name}
                channelHandle={video.channel.handle}
                channelAvatar={video.channel.avatarUrl}
                viewCount={video.viewCount}
                createdAt={video.createdAt}
                duration={video.duration}
              />
            ))}
          </div>
        )}
      </section>

      {/* Playlists section */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListVideo className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Playlists</h2>
          </div>
        </div>
        {recentPlaylists.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No playlists yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recentPlaylists.map((pl) => (
              <Link
                key={pl.id}
                href={`/playlist/${pl.id}`}
                className="group rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="relative mb-2 aspect-video overflow-hidden rounded-md bg-muted">
                  {pl.items[0]?.video.thumbnailUrl ? (
                    <img
                      src={pl.items[0].video.thumbnailUrl}
                      alt={pl.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium group-hover:text-primary truncate">
                  {pl.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {pl._count.items} videos
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Liked videos section */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThumbsUp className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Liked videos</h2>
          </div>
          <Link
            href="/liked"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            See all <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {likedVideos.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No liked videos yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {likedVideos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={video.thumbnailUrl}
                channelName={video.channel.name}
                channelHandle={video.channel.handle}
                channelAvatar={video.channel.avatarUrl}
                viewCount={video.viewCount}
                createdAt={video.createdAt}
                duration={video.duration}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
