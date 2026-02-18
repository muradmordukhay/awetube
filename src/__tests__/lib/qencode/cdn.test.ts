import { describe, it, expect } from "vitest";
import { toCdnUrl } from "@/lib/qencode/cdn";

describe("toCdnUrl", () => {
  it("converts s3:// URL to CDN format", () => {
    expect(
      toCdnUrl(
        "s3://us-west.s3.qencode.com/mybucket/videos/abc/hls/master.m3u8"
      )
    ).toBe(
      "https://mybucket.media-storage.us-west.qencode.com/videos/abc/hls/master.m3u8"
    );
  });

  it("converts https:// S3 URL to CDN format", () => {
    expect(
      toCdnUrl(
        "https://us-west.s3.qencode.com/mybucket/videos/abc/thumbs/thumb.jpg"
      )
    ).toBe(
      "https://mybucket.media-storage.us-west.qencode.com/videos/abc/thumbs/thumb.jpg"
    );
  });

  it("handles different regions", () => {
    expect(
      toCdnUrl(
        "s3://eu-west.s3.qencode.com/bucket123/path/file.m3u8"
      )
    ).toBe(
      "https://bucket123.media-storage.eu-west.qencode.com/path/file.m3u8"
    );
  });

  it("handles deeply nested paths", () => {
    expect(
      toCdnUrl(
        "https://us-west.s3.qencode.com/mybucket/videos/abc/hls/720p/segment001.ts"
      )
    ).toBe(
      "https://mybucket.media-storage.us-west.qencode.com/videos/abc/hls/720p/segment001.ts"
    );
  });

  it("returns non-Qencode URLs unchanged", () => {
    const externalUrl = "https://cdn.example.com/video.m3u8";
    expect(toCdnUrl(externalUrl)).toBe(externalUrl);
  });

  it("returns already-CDN URLs unchanged", () => {
    const cdnUrl =
      "https://mybucket.media-storage.us-west.qencode.com/videos/abc/hls/master.m3u8";
    expect(toCdnUrl(cdnUrl)).toBe(cdnUrl);
  });

  it("returns null for empty string", () => {
    expect(toCdnUrl("")).toBeNull();
  });

  it("returns null for null input", () => {
    expect(toCdnUrl(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(toCdnUrl(undefined)).toBeNull();
  });

  it("handles http:// S3 URLs", () => {
    expect(
      toCdnUrl(
        "http://us-west.s3.qencode.com/mybucket/videos/abc/hls/master.m3u8"
      )
    ).toBe(
      "https://mybucket.media-storage.us-west.qencode.com/videos/abc/hls/master.m3u8"
    );
  });
});
