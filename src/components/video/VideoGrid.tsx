import VideoCard from "./VideoCard";

interface VideoItem {
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
}

interface VideoGridProps {
  videos: VideoItem[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">No videos found</p>
        <p className="text-sm">Videos that are uploaded will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
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
  );
}
