import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/videos/[videoId]/like/route";
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

describe("POST /api/videos/[videoId]/like", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/videos/vid-1/like");
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/videos/vid-1/like");
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Video not found");
  });

  it("likes a video (toggle on)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({ id: "vid-1" } as never);
    mockDb.like.findUnique.mockResolvedValueOnce(null);
    mockDb.like.create.mockResolvedValueOnce({} as never);
    mockDb.video.update.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1/like");
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(true);
  });

  it("unlikes a video (toggle off)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({ id: "vid-1" } as never);
    mockDb.like.findUnique.mockResolvedValueOnce({
      id: "like-1",
      videoId: "vid-1",
      userId: "user-1",
    } as never);
    mockDb.like.delete.mockResolvedValueOnce({} as never);
    mockDb.video.update.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1/like");
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.liked).toBe(false);
  });

  it("decrements likeCount on unlike", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({ id: "vid-1" } as never);
    mockDb.like.findUnique.mockResolvedValueOnce({ id: "like-1" } as never);
    mockDb.like.delete.mockResolvedValueOnce({} as never);
    mockDb.video.update.mockResolvedValueOnce({} as never);

    const req = new NextRequest("http://localhost/api/videos/vid-1/like");
    await POST(req, makeParams("vid-1"));
    expect(mockDb.video.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { likeCount: { decrement: 1 } },
      })
    );
  });
});
