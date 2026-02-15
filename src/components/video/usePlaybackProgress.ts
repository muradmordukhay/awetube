import { useEffect, useRef, RefObject } from "react";

interface PlaybackProgressOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoId: string;
  initialProgress?: number;
}

export default function usePlaybackProgress({
  videoRef,
  videoId,
  initialProgress = 0,
}: PlaybackProgressOptions) {
  const lastSavedRef = useRef(0);
  const hasSetInitialRef = useRef(false);

  // Set initial playback position
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialProgress || hasSetInitialRef.current) return;

    function setStart() {
      if (video && !hasSetInitialRef.current && initialProgress > 0) {
        video.currentTime = initialProgress;
        hasSetInitialRef.current = true;
      }
    }

    if (video.readyState >= 1) {
      setStart();
    } else {
      video.addEventListener("loadedmetadata", setStart, { once: true });
      return () => video.removeEventListener("loadedmetadata", setStart);
    }
  }, [videoRef, initialProgress]);

  // Periodic progress saving
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function saveProgress() {
      const video = videoRef.current;
      if (!video || !video.duration) return;
      const current = Math.floor(video.currentTime);
      if (current === lastSavedRef.current) return;
      lastSavedRef.current = current;

      fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, progressSeconds: current }),
      }).catch(() => {});
    }

    // Save every 10 seconds during playback
    const interval = setInterval(() => {
      if (video && !video.paused) {
        saveProgress();
      }
    }, 10000);

    // Save on page unload
    function handleBeforeUnload() {
      saveProgress();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      saveProgress();
    };
  }, [videoRef, videoId]);
}
