import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/forgot-password/route";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 even if user does not exist (email enumeration protection)", async () => {
    mockDb.user.findUnique.mockResolvedValueOnce(null);

    const res = await POST(makeRequest({ email: "nouser@test.com" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toContain("If an account");
  });

  it("creates reset token and returns 200 for existing user", async () => {
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "test@test.com",
    } as never);
    mockDb.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 0 } as never);
    mockDb.passwordResetToken.create.mockResolvedValueOnce({} as never);

    const res = await POST(makeRequest({ email: "test@test.com" }));
    expect(res.status).toBe(200);
    expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
    expect(mockDb.passwordResetToken.create).toHaveBeenCalled();
  });

  it("deletes existing tokens before creating new one", async () => {
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "user-1",
      email: "test@test.com",
    } as never);
    mockDb.passwordResetToken.deleteMany.mockResolvedValueOnce({ count: 1 } as never);
    mockDb.passwordResetToken.create.mockResolvedValueOnce({} as never);

    await POST(makeRequest({ email: "test@test.com" }));
    expect(mockDb.passwordResetToken.deleteMany).toHaveBeenCalledBefore(
      mockDb.passwordResetToken.create
    );
  });
});
