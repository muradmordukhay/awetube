"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscribeButtonProps {
  channelId: string;
  initialSubscribed: boolean;
  initialCount: number;
}

function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

export default function SubscribeButton({
  channelId,
  initialSubscribed,
  initialCount,
}: SubscribeButtonProps) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    const prevSubscribed = subscribed;
    const prevCount = count;

    // Optimistic update
    setSubscribed(!subscribed);
    setCount((c) => c + (subscribed ? -1 : 1));
    setLoading(true);

    try {
      const res = await fetch(`/api/subscriptions/${channelId}`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribed(data.subscribed);
        setCount(data.subscriberCount);
      } else {
        // Revert
        setSubscribed(prevSubscribed);
        setCount(prevCount);
      }
    } catch {
      setSubscribed(prevSubscribed);
      setCount(prevCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={subscribed ? "secondary" : "default"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
    >
      {subscribed && <Bell className="h-4 w-4" />}
      {subscribed ? "Subscribed" : "Subscribe"}
      <span className="text-xs opacity-70">{formatCount(count)}</span>
    </Button>
  );
}
