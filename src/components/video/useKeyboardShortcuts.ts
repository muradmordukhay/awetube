import { useEffect, RefObject } from "react";

interface KeyboardShortcutsOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  onTogglePlay: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onSpeedChange: (delta: number) => void;
}

export default function useKeyboardShortcuts({
  videoRef,
  containerRef,
  onTogglePlay,
  onToggleFullscreen,
  onToggleMute,
  onSpeedChange,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleKeyDown(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;

      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          onTogglePlay();
          break;
        case "f":
          e.preventDefault();
          onToggleFullscreen();
          break;
        case "m":
          e.preventDefault();
          onToggleMute();
          break;
        case "j":
        case "ArrowLeft":
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case "l":
        case "ArrowRight":
          e.preventDefault();
          video.currentTime = Math.min(
            video.duration || 0,
            video.currentTime + 10
          );
          break;
        case ">":
          e.preventDefault();
          onSpeedChange(0.25);
          break;
        case "<":
          e.preventDefault();
          onSpeedChange(-0.25);
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          e.preventDefault();
          video.currentTime = (video.duration || 0) * (parseInt(e.key) / 10);
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [videoRef, containerRef, onTogglePlay, onToggleFullscreen, onToggleMute, onSpeedChange]);
}
