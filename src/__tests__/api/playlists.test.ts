import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/playlists/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/playlists", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/playlists");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns empty list when no playlists", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.findMany.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost/api/playlists");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns user playlists with item count", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const playlists = [
      {
        id: "pl-1",
        title: "Favorites",
        _count: { items: 3 },
        items: [],
      },
    ];
    mockDb.playlist.findMany.mockResolvedValueOnce(playlists as never);

    const req = new NextRequest("http://localhost/api/playlists");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Favorites");
    expect(data[0]._count.items).toBe(3);
  });
});

describe("POST /api/playlists", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Playlist" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for missing title", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });

    const req = new NextRequest("http://localhost/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates a playlist", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.create.mockResolvedValueOnce({
      id: "pl-1",
      title: "My Playlist",
      visibility: "PUBLIC",
      userId: "user-1",
    } as never);

    const req = new NextRequest("http://localhost/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Playlist" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.title).toBe("My Playlist");
  });

  it("creates a playlist with description and visibility", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.create.mockResolvedValueOnce({
      id: "pl-1",
      title: "Private List",
      description: "My private videos",
      visibility: "PRIVATE",
      userId: "user-1",
    } as never);

    const req = new NextRequest("http://localhost/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Private List",
        description: "My private videos",
        visibility: "PRIVATE",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.visibility).toBe("PRIVATE");
  });
});
