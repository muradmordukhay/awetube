"use client";

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  channelName: string;
  channelHandle: string;
  channelAvatar: string | null;
  viewCount: number;
  createdAt: string;
  duration: number | null;
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatTimeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
    }
  }
  return "Just now";
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoCard({
  id,
  title,
  thumbnailUrl,
  channelName,
  channelHandle,
  channelAvatar,
  viewCount,
  createdAt,
  duration,
}: VideoCardProps) {
  return (
    <div className="group cursor-pointer">
      {/* Thumbnail */}
      <Link href={`/watch/${id}`}>
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No thumbnail
            </div>
          )}
          {duration && (
            <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="mt-3 flex gap-3">
        <Link href={`/channel/${channelHandle}`} className="shrink-0">
          <Avatar className="h-9 w-9">
            <AvatarImage src={channelAvatar || undefined} />
            <AvatarFallback>
              {channelName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/watch/${id}`}>
            <h3 className="line-clamp-2 text-sm font-medium leading-snug">
              {title}
            </h3>
          </Link>
          <Link
            href={`/channel/${channelHandle}`}
            className="mt-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {channelName}
          </Link>
          <p className="text-xs text-muted-foreground">
            {formatViews(viewCount)} &middot; {formatTimeAgo(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
