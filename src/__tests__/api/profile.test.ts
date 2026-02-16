import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH } from "@/app/api/auth/profile/route";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/auth/profile", () => {
  it("returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const res = await PATCH(makeRequest({ displayName: "Jane" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid display name", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const res = await PATCH(makeRequest({ displayName: "" }));
    expect(res.status).toBe(400);
  });

  it("updates user and channel on success", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockDb.user.update.mockResolvedValueOnce({} as never);

    const res = await PATCH(makeRequest({ displayName: "Jane Doe" }));
    expect(res.status).toBe(200);
    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          name: "Jane Doe",
          needsDisplayName: false,
        }),
      })
    );
  });
});
