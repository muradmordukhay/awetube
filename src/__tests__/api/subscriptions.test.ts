import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST, GET } from "@/app/api/subscriptions/[channelId]/route";
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

describe("POST /api/subscriptions/[channelId]", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await POST(req, makeParams("ch-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent channel", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await POST(req, makeParams("ch-1"));
    expect(res.status).toBe(404);
  });

  it("returns 400 for self-subscription", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findUnique.mockResolvedValueOnce({
      userId: "user-1",
    } as never);

    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await POST(req, makeParams("ch-1"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("own channel");
  });

  it("subscribes to a channel (toggle on)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findUnique.mockResolvedValueOnce({
      userId: "user-2",
    } as never);
    mockDb.subscription.findUnique.mockResolvedValueOnce(null);
    mockDb.subscription.create.mockResolvedValueOnce({} as never);
    mockDb.subscription.count.mockResolvedValueOnce(5);

    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await POST(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscribed).toBe(true);
    expect(data.subscriberCount).toBe(5);
  });

  it("unsubscribes from a channel (toggle off)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.channel.findUnique.mockResolvedValueOnce({
      userId: "user-2",
    } as never);
    mockDb.subscription.findUnique.mockResolvedValueOnce({
      id: "sub-1",
    } as never);
    mockDb.subscription.delete.mockResolvedValueOnce({} as never);
    mockDb.subscription.count.mockResolvedValueOnce(3);

    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await POST(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscribed).toBe(false);
    expect(data.subscriberCount).toBe(3);
  });
});

describe("GET /api/subscriptions/[channelId]", () => {
  it("returns subscribed: false when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await GET(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscribed).toBe(false);
  });

  it("returns subscribed: true when subscribed", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.subscription.findUnique.mockResolvedValueOnce({
      id: "sub-1",
    } as never);

    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await GET(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscribed).toBe(true);
  });

  it("returns subscribed: false when not subscribed", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.subscription.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest("http://localhost/api/subscriptions/ch-1");
    const res = await GET(req, makeParams("ch-1"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.subscribed).toBe(false);
  });
});
