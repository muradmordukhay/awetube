"use client";

import { useEffect, useRef } from "react";
import usePlaybackProgress from "./usePlaybackProgress";

interface VideoPlayerProps {
  hlsUrl: string | null;
  mp4Url?: string | null;
  thumbnailUrl?: string | null;
  subtitlesUrl?: string | null;
  videoId?: string;
  initialProgress?: number;
}

export default function VideoPlayerWrapper({
  hlsUrl,
  mp4Url,
  thumbnailUrl,
  // TODO: Pass subtitlesUrl to Qencode player when subtitle support is configured
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subtitlesUrl,
  videoId,
  initialProgress = 0,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<QencodePlayerInstance | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const src = hlsUrl || mp4Url;
    if (!src || !containerRef.current) return;

    const playerId = `qencode-player-${videoId || "default"}`;
    containerRef.current.id = playerId;

    function initPlayer(id: string, source: string) {
      if (typeof window.qPlayer === "undefined") return;

      playerRef.current = window.qPlayer(id, {
        licenseKey: process.env.NEXT_PUBLIC_QENCODE_PLAYER_LICENSE || "",
        videoSources: { src: source },
        ...(thumbnailUrl ? { poster: thumbnailUrl } : {}),
      });

      // Get underlying video element for progress tracking
      // Qencode player renders a <video> element inside the container
      const checkForVideo = () => {
        const videoEl = containerRef.current?.querySelector("video");
        if (videoEl) {
          videoElementRef.current = videoEl as HTMLVideoElement;
        }
      };

      // The player may render the video element asynchronously
      checkForVideo();
      if (!videoElementRef.current) {
        const observer = new MutationObserver(() => {
          checkForVideo();
          if (videoElementRef.current) observer.disconnect();
        });
        if (containerRef.current) {
          observer.observe(containerRef.current, {
            childList: true,
            subtree: true,
          });
        }
        // Clean up observer after 5s in case video never appears
        setTimeout(() => observer.disconnect(), 5000);
      }
    }

    // Load Qencode player script if not already loaded
    const scriptId = "qencode-player-script";
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://player.qencode.com/qencode-bootstrapper.min.js";
      script.async = true;
      script.onload = () => initPlayer(playerId, src);
      document.head.appendChild(script);
    } else if (typeof window.qPlayer !== "undefined") {
      initPlayer(playerId, src);
    } else {
      // Script exists but hasn't loaded yet — wait for it
      existingScript.addEventListener("load", () =>
        initPlayer(playerId, src)
      );
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      videoElementRef.current = null;
    };
  }, [hlsUrl, mp4Url, thumbnailUrl, videoId]);

  // Keep playback progress tracking (uses the underlying <video> element)
  usePlaybackProgress({
    videoRef: videoElementRef,
    videoId: videoId || "",
    initialProgress,
  });

  const src = hlsUrl || mp4Url;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      tabIndex={0}
    >
      {!src && (
        <div className="flex h-full items-center justify-center text-white">
          <p>Video is processing...</p>
        </div>
      )}
    </div>
  );
}
