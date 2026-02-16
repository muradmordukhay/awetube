import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

describe("Security headers middleware", () => {
  function callMiddleware(path = "/") {
    const req = new NextRequest(`http://localhost${path}`);
    return middleware(req);
  }

  it("sets X-Frame-Options to DENY", () => {
    const res = callMiddleware();
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("sets X-Content-Type-Options to nosniff", () => {
    const res = callMiddleware();
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("sets Referrer-Policy", () => {
    const res = callMiddleware();
    expect(res.headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("sets Permissions-Policy", () => {
    const res = callMiddleware();
    expect(res.headers.get("Permissions-Policy")).toBe(
      "camera=(), microphone=(), geolocation=()"
    );
  });

  it("sets Strict-Transport-Security", () => {
    const res = callMiddleware();
    expect(res.headers.get("Strict-Transport-Security")).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
  });

  it("sets Content-Security-Policy with frame-ancestors none", () => {
    const res = callMiddleware();
    const csp = res.headers.get("Content-Security-Policy");
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.qencode.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("img-src 'self' data: https://*.qencode.com");
    expect(csp).toContain("media-src 'self' https://*.qencode.com blob:");
  });

  it("passes through the request (status 200)", () => {
    const res = callMiddleware("/api/videos");
    expect(res.status).toBe(200);
  });
});
