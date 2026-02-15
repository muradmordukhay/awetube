import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT, DELETE } from "@/app/api/videos/[videoId]/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

const makeParams = (videoId: string) => ({
  params: Promise.resolve({ videoId }),
});

describe("GET /api/videos/[videoId]", () => {
  it("returns 404 for non-existent video", async () => {
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/videos/vid-1");
    const res = await GET(req, makeParams("vid-1"));
    expect(res.status).toBe(404);
  });

  it("returns video with channel info", async () => {
    const video = {
      id: "vid-1",
      title: "Test Video",
      channel: { id: "ch-1", name: "Channel", handle: "ch", avatarUrl: null },
      tags: [],
      _count: { comments: 5, likes: 10 },
    };
    mockDb.video.findUnique.mockResolvedValueOnce(video as never);
    mockDb.video.update.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1");
    const res = await GET(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Test Video");
    expect(data.channel.name).toBe("Channel");
  });

  it("increments view count (fire and forget)", async () => {
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: "vid-1",
      title: "Test",
      channel: {},
      tags: [],
      _count: { comments: 0, likes: 0 },
    } as never);
    mockDb.video.update.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1");
    await GET(req, makeParams("vid-1"));
    expect(mockDb.video.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "vid-1" },
        data: { viewCount: { increment: 1 } },
      })
    );
  });
});

describe("PUT /api/videos/[videoId]", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/videos/vid-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Title" }),
    });
    const res = await PUT(req, makeParams("vid-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/videos/vid-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Title" }),
    });
    const res = await PUT(req, makeParams("vid-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user does not own the video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: "vid-1",
      channel: { userId: "user-2" },
    } as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Title" }),
    });
    const res = await PUT(req, makeParams("vid-1"));
    expect(res.status).toBe(403);
  });

  it("updates video title successfully", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: "vid-1",
      channel: { userId: "user-1" },
    } as never);
    mockDb.video.update.mockResolvedValueOnce({
      id: "vid-1",
      title: "Updated Title",
    } as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Title" }),
    });
    const res = await PUT(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.title).toBe("Updated Title");
  });
});

describe("DELETE /api/videos/[videoId]", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/videos/vid-1");
    const res = await DELETE(req, makeParams("vid-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/videos/vid-1");
    const res = await DELETE(req, makeParams("vid-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 when user does not own the video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: "vid-1",
      channel: { userId: "user-2" },
    } as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1");
    const res = await DELETE(req, makeParams("vid-1"));
    expect(res.status).toBe(403);
  });

  it("deletes video and returns success", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({
      id: "vid-1",
      channel: { userId: "user-1" },
    } as never);
    mockDb.video.delete.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1");
    const res = await DELETE(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDb.video.delete).toHaveBeenCalledWith({
      where: { id: "vid-1" },
    });
  });
});
