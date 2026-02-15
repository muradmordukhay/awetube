"use client";

import { useState } from "react";
import Link from "next/link";
import { ThumbsUp, Share2, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import SubscribeButton from "@/components/channel/SubscribeButton";
import SaveToPlaylistDialog from "@/components/playlist/SaveToPlaylistDialog";
import WatchLaterButton from "@/components/playlist/WatchLaterButton";

interface VideoDetailsProps {
  videoId: string;
  title: string;
  description: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  channelId: string;
  channelName: string;
  channelHandle: string;
  channelAvatar: string | null;
  channelVideoCount: number;
  subscriberCount?: number;
  isSubscribed?: boolean;
  isLiked?: boolean;
}

function formatViews(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function VideoDetails({
  videoId,
  title,
  description,
  viewCount,
  likeCount,
  createdAt,
  channelId,
  channelName,
  channelHandle,
  channelAvatar,
  channelVideoCount,
  subscriberCount = 0,
  isSubscribed = false,
  isLiked = false,
}: VideoDetailsProps) {
  const [showDescription, setShowDescription] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [currentLikes, setCurrentLikes] = useState(likeCount);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setCurrentLikes((prev) => prev + (newLiked ? 1 : -1));

    try {
      const res = await fetch(`/api/videos/${videoId}/like`, {
        method: "POST",
      });
      if (!res.ok) {
        // Revert on failure
        setLiked(!newLiked);
        setCurrentLikes((prev) => prev + (newLiked ? -1 : 1));
      }
    } catch {
      setLiked(!newLiked);
      setCurrentLikes((prev) => prev + (newLiked ? -1 : 1));
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/watch/${videoId}`;
    if (navigator.share) {
      navigator.share({ title, url });
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="mt-3 space-y-3">
      <h1 className="text-xl font-bold">{title}</h1>

      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Channel info */}
        <div className="flex items-center gap-3">
          <Link href={`/channel/${channelHandle}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={channelAvatar || undefined} />
              <AvatarFallback>
                {channelName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div>
            <Link
              href={`/channel/${channelHandle}`}
              className="text-sm font-semibold hover:text-primary"
            >
              {channelName}
            </Link>
            <p className="text-xs text-muted-foreground">
              {channelVideoCount} videos
            </p>
          </div>
          <SubscribeButton
            channelId={channelId}
            initialSubscribed={isSubscribed}
            initialCount={subscriberCount}
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant={liked ? "default" : "secondary"}
            size="sm"
            onClick={handleLike}
            className="gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            {formatViews(currentLikes)}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <SaveToPlaylistDialog videoId={videoId} />
          <WatchLaterButton videoId={videoId} />
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl bg-muted/50 p-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{formatViews(viewCount)} views</span>
          <span>&middot;</span>
          <span>{formatDate(createdAt)}</span>
        </div>
        {description && (
          <>
            <p
              className={`mt-2 whitespace-pre-wrap text-sm ${!showDescription ? "line-clamp-2" : ""}`}
            >
              {description}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDescription(!showDescription)}
              className="mt-1 h-auto p-0 text-xs font-semibold"
            >
              {showDescription ? (
                <>
                  Show less <ChevronUp className="ml-1 h-3 w-3" />
                </>
              ) : (
                <>
                  Show more <ChevronDown className="ml-1 h-3 w-3" />
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
