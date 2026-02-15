"use client";

import { useState, useEffect, useRef, useCallback, type RefObject, type MutableRefObject } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  Settings,
} from "lucide-react";
import Hls from "hls.js";

interface PlayerControlsProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  hlsRef: MutableRefObject<Hls | null>;
}

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerControls({
  videoRef,
  containerRef,
  hlsRef,
}: PlayerControlsProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [qualityLevels, setQualityLevels] = useState<{ height: number; index: number }[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto
  const [seeking, setSeeking] = useState(false);
  const [pipSupported, setPipSupported] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Sync video state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      if (!seeking) setCurrentTime(video.currentTime);
    };
    const onDurationChange = () => setDuration(video.duration);
    const onVolumeChange = () => {
      setVolume(video.volume);
      setMuted(video.muted);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("volumechange", onVolumeChange);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("volumechange", onVolumeChange);
    };
  }, [videoRef, seeking]);

  // HLS quality levels
  useEffect(() => {
    const hls = hlsRef.current;
    if (!hls) return;

    function updateLevels() {
      const h = hlsRef.current;
      if (!h) return;
      const levels = h.levels
        .map((l, i) => ({ height: l.height, index: i }))
        .filter((l) => l.height > 0);
      // Deduplicate by height
      const unique = Array.from(new Map(levels.map((l) => [l.height, l])).values());
      unique.sort((a, b) => b.height - a.height);
      setQualityLevels(unique);
    }

    function onLevelSwitched() {
      const h = hlsRef.current;
      if (h) setCurrentQuality(h.currentLevel);
    }

    hls.on(Hls.Events.MANIFEST_PARSED, updateLevels);
    hls.on(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);

    // If manifest already parsed
    if (hls.levels.length > 0) updateLevels();

    return () => {
      hls.off(Hls.Events.MANIFEST_PARSED, updateLevels);
      hls.off(Hls.Events.LEVEL_SWITCHED, onLevelSwitched);
    };
  }, [hlsRef]);

  // Fullscreen change listener
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  // PiP support detection (avoid hydration mismatch)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time mount detection for browser API
    setPipSupported(!!document.pictureInPictureEnabled);
  }, []);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }
    }, 3000);
  }, [videoRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseLeave = () => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }
    };

    container.addEventListener("mousemove", resetHideTimer);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", resetHideTimer);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [containerRef, videoRef, resetHideTimer]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, [containerRef]);

  const togglePip = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    } else if (document.pictureInPictureEnabled) {
      await video.requestPictureInPicture();
    }
  }, [videoRef]);

  const handleSpeedChange = useCallback(
    (newSpeed: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = newSpeed;
      setSpeed(newSpeed);
      setShowSpeedMenu(false);
    },
    [videoRef]
  );

  const handleQualityChange = useCallback(
    (levelIndex: number) => {
      const hls = hlsRef.current;
      if (!hls) return;
      hls.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
      setShowQualityMenu(false);
    },
    [hlsRef]
  );

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;
      const val = parseFloat(e.target.value);
      video.volume = val;
      video.muted = val === 0;
    },
    [videoRef]
  );

  // Progress bar scrubbing
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const bar = progressRef.current;
      if (!video || !bar || !video.duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      video.currentTime = pct * video.duration;
    },
    [videoRef]
  );

  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setSeeking(true);
      handleProgressClick(e);

      function onMouseMove(ev: MouseEvent) {
        const video = videoRef.current;
        const bar = progressRef.current;
        if (!video || !bar || !video.duration) return;
        const rect = bar.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        video.currentTime = pct * video.duration;
        setCurrentTime(pct * video.duration);
      }

      function onMouseUp() {
        setSeeking(false);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      }

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [videoRef, handleProgressClick]
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Click to play/pause overlay */}
      <div
        className="absolute inset-0 z-10"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-8 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Progress bar */}
        <div
          ref={progressRef}
          className="group mb-2 h-1 cursor-pointer rounded-full bg-white/30 transition-all hover:h-1.5"
          onMouseDown={handleProgressMouseDown}
        >
          <div
            className="relative h-full rounded-full bg-red-600"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute -right-1.5 -top-1 h-3 w-3 rounded-full bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center gap-2 text-white">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="p-1 hover:scale-110 transition-transform"
            title={playing ? "Pause (k)" : "Play (k)"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          {/* Volume */}
          <button onClick={toggleMute} className="p-1" title="Mute (m)">
            {muted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer accent-white"
          />

          {/* Time */}
          <span className="text-xs tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Speed selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowQualityMenu(false);
              }}
              className="rounded px-1.5 py-0.5 text-xs hover:bg-white/20"
              title="Playback speed"
            >
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-1 rounded bg-black/90 py-1">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`block w-full px-4 py-1 text-left text-xs hover:bg-white/20 ${
                      speed === s ? "text-red-500 font-medium" : ""
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quality selector (HLS only) */}
          {qualityLevels.length > 1 && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
                className="p-1 hover:scale-110 transition-transform"
                title="Quality"
              >
                <Settings className="h-4 w-4" />
              </button>
              {showQualityMenu && (
                <div className="absolute bottom-full right-0 mb-1 rounded bg-black/90 py-1">
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`block w-full px-4 py-1 text-left text-xs hover:bg-white/20 ${
                      currentQuality === -1 ? "text-red-500 font-medium" : ""
                    }`}
                  >
                    Auto
                  </button>
                  {qualityLevels.map((l) => (
                    <button
                      key={l.index}
                      onClick={() => handleQualityChange(l.index)}
                      className={`block w-full px-4 py-1 text-left text-xs hover:bg-white/20 ${
                        currentQuality === l.index ? "text-red-500 font-medium" : ""
                      }`}
                    >
                      {l.height}p
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PiP */}
          {pipSupported && (
            <button
              onClick={togglePip}
              className="p-1 hover:scale-110 transition-transform"
              title="Picture in Picture"
            >
              <PictureInPicture2 className="h-4 w-4" />
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 hover:scale-110 transition-transform"
            title="Fullscreen (f)"
          >
            {isFullscreen ? (
              <Minimize className="h-5 w-5" />
            ) : (
              <Maximize className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
