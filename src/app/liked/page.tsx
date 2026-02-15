import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";

export default async function LikedVideosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const likes = await db.like.findMany({
    where: { userId: session.user.id },
    orderBy: { id: "desc" },
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

  const videos = likes
    .filter((l) => l.video.status === "READY")
    .map((l) => ({
      ...l.video,
      createdAt: l.video.createdAt.toISOString(),
    }));

  return (
    <div className="py-4">
      <h1 className="mb-4 text-lg font-semibold">Liked videos</h1>
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No liked videos</p>
          <p className="text-sm">Videos you like will appear here.</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
