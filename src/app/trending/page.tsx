import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";

export default async function TrendingPage() {
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
      take: 100,
      include: {
        channel: {
          select: { name: true, handle: true, avatarUrl: true },
        },
      },
    });

    // Rank by time-decayed popularity: score = viewCount / hoursSincePublished^1.5
    const now = new Date().getTime();
    const scored = dbVideos.map((v) => {
      const hoursAge = Math.max(
        1,
        (now - new Date(v.publishedAt ?? v.createdAt).getTime()) / 3_600_000
      );
      const score = v.viewCount / Math.pow(hoursAge, 1.5);
      return { video: v, score };
    });

    scored.sort((a, b) => b.score - a.score);

    videos = scored.slice(0, 24).map(({ video }) => ({
      ...video,
      createdAt: video.createdAt.toISOString(),
    }));
  } catch {
    // Database not connected — show empty state
  }

  return (
    <div className="py-4">
      <h1 className="mb-4 text-lg font-semibold">Trending</h1>
      <VideoGrid videos={videos} />
    </div>
  );
}
