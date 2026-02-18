/**
 * Next.js middleware — runs on every non-static request.
 *
 * Responsibilities:
 * 1. Profile-completion redirect: authenticated users with needsDisplayName=true
 *    are redirected to /complete-profile before accessing protected pages.
 * 2. Security headers: CSP, X-Frame-Options, etc. applied to all responses.
 *
 * Moving the profile-completion redirect here (vs. AppShell.tsx useEffect)
 * prevents render flashes and makes the redirect testable without React.
 *
 * CSP uses 'unsafe-inline'/'unsafe-eval' because Next.js injects inline
 * scripts during hydration. Nonce-based CSP is a future follow-up.
 * img-src/media-src allowlist Qencode CDN and AWS.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.qencode.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.qencode.com https://*.amazonaws.com",
  "media-src 'self' https://*.qencode.com blob:",
  "connect-src 'self' https://*.qencode.com",
  "frame-ancestors 'none'",
].join("; ");

const COMPLETE_PROFILE_ALLOWED = new Set([
  "/login",
  "/register",
  "/verify",
  "/complete-profile",
  "/forgot-password",
]);

/**
 * Applies security response headers. Exported for unit testing.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
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

/**
 * Core middleware logic. Exported for unit testing without NextAuth wrapping.
 */
export function middleware(
  req: NextRequest,
  session: Session | null = null
): NextResponse {
  const { pathname } = req.nextUrl;

  if (
    session?.user?.needsDisplayName &&
    !COMPLETE_PROFILE_ALLOWED.has(pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/complete-profile";
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export default auth(function (req: NextRequest & { auth: Session | null }) {
  return middleware(req, req.auth);
});

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
