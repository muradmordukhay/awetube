import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/version/route";

describe("GET /api/version", () => {
  it("returns the current git sha", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.sha).toBe("test-sha");
  });
});
