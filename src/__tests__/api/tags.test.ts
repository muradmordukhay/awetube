import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { GET as listTags } from "@/app/api/tags/route";
import { GET as listTagVideos } from "@/app/api/tags/[tagName]/videos/route";
import { POST as addTag } from "@/app/api/videos/[videoId]/tags/route";
import { DELETE as removeTag } from "@/app/api/videos/[videoId]/tags/[tagId]/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeGetRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost"));
}

function makePostRequest(url: string, body: unknown) {
  return new NextRequest(new URL(url, "http://localhost"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(url: string) {
  return new NextRequest(new URL(url, "http://localhost"), {
    method: "DELETE",
  });
}

// === GET /api/tags ===
describe("GET /api/tags", () => {
  it("returns tags with video counts", async () => {
    mockDb.tag.findMany.mockResolvedValueOnce([
      { id: "t1", name: "javascript", _count: { videos: 5 } },
      { id: "t2", name: "react", _count: { videos: 3 } },
    ]);

    const res = await listTags(makeGetRequest("/api/tags"));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.tags).toHaveLength(2);
    expect(data.tags[0].name).toBe("javascript");
    expect(data.nextCursor).toBeNull();
  });

  it("passes search query to filter", async () => {
    mockDb.tag.findMany.mockResolvedValueOnce([]);

    await listTags(makeGetRequest("/api/tags?q=java"));
    expect(mockDb.tag.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: { contains: "java", mode: "insensitive" } },
      })
    );
  });

  it("returns nextCursor when more results exist", async () => {
    const tags = Array.from({ length: 21 }, (_, i) => ({
      id: `t${i}`,
      name: `tag-${i}`,
      _count: { videos: 1 },
    }));
    mockDb.tag.findMany.mockResolvedValueOnce(tags);

    const res = await listTags(makeGetRequest("/api/tags"));
    const data = await res.json();
    expect(data.tags).toHaveLength(20);
    expect(data.nextCursor).toBe("t19");
  });
});

// === POST /api/videos/:videoId/tags ===
describe("POST /api/videos/:videoId/tags", () => {
  const videoId = "video-123";
  const params = Promise.resolve({ videoId });

  it("returns 401 when not authenticated", async () => {
    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "test" }),
      { params }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when video not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "test" }),
      { params }
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the video owner", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-2" },
    });

    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "test" }),
      { params }
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when max tags reached", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-1" },
    });
    mockDb.videoTag.count.mockResolvedValueOnce(10);

    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "test" }),
      { params }
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Maximum");
  });

  it("returns 409 when tag already added", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-1" },
    });
    mockDb.videoTag.count.mockResolvedValueOnce(3);
    mockDb.tag.upsert.mockResolvedValueOnce({ id: "t1", name: "test" });
    mockDb.videoTag.findUnique.mockResolvedValueOnce({
      videoId,
      tagId: "t1",
    });

    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "test" }),
      { params }
    );
    expect(res.status).toBe(409);
  });

  it("creates tag and adds to video successfully", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-1" },
    });
    mockDb.videoTag.count.mockResolvedValueOnce(2);
    mockDb.tag.upsert.mockResolvedValueOnce({ id: "t1", name: "javascript" });
    mockDb.videoTag.findUnique.mockResolvedValueOnce(null);
    mockDb.videoTag.create.mockResolvedValueOnce({
      videoId,
      tagId: "t1",
      tag: { id: "t1", name: "javascript" },
    });

    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "JavaScript" }),
      { params }
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.tag.name).toBe("javascript");
  });

  it("validates tag name", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-1" },
    });

    const res = await addTag(
      makePostRequest(`/api/videos/${videoId}/tags`, { name: "" }),
      { params }
    );
    expect(res.status).toBe(400);
  });
});

// === DELETE /api/videos/:videoId/tags/:tagId ===
describe("DELETE /api/videos/:videoId/tags/:tagId", () => {
  const videoId = "video-123";
  const tagId = "tag-456";
  const params = Promise.resolve({ videoId, tagId });

  it("returns 401 when not authenticated", async () => {
    const res = await removeTag(
      makeDeleteRequest(`/api/videos/${videoId}/tags/${tagId}`),
      { params }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when video not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const res = await removeTag(
      makeDeleteRequest(`/api/videos/${videoId}/tags/${tagId}`),
      { params }
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the owner", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-2" },
    });

    const res = await removeTag(
      makeDeleteRequest(`/api/videos/${videoId}/tags/${tagId}`),
      { params }
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when tag not on video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-1" },
    });
    mockDb.videoTag.findUnique.mockResolvedValueOnce(null);

    const res = await removeTag(
      makeDeleteRequest(`/api/videos/${videoId}/tags/${tagId}`),
      { params }
    );
    expect(res.status).toBe(404);
  });

  it("removes tag from video successfully", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: videoId,
      channel: { userId: "user-1" },
    });
    mockDb.videoTag.findUnique.mockResolvedValueOnce({
      videoId,
      tagId,
    });
    mockDb.videoTag.delete.mockResolvedValueOnce({});

    const res = await removeTag(
      makeDeleteRequest(`/api/videos/${videoId}/tags/${tagId}`),
      { params }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});

// === GET /api/tags/:tagName/videos ===
describe("GET /api/tags/:tagName/videos", () => {
  it("returns 404 when tag not found", async () => {
    mockDb.tag.findFirst.mockResolvedValueOnce(null);

    const res = await listTagVideos(
      makeGetRequest("/api/tags/unknown/videos"),
      { params: Promise.resolve({ tagName: "unknown" }) }
    );
    expect(res.status).toBe(404);
  });

  it("returns videos for a tag", async () => {
    mockDb.tag.findFirst.mockResolvedValueOnce({ id: "t1", name: "react" });
    mockDb.videoTag.findMany.mockResolvedValueOnce([
      {
        videoId: "v1",
        tagId: "t1",
        video: {
          id: "v1",
          title: "React Tutorial",
          channel: { id: "ch1", name: "Dev Channel", handle: "dev", avatarUrl: null },
        },
      },
    ]);

    const res = await listTagVideos(
      makeGetRequest("/api/tags/react/videos"),
      { params: Promise.resolve({ tagName: "react" }) }
    );
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toBe("React Tutorial");
    expect(data.nextCursor).toBeNull();
    expect(data.hasMore).toBe(false);
  });
});
