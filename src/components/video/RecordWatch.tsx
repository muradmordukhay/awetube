"use client";

import { useEffect } from "react";

export default function RecordWatch({ videoId }: { videoId: string }) {
  useEffect(() => {
    fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId }),
    }).catch(() => {});
  }, [videoId]);

  return null;
}
