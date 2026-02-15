import { describe, it, expect } from "vitest";
import {
  signCallbackUrl,
  verifyCallbackSignature,
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
});
