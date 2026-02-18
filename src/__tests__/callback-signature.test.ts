import { describe, it, expect } from "vitest";
import {
  signCallbackUrlWithTimestamp,
  verifyCallbackWithTimestamp,
} from "@/lib/callback-signature";

describe("callback-signature", () => {
  const videoId = "test-video-123";
  const taskToken = "test-task-token-456";

  describe("signCallbackUrlWithTimestamp", () => {
    const ts = Math.floor(Date.now() / 1000);

    it("returns a hex string", () => {
      const sig = signCallbackUrlWithTimestamp(videoId, taskToken, ts);
      expect(sig).toMatch(/^[0-9a-f]{64}$/);
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
