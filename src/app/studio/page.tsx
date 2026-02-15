import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Video, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const channel = await db.channel.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { videos: true } },
      videos: {
        select: { viewCount: true },
      },
    },
  });

  const totalViews =
    channel?.videos.reduce((sum, v) => sum + v.viewCount, 0) || 0;
  const totalVideos = channel?._count.videos || 0;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Creator Studio</h1>
        <Button asChild>
          <Link href="/upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload video
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <Video className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalVideos}</p>
              <p className="text-sm text-muted-foreground">Total videos</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total views</p>
            </div>
          </div>
        </div>
      </div>

      <Button variant="outline" asChild>
        <Link href="/studio/videos">Manage videos</Link>
      </Button>
    </div>
  );
}
