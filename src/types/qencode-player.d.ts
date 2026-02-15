/**
 * Type declarations for the Qencode Video Player SDK.
 *
 * The player is loaded via an external script tag:
 * https://player.qencode.com/qencode-bootstrapper.min.js
 *
 * Once loaded, it exposes a global `qPlayer` function.
 */

interface QencodePlayerOptions {
  /** Qencode player license key */
  licenseKey: string;
  /** Video source configuration */
  videoSources: {
    /** URL to HLS manifest, DASH manifest, or MP4 file */
    src: string;
  };
  /** Poster image URL */
  poster?: string;
}

interface QencodePlayerInstance {
  /** Destroy the player instance and clean up resources */
  destroy?: () => void;
  /** Start playback */
  play?: () => void;
  /** Pause playback */
  pause?: () => void;
}

declare function qPlayer(
  elementId: string,
  options: QencodePlayerOptions
): QencodePlayerInstance;

interface Window {
  qPlayer: typeof qPlayer;
}
