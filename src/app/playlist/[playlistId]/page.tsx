import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import VideoGrid from "@/components/video/VideoGrid";

interface PlaylistPageProps {
  params: Promise<{ playlistId: string }>;
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
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

  if (!playlist) notFound();

  // Check access for private playlists
  if (playlist.visibility === "PRIVATE") {
    const session = await auth();
    if (session?.user?.id !== playlist.userId) {
      notFound();
    }
  }

  const videos = playlist.items
    .filter((item) => item.video.status === "READY")
    .map((item) => ({
      ...item.video,
      createdAt: item.video.createdAt.toISOString(),
    }));

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">{playlist.title}</h1>
        <p className="text-sm text-muted-foreground">
          {playlist.user.name} &middot; {playlist._count.items} videos &middot;{" "}
          {playlist.visibility.toLowerCase()}
        </p>
        {playlist.description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {playlist.description}
          </p>
        )}
      </div>
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No videos in this playlist</p>
          <p className="text-sm">Add videos to see them here.</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
