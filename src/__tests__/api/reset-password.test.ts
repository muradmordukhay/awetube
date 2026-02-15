import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/reset-password/route";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  it("returns 400 for missing fields", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await POST(makeRequest({ token: "abc123", password: "short" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid/expired token", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValueOnce(null);

    const res = await POST(
      makeRequest({ token: "invalid-token", password: "newpassword123" })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid or expired");
  });

  it("returns 400 for expired token", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValueOnce({
      userId: "user-1",
      expiresAt: new Date(Date.now() - 60000), // expired 1 minute ago
      user: { id: "user-1" },
    } as never);

    const res = await POST(
      makeRequest({ token: "expired-token", password: "newpassword123" })
    );
    expect(res.status).toBe(400);
  });

  it("resets password and cleans up tokens on success", async () => {
    mockDb.passwordResetToken.findUnique.mockResolvedValueOnce({
      userId: "user-1",
      expiresAt: new Date(Date.now() + 3600000), // valid for 1 hour
      user: { id: "user-1" },
    } as never);
    mockDb.user.update.mockResolvedValueOnce({} as never);
    mockDb.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 1 } as never);

    const res = await POST(
      makeRequest({ token: "valid-token", password: "newpassword123" })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("Password reset successfully");
    expect(mockDb.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "user-1" } })
    );
    expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });
});
