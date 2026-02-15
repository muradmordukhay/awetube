import { describe, it, expect } from "vitest";
import {
  signCallbackUrl,
  verifyCallbackSignature,
  signCallbackUrlWithTimestamp,
  verifyCallbackWithTimestamp,
} from "@/lib/callback-signature";

describe("callback-signature", () => {
  const videoId = "test-video-123";
  const taskToken = "test-task-token-456";

  describe("signCallbackUrl", () => {
    it("returns a hex string", () => {
      const sig = signCallbackUrl(videoId, taskToken);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns same signature for same inputs", () => {
      const sig1 = signCallbackUrl(videoId, taskToken);
      const sig2 = signCallbackUrl(videoId, taskToken);
      expect(sig1).toBe(sig2);
    });

    it("returns different signatures for different inputs", () => {
      const sig1 = signCallbackUrl(videoId, taskToken);
      const sig2 = signCallbackUrl(videoId, "different-token");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyCallbackSignature", () => {
    it("verifies a valid signature", () => {
      const sig = signCallbackUrl(videoId, taskToken);
      expect(verifyCallbackSignature(videoId, taskToken, sig)).toBe(true);
    });

    it("rejects an invalid signature", () => {
      expect(
        verifyCallbackSignature(videoId, taskToken, "0".repeat(64))
      ).toBe(false);
    });

    it("rejects a signature with wrong length", () => {
      expect(verifyCallbackSignature(videoId, taskToken, "bad")).toBe(false);
    });

    it("rejects when videoId doesn't match", () => {
      const sig = signCallbackUrl(videoId, taskToken);
      expect(verifyCallbackSignature("wrong-id", taskToken, sig)).toBe(false);
    });

    it("rejects when taskToken doesn't match", () => {
      const sig = signCallbackUrl(videoId, taskToken);
      expect(verifyCallbackSignature(videoId, "wrong-token", sig)).toBe(
        false
      );
    });
  });

  describe("signCallbackUrlWithTimestamp", () => {
    const ts = Math.floor(Date.now() / 1000);

    it("returns a hex string", () => {
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
    });

    it("returns different signature than legacy function", () => {
      const legacy = signCallbackUrl(videoId, taskToken);
      const withTs = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      expect(legacy).not.toBe(withTs);
    });

    it("returns different signatures for different timestamps", () => {
      const sig1 = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      const sig2 = signCallbackUrlWithTimestamp(videoId, taskToken, ts + 1);
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyCallbackWithTimestamp", () => {
    it("verifies a valid recent signature", () => {
      const ts = Math.floor(Date.now() / 1000);
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      expect(verifyCallbackWithTimestamp(videoId, taskToken, sig, ts)).toBe(
        true
      );
    });

    it("rejects an expired timestamp (older than 5 minutes)", () => {
      const ts = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      expect(verifyCallbackWithTimestamp(videoId, taskToken, sig, ts)).toBe(
        false
      );
    });

    it("rejects a future timestamp", () => {
      const ts = Math.floor(Date.now() / 1000) + 600; // 10 minutes in future
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      expect(verifyCallbackWithTimestamp(videoId, taskToken, sig, ts)).toBe(
        false
      );
    });

    it("rejects a tampered timestamp", () => {
      const ts = Math.floor(Date.now() / 1000);
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      // Verify with a different timestamp than what was signed
      expect(
        verifyCallbackWithTimestamp(videoId, taskToken, sig, ts + 1)
      ).toBe(false);
    });

    it("accepts custom maxAge", () => {
      const ts = Math.floor(Date.now() / 1000) - 120; // 2 minutes ago
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      // Should fail with 60s max age
      expect(
        verifyCallbackWithTimestamp(videoId, taskToken, sig, ts, 60_000)
      ).toBe(false);
      // Should pass with 180s max age
      expect(
        verifyCallbackWithTimestamp(videoId, taskToken, sig, ts, 180_000)
      ).toBe(true);
    });
  });
});
