import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface SyncRateLimiter {
  check(identifier: string): RateLimitResult;
}

export interface RateLimiter {
  check(identifier: string): RateLimitResult | Promise<RateLimitResult>;
}

// ---------------------------------------------------------------------------
// In-memory backend (development / tests / fallback)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name)!;
}

export function rateLimit(name: string, config: RateLimitConfig): SyncRateLimiter {
  const store = getStore(name);

  return {
    check(identifier: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || now > entry.resetTime) {
        store.set(identifier, {
          count: 1,
          resetTime: now + config.windowMs,
        });
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetIn: config.windowMs,
        };
      }

      if (entry.count >= config.maxRequests) {
        return {
          success: false,
          remaining: 0,
          resetIn: entry.resetTime - now,
        };
      }

      entry.count++;
      return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetIn: entry.resetTime - now,
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Redis backend (production — requires UPSTASH_REDIS_REST_URL)
// ---------------------------------------------------------------------------

function createRedisLimiter(
  prefix: string,
  config: RateLimitConfig
): RateLimiter | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  // Lazy-load to avoid import errors when packages aren't configured
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Ratelimit } = require("@upstash/ratelimit") as typeof import("@upstash/ratelimit");

  const redis = new Redis({ url, token });
  const windowSec = Math.ceil(config.windowMs / 1000);

  const limiter = new Ratelimit({
    redis,
    prefix: `rl:${prefix}`,
    limiter: Ratelimit.fixedWindow(config.maxRequests, `${windowSec} s`),
    analytics: false,
  });

  return {
    async check(identifier: string): Promise<RateLimitResult> {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        resetIn: Math.max(0, result.reset - Date.now()),
      };
    },
  };
}

// ---------------------------------------------------------------------------
// Limiter factory — Redis when available, in-memory fallback
// ---------------------------------------------------------------------------

function createLimiter(name: string, config: RateLimitConfig): RateLimiter {
  return createRedisLimiter(name, config) ?? rateLimit(name, config);
}

// ---------------------------------------------------------------------------
// Pre-configured limiters
// ---------------------------------------------------------------------------

export const authLimiter = createLimiter("auth", {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});
export const uploadLimiter = createLimiter("upload", {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
});
export const searchLimiter = createLimiter("search", {
  windowMs: 60 * 1000,
  maxRequests: 30,
});
export const apiLimiter = createLimiter("api", {
  windowMs: 60 * 1000,
  maxRequests: 60,
});
export const passwordResetLimiter = createLimiter("passwordReset", {
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
});
export const callbackLimiter = createLimiter("callback", {
  windowMs: 60 * 1000,
  maxRequests: 100,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

export function rateLimitResponse(resetIn: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) },
    }
  );
}

// ---------------------------------------------------------------------------
// Memory cleanup for in-memory stores (no-op when using Redis)
// ---------------------------------------------------------------------------
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const store of stores.values()) {
        for (const [key, entry] of store) {
          if (now > entry.resetTime) store.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}
