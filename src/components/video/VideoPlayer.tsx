"use client";

import { useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";
import PlayerControls from "./PlayerControls";
import useKeyboardShortcuts from "./useKeyboardShortcuts";
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
  subtitlesUrl,
  videoId,
  initialProgress = 0,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Initialize HLS or native playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = hlsUrl || mp4Url;
    if (!src) return;

    // HLS playback
    if (hlsUrl && Hls.isSupported()) {
      const hlsInstance = new Hls({
        enableWorker: true,
        startLevel: -1, // auto quality
      });
      hlsInstance.loadSource(hlsUrl);
      hlsInstance.attachMedia(video);
      hlsRef.current = hlsInstance;

      return () => {
        hlsInstance.destroy();
        hlsRef.current = null;
      };
    }

    // Native HLS (Safari) or mp4 fallback
    if (hlsUrl && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
    } else if (mp4Url) {
      video.src = mp4Url;
    }
  }, [hlsUrl, mp4Url]);

  // Playback progress saving
  usePlaybackProgress({
    videoRef,
    videoId: videoId || "",
    initialProgress,
  });

  // Keyboard shortcuts
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else container.requestFullscreen();
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const handleSpeedChange = useCallback((delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newRate = Math.max(0.25, Math.min(2, video.playbackRate + delta));
    video.playbackRate = newRate;
  }, []);

  useKeyboardShortcuts({
    videoRef,
    containerRef,
    onTogglePlay: togglePlay,
    onToggleFullscreen: toggleFullscreen,
    onToggleMute: toggleMute,
    onSpeedChange: handleSpeedChange,
  });

  const src = hlsUrl || mp4Url;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full overflow-hidden rounded-xl bg-black"
      tabIndex={0}
    >
      {src ? (
        <>
          <video
            ref={videoRef}
            className="h-full w-full"
            poster={thumbnailUrl || undefined}
            playsInline
          >
            {subtitlesUrl && (
              <track
                src={subtitlesUrl}
                kind="subtitles"
                srcLang="en"
                label="English (auto)"
              />
            )}
          </video>
          <PlayerControls
            videoRef={videoRef}
            containerRef={containerRef}
            hlsRef={hlsRef}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-white">
          <p>Video is processing...</p>
        </div>
      )}
    </div>
  );
}
