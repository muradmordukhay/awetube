/**
 * Parses the media results from a completed Qencode callback payload.
 *
 * Extracts the HLS manifest URL, thumbnail URL, and video metadata from
 * the callback's `videos` and `images` arrays. Business logic that was
 * previously inline in the callback route handler is centralised here
 * so it can be tested independently.
 */
import { toCdnUrl } from "./cdn";
import type { QencodeCallbackPayload } from "./types";

export interface CallbackMediaResult {
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  width: number | null;
  height: number | null;
}

export function parseCallbackResults(
  payload: QencodeCallbackPayload
): CallbackMediaResult {
  let hlsUrl: string | null = null;
  let thumbnailUrl: string | null = null;
  let duration: number | null = null;
  let width: number | null = null;
  let height: number | null = null;

  if (payload.videos && payload.videos.length > 0) {
    const hlsVideo = payload.videos.find(
      (v) => v.url.endsWith(".m3u8") || v.tag === "advanced_hls"
    );
    if (hlsVideo) {
      hlsUrl = toCdnUrl(hlsVideo.url);
      duration = hlsVideo.duration ?? null;
      width = hlsVideo.width ?? null;
      height = hlsVideo.height ?? null;
    }
  }

  if (payload.images && payload.images.length > 0) {
    thumbnailUrl = toCdnUrl(payload.images[0].url);
  }

  return { hlsUrl, thumbnailUrl, duration, width, height };
}
