import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/videos/route";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/videos", () => {
  it("returns paginated videos", async () => {
    const mockVideos = [
      { id: "v1", title: "Video 1", channel: { name: "Ch1" } },
      { id: "v2", title: "Video 2", channel: { name: "Ch2" } },
    ];
    mockDb.video.findMany.mockResolvedValueOnce(mockVideos as never);

    const req = new NextRequest("http://localhost/api/videos?limit=10");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(2);
    expect(data.hasMore).toBe(false);
  });

  it("detects hasMore when results exceed limit", async () => {
    const mockVideos = Array.from({ length: 3 }, (_, i) => ({
      id: `v${i}`,
      title: `Video ${i}`,
    }));
    mockDb.video.findMany.mockResolvedValueOnce(mockVideos as never);

    const req = new NextRequest("http://localhost/api/videos?limit=2");
    const res = await GET(req);
    const data = await res.json();

    expect(data.items).toHaveLength(2);
    expect(data.hasMore).toBe(true);
    expect(data.nextCursor).toBe("v1");
  });

  it("applies default limit of 24", async () => {
    mockDb.video.findMany.mockResolvedValueOnce([] as never);

    const req = new NextRequest("http://localhost/api/videos");
    await GET(req);

    expect(mockDb.video.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 25 }) // limit + 1
    );
  });

  it("returns 400 for invalid limit", async () => {
    const req = new NextRequest("http://localhost/api/videos?limit=999");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
