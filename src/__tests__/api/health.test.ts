import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/health/route";
import { db } from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as any;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/health", () => {
  it("returns ok when database is connected", async () => {
    mockDb.$queryRaw.mockResolvedValueOnce([{ "?column?": 1 }] as never);

    const req = new Request("http://localhost/api/health");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.db).toBe("connected");
    expect(data.timestamp).toBeDefined();
  });

  it("returns 503 when database is disconnected", async () => {
    mockDb.$queryRaw.mockRejectedValueOnce(new Error("Connection refused"));

    const req = new Request("http://localhost/api/health");
    const res = await GET(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.status).toBe("error");
    expect(data.db).toBe("disconnected");
  });
});
