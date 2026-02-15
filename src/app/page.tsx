import VideoGrid from "@/components/video/VideoGrid";
import { db } from "@/lib/db";

export default async function HomePage() {
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

  try {
    const dbVideos = await db.video.findMany({
      where: { status: "READY" },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        channel: {
          select: {
            name: true,
            handle: true,
            avatarUrl: true,
          },
        },
      },
    });

    videos = dbVideos.map((v) => ({
      ...v,
      createdAt: v.createdAt.toISOString(),
    }));
  } catch {
    // Database not connected yet — show empty state
  }

  return (
    <div className="py-4">
      <VideoGrid videos={videos} />
    </div>
  );
}
