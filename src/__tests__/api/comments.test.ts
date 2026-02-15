import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/videos/[videoId]/comments/route";
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

describe("GET /api/videos/[videoId]/comments", () => {
  it("returns empty list when no comments", async () => {
    mockDb.comment.findMany.mockResolvedValueOnce([]);

    const req = new NextRequest(
      "http://localhost/api/videos/vid-1/comments?limit=10"
    );
    const res = await GET(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
    expect(data.hasMore).toBe(false);
  });

  it("returns comments with pagination", async () => {
    const comments = Array.from({ length: 11 }, (_, i) => ({
      id: `cmt-${i}`,
      content: `Comment ${i}`,
      user: { id: "u1", name: "User", image: null },
      replies: [],
      _count: { replies: 0 },
      createdAt: new Date().toISOString(),
    }));
    mockDb.comment.findMany.mockResolvedValueOnce(comments as never);

    const req = new NextRequest(
      "http://localhost/api/videos/vid-1/comments?limit=10"
    );
    const res = await GET(req, makeParams("vid-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(10);
    expect(data.hasMore).toBe(true);
    expect(data.nextCursor).toBe("cmt-9");
  });
});

describe("POST /api/videos/[videoId]/comments", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest(
      "http://localhost/api/videos/vid-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      }
    );
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(401);
  });

  it("returns 400 for empty content", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const req = new NextRequest(
      "http://localhost/api/videos/vid-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "" }),
      }
    );
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(400);
  });

  it("creates a top-level comment", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const comment = {
      id: "cmt-1",
      content: "Great video!",
      videoId: "vid-1",
      userId: "user-1",
      user: { id: "user-1", name: "User", image: null },
    };
    mockDb.comment.create.mockResolvedValueOnce(comment as never);

    const req = new NextRequest(
      "http://localhost/api/videos/vid-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Great video!" }),
      }
    );
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.content).toBe("Great video!");
  });

  it("returns 404 for invalid parentId", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.comment.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost/api/videos/vid-1/comments",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "Reply!",
          parentId: "nonexistent",
        }),
      }
    );
    const res = await POST(req, makeParams("vid-1"));
    expect(res.status).toBe(404);
  });
});
