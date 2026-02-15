import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PUT } from "@/app/api/channels/[channelId]/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

const makeParams = (channelId: string) => ({
  params: Promise.resolve({ channelId }),
});

describe("GET /api/channels/[channelId]", () => {
  it("returns 404 for non-existent channel", async () => {
    mockDb.channel.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/channels/ch-1");
    const res = await GET(req, makeParams("ch-1"));
    expect(res.status).toBe(404);
  });

  it("returns channel by ID", async () => {
    const channel = {
      id: "ch-1",
      name: "My Channel",
      handle: "mychannel",
      _count: { videos: 5 },
    };
    mockDb.channel.findFirst.mockResolvedValueOnce(channel as never);

    const req = new NextRequest("http://localhost/api/channels/ch-1");
    const res = await GET(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("My Channel");
    expect(data._count.videos).toBe(5);
  });

  it("returns channel by handle", async () => {
    const channel = {
      id: "ch-1",
      name: "My Channel",
      handle: "mychannel",
      _count: { videos: 3 },
    };
    mockDb.channel.findFirst.mockResolvedValueOnce(channel as never);

    const req = new NextRequest("http://localhost/api/channels/mychannel");
    const res = await GET(req, makeParams("mychannel"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.handle).toBe("mychannel");
  });
});

describe("PUT /api/channels/[channelId]", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/channels/ch-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PUT(req, makeParams("ch-1"));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user does not own channel", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findFirst.mockResolvedValueOnce({
      id: "ch-1",
      userId: "user-2",
    } as never);

    const req = new NextRequest("http://localhost/api/channels/ch-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PUT(req, makeParams("ch-1"));
    expect(res.status).toBe(403);
  });

  it("returns 403 for non-existent channel", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findFirst.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/channels/ch-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PUT(req, makeParams("ch-1"));
    expect(res.status).toBe(403);
  });

  it("updates channel name", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findFirst.mockResolvedValueOnce({
      id: "ch-1",
      userId: "user-1",
    } as never);
    mockDb.channel.update.mockResolvedValueOnce({
      id: "ch-1",
      name: "Updated Channel",
    } as never);

    const req = new NextRequest("http://localhost/api/channels/ch-1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Channel" }),
    });
    const res = await PUT(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Updated Channel");
  });
});
