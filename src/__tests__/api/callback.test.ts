import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/upload/callback/route";
import { db } from "@/lib/db";
import { signCallbackUrl } from "@/lib/callback-signature";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(
  body: unknown,
  params?: { vid?: string; sig?: string }
) {
  const url = new URL("http://localhost/api/upload/callback");
  if (params?.vid) url.searchParams.set("vid", params.vid);
  if (params?.sig) url.searchParams.set("sig", params.sig);

  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/upload/callback", () => {
  it("returns 403 when signature params are missing", async () => {
    const res = await POST(makeRequest({ task_token: "tok" }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("signature");
  });

  it("returns 403 for invalid signature", async () => {
    const res = await POST(
      makeRequest(
        { task_token: "tok" },
        { vid: "video1", sig: "0".repeat(64) }
      )
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when video not found", async () => {
    const videoId = "video-123";
    const taskToken = "task-456";
    const sig = signCallbackUrl(videoId, taskToken);

    mockDb.video.findFirst.mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest(
        { task_token: taskToken, status: "completed" },
        { vid: videoId, sig }
      )
    );
    expect(res.status).toBe(404);
  });

  it("updates video to READY on completed callback", async () => {
    const videoId = "video-123";
    const taskToken = "task-456";
    const sig = signCallbackUrl(videoId, taskToken);

    mockDb.video.findFirst.mockResolvedValueOnce({
      id: videoId,
      channelId: "channel-1",
      qencodeTaskToken: taskToken,
    } as never);
    mockDb.video.update.mockResolvedValueOnce({
      id: videoId,
      channelId: "channel-1",
      channel: { userId: "user-1" },
    } as never);

    const res = await POST(
      makeRequest(
        {
          task_token: taskToken,
          status: "completed",
          videos: [
            {
              url: "https://us-west.s3.qencode.com/mybucket/videos/video-123/hls/master.m3u8",
              tag: "advanced_hls",
              duration: 120,
              width: 1920,
              height: 1080,
            },
          ],
          images: [
            {
              url: "https://us-west.s3.qencode.com/mybucket/videos/video-123/thumbs/thumb.jpg",
            },
          ],
        },
        { vid: videoId, sig }
      )
    );

    expect(res.status).toBe(200);
    // URLs should be rewritten from Qencode S3 to CDN format
    expect(mockDb.video.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: videoId },
        data: expect.objectContaining({
          status: "READY",
          hlsUrl:
            "https://mybucket.media-storage.us-west.qencode.com/videos/video-123/hls/master.m3u8",
          thumbnailUrl:
            "https://mybucket.media-storage.us-west.qencode.com/videos/video-123/thumbs/thumb.jpg",
        }),
      })
    );
  });

  it("updates video to FAILED on error callback", async () => {
    const videoId = "video-123";
    const taskToken = "task-456";
    const sig = signCallbackUrl(videoId, taskToken);

    mockDb.video.findFirst.mockResolvedValueOnce({
      id: videoId,
      qencodeTaskToken: taskToken,
    } as never);
    mockDb.video.update.mockResolvedValueOnce({} as never);

    const res = await POST(
      makeRequest(
        {
          task_token: taskToken,
          status: "error",
          error: 1,
          error_description: "Encoding failed",
        },
        { vid: videoId, sig }
      )
    );

    expect(res.status).toBe(200);
    expect(mockDb.video.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: "FAILED" },
      })
    );
  });
});
