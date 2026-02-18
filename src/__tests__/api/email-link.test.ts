import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/email-link/route";
import { db } from "@/lib/db";
import { sendLoginLinkEmail } from "@/lib/email";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;
const mockSendLoginLinkEmail = sendLoginLinkEmail as unknown as ReturnType<
  typeof vi.fn
>;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/email-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/email-link", () => {
  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ email: "bad-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 and sends a link for valid email", async () => {
    mockDb.loginToken.deleteMany.mockResolvedValueOnce({ count: 0 } as never);
    mockDb.loginToken.create.mockResolvedValueOnce({} as never);

    const res = await POST(makeRequest({ email: "USER@Example.com" }));
    expect(res.status).toBe(200);

    expect(mockDb.loginToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "user@example.com",
        }),
      })
    );

    expect(mockSendLoginLinkEmail).toHaveBeenCalledTimes(1);
    expect(mockSendLoginLinkEmail.mock.calls[0][0]).toBe("user@example.com");
    expect(typeof mockSendLoginLinkEmail.mock.calls[0][1]).toBe("string");
  });
});
