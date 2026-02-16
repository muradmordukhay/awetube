import { z } from "zod";

/**
 * Validates required environment variables at startup.
 * Fails fast with a clear error message listing all missing/invalid vars.
 *
 * Import this module early (e.g., in the root layout) so issues are caught
 * before the first request, not at runtime.
 */

const serverSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // NextAuth
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),

  // Security
  CALLBACK_SIGNING_SECRET: z
    .string()
    .min(1, "CALLBACK_SIGNING_SECRET is required"),

  // Qencode
  QENCODE_API_KEY: z.string().min(1, "QENCODE_API_KEY is required"),
  QENCODE_API_ENDPOINT: z.string().url().default("https://api.qencode.com"),
  QENCODE_S3_BUCKET: z.string().min(1, "QENCODE_S3_BUCKET is required"),
  QENCODE_S3_REGION: z.string().default("us-west"),
  NEXT_PUBLIC_QENCODE_PLAYER_LICENSE: z
    .string()
    .min(1, "NEXT_PUBLIC_QENCODE_PLAYER_LICENSE is required"),

  // Optional — Rate limiting (Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Optional
  RESEND_API_KEY: z.string().optional(),
  LOG_LEVEL: z.string().optional(),
  GIT_SHA: z.string().optional(),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().min(1, "NEXT_PUBLIC_APP_URL is required"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  console.error(
    `\n❌ Invalid environment variables:\n${missing}\n\nSee .env.example for required values.\n`
  );

  // Don't crash during build (Next.js runs module evaluation at build time)
  if (process.env.NODE_ENV !== "production" || !process.env.NEXT_PHASE) {
    // Only throw at runtime, not during next build
    if (typeof window === "undefined" && !process.env.NEXT_PHASE) {
      throw new Error("Invalid environment variables");
    }
  }
}

export const env = parsed.success ? parsed.data : (process.env as unknown as z.infer<typeof serverSchema>);
