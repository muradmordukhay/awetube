import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PATCH } from "@/app/api/playlists/[playlistId]/items/reorder/route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockAuth = auth as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(playlistId: string, body: unknown) {
  return new NextRequest(
    new URL(
      `/api/playlists/${playlistId}/items/reorder`,
      "http://localhost"
    ),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}

const playlistId = "playlist-1";
const params = Promise.resolve({ playlistId });

describe("PATCH /api/playlists/:playlistId/items/reorder", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await PATCH(
      makeRequest(playlistId, { itemIds: ["a", "b"] }),
      { params }
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 when playlist not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.findUnique.mockResolvedValueOnce(null);

    const res = await PATCH(
      makeRequest(playlistId, { itemIds: ["a", "b"] }),
      { params }
    );
    expect(res.status).toBe(404);
  });

  it("returns 403 when not the playlist owner", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.findUnique.mockResolvedValueOnce({ userId: "user-2" });

    const res = await PATCH(
      makeRequest(playlistId, { itemIds: ["a", "b"] }),
      { params }
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 when itemIds is empty", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.findUnique.mockResolvedValueOnce({ userId: "user-1" });

    const res = await PATCH(
      makeRequest(playlistId, { itemIds: [] }),
      { params }
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when itemIds don't match existing items", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.findUnique.mockResolvedValueOnce({ userId: "user-1" });
    mockDb.playlistItem.findMany.mockResolvedValueOnce([
      { id: "item-1" },
      { id: "item-2" },
    ]);

    const res = await PATCH(
      makeRequest(playlistId, { itemIds: ["item-1", "item-3"] }),
      { params }
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("do not match");
  });

  it("reorders items successfully", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.playlist.findUnique.mockResolvedValueOnce({ userId: "user-1" });
    mockDb.playlistItem.findMany.mockResolvedValueOnce([
      { id: "item-1" },
      { id: "item-2" },
      { id: "item-3" },
    ]);
    // $transaction receives an array of promises
    mockDb.$transaction.mockResolvedValueOnce([{}, {}, {}]);

    const res = await PATCH(
      makeRequest(playlistId, { itemIds: ["item-3", "item-1", "item-2"] }),
      { params }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });
});
