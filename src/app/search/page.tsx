import { db } from "@/lib/db";
import VideoGrid from "@/components/video/VideoGrid";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() || "";

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

  if (query) {
    try {
      const dbVideos = await db.video.findMany({
        where: {
          status: "READY",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { channel: { name: { contains: query, mode: "insensitive" } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 24,
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
    } catch {
      // Database error — show empty
    }
  }

  return (
    <div className="py-4">
      {query ? (
        <>
          <h1 className="mb-4 text-lg font-semibold">
            Search results for &ldquo;{query}&rdquo;
          </h1>
          <VideoGrid videos={videos} />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Search for videos</p>
          <p className="text-sm">
            Enter a search term in the search bar above.
          </p>
        </div>
      )}
    </div>
  );
}
