import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.CALLBACK_SIGNING_SECRET;
  if (!secret) {
    throw new Error(
      "CALLBACK_SIGNING_SECRET environment variable is not set. " +
        "Generate one with: openssl rand -base64 32"
    );
  }
  return secret;
}

// ---------------------------------------------------------------------------
// Timestamp-aware functions (replay protection)
// ---------------------------------------------------------------------------

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Sign a callback URL with a timestamp for replay protection.
 * The HMAC payload is `videoId:taskToken:timestamp`.
 */
export function signCallbackUrlWithTimestamp(
  videoId: string,
  taskToken: string,
  timestamp: number
): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(`${videoId}:${taskToken}:${timestamp}`);
  return hmac.digest("hex");
}

/**
 * Verify a callback signature with timestamp freshness check.
 * Returns false if the timestamp is expired or the HMAC is invalid.
 *
 * @param timestamp - Unix epoch in seconds
 * @param maxAgeMs - Maximum allowed age in milliseconds (default: 5 minutes)
 */
export function verifyCallbackWithTimestamp(
  videoId: string,
  taskToken: string,
  signature: string,
  timestamp: number,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS
): boolean {
  // Check timestamp freshness
  const ageMs = Date.now() - timestamp * 1000;
  if (ageMs < 0 || ageMs > maxAgeMs) {
    return false;
  }

  const expected = signCallbackUrlWithTimestamp(videoId, taskToken, timestamp);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    return false;
  }
}
