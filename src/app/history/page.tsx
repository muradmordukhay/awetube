import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";
import ClearHistoryButton from "@/components/history/ClearHistoryButton";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const history = await db.watchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { watchedAt: "desc" },
    take: 50,
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

  const videos = history
    .filter((h) => h.video.status === "READY")
    .map((h) => ({
      ...h.video,
      createdAt: h.video.createdAt.toISOString(),
    }));

  return (
    <div className="py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Watch history</h1>
        {videos.length > 0 && <ClearHistoryButton />}
      </div>
      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">No watch history</p>
          <p className="text-sm">Videos you watch will appear here.</p>
        </div>
      ) : (
        <VideoGrid videos={videos} />
      )}
    </div>
  );
}
