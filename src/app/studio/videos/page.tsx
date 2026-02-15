import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import VideoActions from "@/components/studio/VideoActions";

const statusColors: Record<string, string> = {
  READY: "bg-green-500/10 text-green-700",
  PROCESSING: "bg-yellow-500/10 text-yellow-700",
  UPLOADING: "bg-blue-500/10 text-blue-700",
  FAILED: "bg-red-500/10 text-red-700",
};

export default async function StudioVideosPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const channel = await db.channel.findUnique({
    where: { userId: session.user.id },
  });

  if (!channel) redirect("/login");

  const videos = await db.video.findMany({
    where: { channelId: channel.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="mb-6 text-2xl font-bold">Your videos</h1>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <p className="text-lg font-medium">No videos yet</p>
          <p className="text-sm">Upload your first video to get started.</p>
          <Button asChild className="mt-4">
            <Link href="/upload">Upload video</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-center gap-4 rounded-xl border p-4"
            >
              {/* Thumbnail */}
              <div className="relative h-20 w-36 shrink-0 overflow-hidden rounded-lg bg-muted">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    Processing
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium">{video.title}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={statusColors[video.status] || ""}
                  >
                    {video.status}
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" />
                    {video.viewCount}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(video.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <VideoActions
                videoId={video.id}
                title={video.title}
                description={video.description}
                status={video.status}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
