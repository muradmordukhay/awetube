import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/search/route";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/search", () => {
  it("returns empty results for missing query", async () => {
    const req = new NextRequest("http://localhost/api/search");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
    expect(data.hasMore).toBe(false);
  });

  it("returns empty results for no matches", async () => {
    mockDb.video.findMany.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost/api/search?q=nonexistent");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
    expect(data.hasMore).toBe(false);
  });

  it("returns matching videos", async () => {
    const videos = [
      {
        id: "vid-1",
        title: "Test Video",
        status: "READY",
        channel: { id: "ch-1", name: "Channel", handle: "ch" },
      },
    ];
    mockDb.video.findMany.mockResolvedValueOnce(videos as never);

    const req = new NextRequest("http://localhost/api/search?q=test");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(1);
    expect(data.items[0].title).toBe("Test Video");
  });

  it("respects pagination limit", async () => {
    const videos = Array.from({ length: 6 }, (_, i) => ({
      id: `vid-${i}`,
      title: `Video ${i}`,
      channel: { id: "ch-1", name: "Ch" },
    }));
    mockDb.video.findMany.mockResolvedValueOnce(videos as never);

    const req = new NextRequest(
      "http://localhost/api/search?q=video&limit=5"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(5);
    expect(data.hasMore).toBe(true);
  });
});
