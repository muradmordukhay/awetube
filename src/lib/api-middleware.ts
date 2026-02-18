/**
 * Composable API route middleware wrappers.
 *
 * These eliminate the repeated boilerplate in every route:
 *   - try/catch with structured logging
 *   - Auth session check
 *   - Rate limiting
 *   - Qencode-specific error mapping
 *
 * Usage:
 *   export const POST = withErrorHandling(
 *     withRateLimit(uploadLimiter,
 *       withAuth(async (req, { session }) => {
 *         // handler body
 *       })
 *     )
 *   );
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getClientIp, rateLimitResponse, RateLimiter } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import type { Session } from "next-auth";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RouteHandler = (
  req: NextRequest,
  ctx: RouteContext
) => Promise<NextResponse>;

export interface RouteContext {
  params?: Record<string, string>;
}

export interface AuthedRouteContext extends RouteContext {
  session: Session & { user: { id: string } };
}

export type AuthedRouteHandler = (
  req: NextRequest,
  ctx: AuthedRouteContext
) => Promise<NextResponse>;

// ---------------------------------------------------------------------------
// withErrorHandling
// ---------------------------------------------------------------------------

/**
 * Wraps a handler in a try/catch that logs errors and returns a structured
 * 500 response. Also maps known Qencode errors to 502/503.
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error({ err: error }, `Unhandled route error: ${msg}`);

      if (msg.includes("QENCODE_API_KEY") || msg.includes("is not set")) {
        return NextResponse.json(
          { error: "Video service is not configured" },
          { status: 503 }
        );
      }
      if (msg.includes("auth failed") || msg.includes("Unauthorized")) {
        return NextResponse.json(
          { error: "Video service authentication failed" },
          { status: 502 }
        );
      }

      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}

// ---------------------------------------------------------------------------
// withRateLimit
// ---------------------------------------------------------------------------

/**
 * Checks a rate limiter keyed by client IP before passing to the next handler.
 * Returns 429 if the limit is exceeded.
 */
export function withRateLimit(
  limiter: RateLimiter,
  handler: RouteHandler
): RouteHandler {
  return async (req, ctx) => {
    const ip = getClientIp(req);
    const rl = await limiter.check(ip);
    if (!rl.success) return rateLimitResponse(rl.resetIn);
    return handler(req, ctx);
  };
}

// ---------------------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------------------

/**
 * Validates the current session and injects it into the handler context.
 * Returns 401 if the user is not authenticated.
 */
export function withAuth(handler: AuthedRouteHandler): RouteHandler {
  return async (req, ctx) => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return handler(req, { ...ctx, session: session as AuthedRouteContext["session"] });
  };
}
