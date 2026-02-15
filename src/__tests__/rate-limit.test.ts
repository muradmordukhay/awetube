import { describe, it, expect } from "vitest";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within limit", () => {
    const limiter = rateLimit("test-allow", {
      windowMs: 60000,
      maxRequests: 3,
    });

    const r1 = limiter.check("user1");
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("user1");
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("user1");
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over limit", () => {
    const limiter = rateLimit("test-block", {
      windowMs: 60000,
      maxRequests: 2,
    });

    limiter.check("user2");
    limiter.check("user2");

    const blocked = limiter.check("user2");
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetIn).toBeGreaterThan(0);
  });

  it("tracks different identifiers separately", () => {
    const limiter = rateLimit("test-separate", {
      windowMs: 60000,
      maxRequests: 1,
    });

    const r1 = limiter.check("userA");
    expect(r1.success).toBe(true);

    const r2 = limiter.check("userB");
    expect(r2.success).toBe(true);

    const r3 = limiter.check("userA");
    expect(r3.success).toBe(false);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" },
    });
    expect(getClientIp(req)).toBe("1.2.3.4");
  });

  it("extracts IP from x-real-ip", () => {
    const req = new Request("http://localhost", {
      headers: { "x-real-ip": "9.8.7.6" },
    });
    expect(getClientIp(req)).toBe("9.8.7.6");
  });

  it("falls back to 127.0.0.1", () => {
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("127.0.0.1");
  });
});
