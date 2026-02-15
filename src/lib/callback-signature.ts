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

export function signCallbackUrl(
  videoId: string,
  taskToken: string
): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(`${videoId}:${taskToken}`);
  return hmac.digest("hex");
}

export function verifyCallbackSignature(
  videoId: string,
  taskToken: string,
  signature: string
): boolean {
  const expected = signCallbackUrl(videoId, taskToken);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex")
    );
  } catch {
    // timingSafeEqual throws if buffers have different lengths
    return false;
  }
}
