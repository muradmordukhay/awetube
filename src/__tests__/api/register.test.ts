import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/auth/register/route";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/register", () => {
  it("returns 400 for missing fields", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Validation failed");
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(
      makeRequest({ name: "John", email: "bad", password: "password123" })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for short password", async () => {
    const res = await POST(
      makeRequest({
        name: "John",
        email: "john@test.com",
        password: "short",
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 409 for duplicate email", async () => {
    mockDb.user.findUnique.mockResolvedValueOnce({
      id: "existing",
      email: "john@test.com",
    } as never);

    const res = await POST(
      makeRequest({
        name: "John",
        email: "john@test.com",
        password: "password123",
      })
    );
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already exists");
  });

  it("returns 201 for successful registration", async () => {
    mockDb.user.findUnique.mockResolvedValueOnce(null);
    mockDb.channel.findUnique.mockResolvedValueOnce(null);
    mockDb.user.create.mockResolvedValueOnce({
      id: "new-user-id",
      email: "john@test.com",
      name: "John",
    } as never);

    const res = await POST(
      makeRequest({
        name: "John",
        email: "john@test.com",
        password: "password123",
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBe("new-user-id");
    expect(data.email).toBe("john@test.com");
  });
});
