"use client";

import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import NotificationItem from "./NotificationItem";

interface NotificationData {
  id: string;
  type: "NEW_VIDEO" | "COMMENT_REPLY";
  videoId: string | null;
  commentId: string | null;
  read: boolean;
  createdAt: string;
  actor: { id: string; name: string; image: string | null } | null;
}

interface NotificationDropdownProps {
  onClose: () => void;
  onMarkAllRead: () => void;
}

export default function NotificationDropdown({
  onClose,
  onMarkAllRead,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/notifications?limit=20");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.items);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  async function handleMarkAllRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onMarkAllRead();
    } catch {
      // ignore
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-popover p-0 shadow-lg"
    >
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h4 className="text-sm font-semibold">Notifications</h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-1 text-xs"
          onClick={handleMarkAllRead}
        >
          <Check className="mr-1 h-3 w-3" />
          Mark all read
        </Button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        ) : notifications.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </p>
        ) : (
          notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClose={onClose} />
          ))
        )}
      </div>
    </div>
  );
}
