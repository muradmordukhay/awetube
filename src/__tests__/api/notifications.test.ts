import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "@/app/api/notifications/route";
import { PATCH as PATCH_SINGLE } from "@/app/api/notifications/[notificationId]/route";
import { GET as GET_UNREAD } from "@/app/api/notifications/unread-count/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockAuth = auth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/notifications", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns empty list", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.notification.findMany.mockResolvedValueOnce([]);

    const req = new NextRequest("http://localhost/api/notifications");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toEqual([]);
    expect(data.hasMore).toBe(false);
  });

  it("returns paginated notifications", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const notifs = Array.from({ length: 21 }, (_, i) => ({
      id: `notif-${i}`,
      type: "NEW_VIDEO",
      read: false,
      createdAt: new Date().toISOString(),
      actor: { id: "u2", name: "Actor", image: null },
      video: null,
      comment: null,
    }));
    mockDb.notification.findMany.mockResolvedValueOnce(notifs as never);

    const req = new NextRequest(
      "http://localhost/api/notifications?limit=20"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.items).toHaveLength(20);
    expect(data.hasMore).toBe(true);
  });
});

describe("PATCH /api/notifications (mark all read)", () => {
  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
    });
    const res = await PATCH(req);
    expect(res.status).toBe(401);
  });

  it("marks all notifications as read", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.notification.updateMany.mockResolvedValueOnce({ count: 3 } as never);

    const req = new NextRequest("http://localhost/api/notifications", {
      method: "PATCH",
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    expect(mockDb.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", read: false },
        data: { read: true },
      })
    );
  });
});

describe("PATCH /api/notifications/[notificationId]", () => {
  const makeParams = (notificationId: string) => ({
    params: Promise.resolve({ notificationId }),
  });

  it("returns 401 when not authenticated", async () => {
    const req = new NextRequest(
      "http://localhost/api/notifications/notif-1",
      { method: "PATCH" }
    );
    const res = await PATCH_SINGLE(req, makeParams("notif-1"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for non-existent notification", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.notification.findUnique.mockResolvedValueOnce(null);

    const req = new NextRequest(
      "http://localhost/api/notifications/notif-1",
      { method: "PATCH" }
    );
    const res = await PATCH_SINGLE(req, makeParams("notif-1"));
    expect(res.status).toBe(404);
  });

  it("returns 403 for notification owned by another user", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.notification.findUnique.mockResolvedValueOnce({
      id: "notif-1",
      userId: "user-2",
    } as never);

    const req = new NextRequest(
      "http://localhost/api/notifications/notif-1",
      { method: "PATCH" }
    );
    const res = await PATCH_SINGLE(req, makeParams("notif-1"));
    expect(res.status).toBe(403);
  });

  it("marks single notification as read", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.notification.findUnique.mockResolvedValueOnce({
      id: "notif-1",
      userId: "user-1",
    } as never);
    mockDb.notification.update.mockResolvedValueOnce({
      id: "notif-1",
      read: true,
    } as never);

    const req = new NextRequest(
      "http://localhost/api/notifications/notif-1",
      { method: "PATCH" }
    );
    const res = await PATCH_SINGLE(req, makeParams("notif-1"));
    expect(res.status).toBe(200);
  });
});

describe("GET /api/notifications/unread-count", () => {
  it("returns 0 when not authenticated", async () => {
    const req = new NextRequest(
      "http://localhost/api/notifications/unread-count"
    );
    const res = await GET_UNREAD(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(0);
  });

  it("returns unread count when authenticated", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.notification.count.mockResolvedValueOnce(7);

    const req = new NextRequest(
      "http://localhost/api/notifications/unread-count"
    );
    const res = await GET_UNREAD(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(7);
  });
});
