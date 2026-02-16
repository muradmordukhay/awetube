/**
 * Security headers middleware.
 *
 * Applied to every non-static request. Defends against XSS, clickjacking,
 * MIME sniffing, and protocol downgrade attacks.
 *
 * CSP uses 'unsafe-inline'/'unsafe-eval' because Next.js injects inline
 * scripts during hydration. Nonce-based CSP is a future follow-up.
 * img-src/media-src allowlist Qencode CDN and AWS.
 */
import { NextRequest, NextResponse } from "next/server";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.qencode.com https://*.amazonaws.com",
  "media-src 'self' https://*.qencode.com blob:",
  "connect-src 'self' https://*.qencode.com",
  "frame-ancestors 'none'",
].join("; ");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function middleware(_req: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Content-Security-Policy", CSP);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
