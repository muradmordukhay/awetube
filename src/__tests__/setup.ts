/**
 * Global test setup (runs before every test file via vitest.config.ts).
 *
 * Provides three global mocks:
 *   1. Prisma (db) — every model method is vi.fn(). Use `db as any` to access.
 *      $transaction handles both callback and array patterns.
 *   2. Auth — defaults to unauthenticated (null). Override per-test with:
 *      (auth as any).mockResolvedValueOnce({ user: { id: "..." } })
 *   3. Qencode client — mocks createTask, startEncode, getStatus.
 *
 * Environment variables are set to test values (never real credentials).
 */
import { vi } from "vitest";

// Mock environment variables
process.env.CALLBACK_SIGNING_SECRET = "test-callback-secret-for-testing";
process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
process.env.QENCODE_API_KEY = "test-qencode-key";
process.env.QENCODE_API_ENDPOINT = "https://api.qencode.com";
process.env.NEXT_PUBLIC_QENCODE_PLAYER_LICENSE = "test-player-license";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
process.env.GIT_SHA = "test-sha";

// Mock Prisma client
vi.mock("@/lib/db", () => {
  const db = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    channel: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    video: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    comment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    like: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    subscription: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    notification: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    watchHistory: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    playlist: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    playlistItem: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    tag: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    videoTag: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    loginToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    passwordResetToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([{ "?column?": 1 }]),
  };
  // $transaction handles both callback and array patterns
  (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    (fnOrArray: ((tx: typeof db) => Promise<unknown>) | Promise<unknown>[]) => {
      if (typeof fnOrArray === "function") return fnOrArray(db);
      return Promise.all(fnOrArray);
    }
  );
  return { db };
});

// Mock auth - default to unauthenticated, override in tests
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Mock Qencode client
vi.mock("@/lib/qencode/client", () => ({
  qencode: {
    createTask: vi.fn(),
    startEncode: vi.fn(),
    getStatus: vi.fn(),
  },
}));

// Mock email module
vi.mock("@/lib/email", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendLoginLinkEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock rate limiting — keep real rateLimit/getClientIp/rateLimitResponse
// but override pre-configured limiters to always allow in API route tests
vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  const alwaysAllow = {
    check: () => ({ success: true, remaining: 100, resetIn: 0 }),
  };
  return {
    ...actual,
    apiLimiter: alwaysAllow,
    uploadLimiter: alwaysAllow,
    callbackLimiter: alwaysAllow,
    passwordResetLimiter: alwaysAllow,
    emailLinkLimiter: alwaysAllow,
    searchLimiter: alwaysAllow,
    channelCreationLimiter: alwaysAllow,
  };
});
