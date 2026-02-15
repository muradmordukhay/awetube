import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, DELETE } from "@/app/api/history/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/history", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await POST(makeRequest({ videoId: "vid-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing videoId", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ videoId: "vid-999" }));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Video not found");
  });

  it("upserts watch history with progress", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({ id: "vid-1" } as never);
    mockDb.watchHistory.upsert.mockResolvedValueOnce({} as never);

    const res = await POST(
      makeRequest({ videoId: "vid-1", progressSeconds: 120 })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDb.watchHistory.upsert).toHaveBeenCalled();
  });

  it("upserts watch history without progress", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.video.findUnique.mockResolvedValueOnce({ id: "vid-1" } as never);
    mockDb.watchHistory.upsert.mockResolvedValueOnce({} as never);

    const res = await POST(makeRequest({ videoId: "vid-1" }));
    expect(res.status).toBe(200);
    expect(mockDb.watchHistory.upsert).toHaveBeenCalled();
  });
});

describe("DELETE /api/history", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/history", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it("deletes all watch history for user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.watchHistory.deleteMany.mockResolvedValueOnce({ count: 5 } as never);

    const req = new NextRequest("http://localhost/api/history", {
      method: "DELETE",
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDb.watchHistory.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });
});
