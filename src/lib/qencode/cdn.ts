/**
 * Qencode CDN URL utilities.
 *
 * Qencode S3 URLs follow:  s3://{region}.s3.qencode.com/{bucket}/{path}
 * Qencode HTTPS URLs:      https://{region}.s3.qencode.com/{bucket}/{path}
 * Qencode CDN URLs:        https://{bucket}.media-storage.{region}.qencode.com/{path}
 *
 * This module converts raw S3/HTTPS URLs from Qencode callbacks into
 * CDN-delivered URLs for client-side playback.
 */

const S3_PATTERN =
  /^s3:\/\/([a-z0-9-]+)\.s3\.qencode\.com\/([^/]+)\/(.+)$/;
const HTTPS_PATTERN =
  /^https?:\/\/([a-z0-9-]+)\.s3\.qencode\.com\/([^/]+)\/(.+)$/;

/**
 * Converts a Qencode S3 or HTTPS storage URL to its CDN equivalent.
 *
 * @example
 * toCdnUrl("s3://us-west.s3.qencode.com/mybucket/videos/abc/hls/master.m3u8")
 * // → "https://mybucket.media-storage.us-west.qencode.com/videos/abc/hls/master.m3u8"
 *
 * @example
 * toCdnUrl("https://us-west.s3.qencode.com/mybucket/videos/abc/thumbs/thumb.jpg")
 * // → "https://mybucket.media-storage.us-west.qencode.com/videos/abc/thumbs/thumb.jpg"
 *
 * If the URL doesn't match a known Qencode pattern, it's returned as-is.
 */
export function toCdnUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  // Try s3:// pattern first
  const s3Match = rawUrl.match(S3_PATTERN);
  if (s3Match) {
    const [, region, bucket, path] = s3Match;
    return `https://${bucket}.media-storage.${region}.qencode.com/${path}`;
  }

  // Try https:// storage pattern
  const httpsMatch = rawUrl.match(HTTPS_PATTERN);
  if (httpsMatch) {
    const [, region, bucket, path] = httpsMatch;
    return `https://${bucket}.media-storage.${region}.qencode.com/${path}`;
  }

  // Already a CDN URL or unrecognized format — return as-is
  return rawUrl;
}

