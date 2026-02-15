import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(name: string): Map<string, RateLimitEntry> {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name)!;
}

export function rateLimit(name: string, config: RateLimitConfig) {
  const store = getStore(name);

  return {
    check(
      identifier: string
    ): { success: boolean; remaining: number; resetIn: number } {
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

// Pre-configured limiters
// NOTE: In-memory store resets on restart and doesn't work across serverless instances.
// For production, use Redis-backed rate limiting (e.g., @upstash/ratelimit).
export const authLimiter = rateLimit("auth", {
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
});
export const uploadLimiter = rateLimit("upload", {
  windowMs: 60 * 60 * 1000,
  maxRequests: 20,
});
export const searchLimiter = rateLimit("search", {
  windowMs: 60 * 1000,
  maxRequests: 30,
});
export const apiLimiter = rateLimit("api", {
  windowMs: 60 * 1000,
  maxRequests: 60,
});
export const passwordResetLimiter = rateLimit("passwordReset", {
  windowMs: 15 * 60 * 1000,
  maxRequests: 3,
});
export const callbackLimiter = rateLimit("callback", {
  windowMs: 60 * 1000,
  maxRequests: 100,
});

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

// Periodic cleanup of expired entries to prevent memory leaks
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
