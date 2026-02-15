"use client";

import Link from "next/link";
import { Video, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NotificationData {
  id: string;
  type: "NEW_VIDEO" | "COMMENT_REPLY";
  videoId: string | null;
  read: boolean;
  createdAt: string;
  actor: { id: string; name: string; image: string | null } | null;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  const intervals = [
    { label: "y", seconds: 31536000 },
    { label: "mo", seconds: 2592000 },
    { label: "w", seconds: 604800 },
    { label: "d", seconds: 86400 },
    { label: "h", seconds: 3600 },
    { label: "m", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) return `${count}${interval.label} ago`;
  }
  return "now";
}

function getNotificationMessage(type: "NEW_VIDEO" | "COMMENT_REPLY", actorName: string): string {
  switch (type) {
    case "NEW_VIDEO":
      return `${actorName} uploaded a new video`;
    case "COMMENT_REPLY":
      return `${actorName} replied to your comment`;
  }
}

export default function NotificationItem({
  notification,
  onClose,
}: {
  notification: NotificationData;
  onClose: () => void;
}) {
  const href = notification.videoId ? `/watch/${notification.videoId}` : "#";
  const actorName = notification.actor?.name || "Someone";
  const Icon = notification.type === "NEW_VIDEO" ? Video : MessageSquare;

  async function handleClick() {
    if (!notification.read) {
      fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      }).catch(() => {});
    }
    onClose();
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={`flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors ${
        !notification.read ? "bg-accent/50" : ""
      }`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={notification.actor?.image || undefined} />
        <AvatarFallback>{actorName.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          {getNotificationMessage(notification.type, actorName)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
