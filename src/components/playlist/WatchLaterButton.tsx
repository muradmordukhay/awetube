"use client";

import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WatchLaterButtonProps {
  videoId: string;
}

export default function WatchLaterButton({ videoId }: WatchLaterButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    const prev = saved;
    setSaved(!saved);

    try {
      const res = await fetch("/api/playlists/watch-later", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
      } else {
        setSaved(prev);
      }
    } catch {
      setSaved(prev);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className="gap-2"
      title={saved ? "Remove from Watch Later" : "Save to Watch Later"}
    >
      <Clock className={`h-4 w-4 ${saved ? "text-primary" : ""}`} />
      {saved ? "Saved" : "Watch later"}
    </Button>
  );
}
