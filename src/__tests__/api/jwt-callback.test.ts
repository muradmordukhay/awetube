import { describe, it, expect, vi, beforeEach } from "vitest";
import type { JWT } from "next-auth/jwt";
import { jwtCallback } from "@/lib/auth-callbacks";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("jwtCallback", () => {
  it("populates token from user on initial sign-in", async () => {
    const token = {} as JWT;
    const user = {
      id: "user-1",
      channelId: "ch-1",
      channelHandle: "jane",
      needsDisplayName: true,
    };

    const result = await jwtCallback({ token, user });

    expect(result.id).toBe("user-1");
    expect(result.channelId).toBe("ch-1");
    expect(result.channelHandle).toBe("jane");
    expect(result.needsDisplayName).toBe(true);
  });

  it("returns token unchanged when no user and no trigger", async () => {
    const token = {
      id: "user-1",
      channelId: "ch-1",
      channelHandle: "jane",
      needsDisplayName: true,
    };

    const result = await jwtCallback({ token });

    expect(result).toEqual(token);
    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
  });

  it("re-fetches user from DB on trigger=update and updates needsDisplayName", async () => {
    const token = {
      id: "user-1",
      channelId: "ch-1",
      channelHandle: "jane",
      needsDisplayName: true,
    };

    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      needsDisplayName: false,
      channel: { id: "ch-1", handle: "janedoe" },
    });

    const result = await jwtCallback({ token, trigger: "update" });

    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      include: { channel: true },
    });
    expect(result.needsDisplayName).toBe(false);
    expect(result.channelHandle).toBe("janedoe");
  });

  it("updates channelId from DB on trigger=update", async () => {
    const token = {
      id: "user-1",
      channelId: null,
      channelHandle: null,
      needsDisplayName: true,
    };

    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      needsDisplayName: false,
      channel: { id: "ch-new", handle: "newhandle" },
    });

    const result = await jwtCallback({ token, trigger: "update" });

    expect(result.channelId).toBe("ch-new");
    expect(result.channelHandle).toBe("newhandle");
    expect(result.needsDisplayName).toBe(false);
  });

  it("leaves token unchanged if DB user not found on trigger=update", async () => {
    const token = {
      id: "user-gone",
      channelId: "ch-1",
      channelHandle: "jane",
      needsDisplayName: true,
    };

    mockDb.user.findUnique.mockResolvedValueOnce(null);

    const result = await jwtCallback({ token, trigger: "update" });

    expect(result.needsDisplayName).toBe(true);
    expect(result.channelId).toBe("ch-1");
  });

  it("does not query DB on trigger=update without token.id", async () => {
    const token = { needsDisplayName: true } as JWT;

    const result = await jwtCallback({ token, trigger: "update" });

    expect(mockDb.user.findUnique).not.toHaveBeenCalled();
    expect(result.needsDisplayName).toBe(true);
  });
});
