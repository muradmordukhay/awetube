import { describe, it, expect } from "vitest";
import {
  registerSchema,
  uploadInitiateSchema,
  startTranscodeSchema,
  callbackSchema,
  paginationSchema,
  commentCreateSchema,
  commentPaginationSchema,
  channelUpdateSchema,
  searchSchema,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("accepts valid input", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("trims whitespace from name and email", () => {
    const result = registerSchema.safeParse({
      name: "  John  ",
      email: "  john@example.com  ",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John");
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password over 128 characters", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "a".repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("uploadInitiateSchema", () => {
  it("accepts valid input", () => {
    const result = uploadInitiateSchema.safeParse({
      title: "My Video",
      description: "A great video",
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing description", () => {
    const result = uploadInitiateSchema.safeParse({ title: "My Video" });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = uploadInitiateSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects title over 200 chars", () => {
    const result = uploadInitiateSchema.safeParse({
      title: "a".repeat(201),
    });
    expect(result.success).toBe(false);
  });
});

describe("startTranscodeSchema", () => {
  it("accepts valid input", () => {
    const result = startTranscodeSchema.safeParse({
      videoId: "abc123",
      taskToken: "token123",
      tusUri: "https://upload.example.com/file",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid tusUri", () => {
    const result = startTranscodeSchema.safeParse({
      videoId: "abc123",
      taskToken: "token123",
      tusUri: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = startTranscodeSchema.safeParse({ videoId: "abc" });
    expect(result.success).toBe(false);
  });
});

describe("callbackSchema", () => {
  it("accepts completed callback", () => {
    const result = callbackSchema.safeParse({
      task_token: "token123",
      status: "completed",
      videos: [{ url: "https://cdn.example.com/video.m3u8", tag: "advanced_hls" }],
      images: [{ url: "https://cdn.example.com/thumb.jpg" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts error callback", () => {
    const result = callbackSchema.safeParse({
      task_token: "token123",
      status: "error",
      error: 1,
      error_description: "Encoding failed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing task_token", () => {
    const result = callbackSchema.safeParse({ status: "completed" });
    expect(result.success).toBe(false);
  });
});

describe("paginationSchema", () => {
  it("applies defaults", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(24);
      expect(result.data.cursor).toBeUndefined();
    }
  });

  it("coerces string limit to number", () => {
    const result = paginationSchema.safeParse({ limit: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
    }
  });

  it("caps limit at 50", () => {
    const result = paginationSchema.safeParse({ limit: "100" });
    expect(result.success).toBe(false);
  });

  it("rejects limit below 1", () => {
    const result = paginationSchema.safeParse({ limit: "0" });
    expect(result.success).toBe(false);
  });
});

describe("commentCreateSchema", () => {
  it("accepts valid comment", () => {
    const result = commentCreateSchema.safeParse({ content: "Great video!" });
    expect(result.success).toBe(true);
  });

  it("trims content", () => {
    const result = commentCreateSchema.safeParse({ content: "  hello  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content).toBe("hello");
    }
  });

  it("rejects empty content", () => {
    const result = commentCreateSchema.safeParse({ content: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects content over 2000 chars", () => {
    const result = commentCreateSchema.safeParse({
      content: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional parentId", () => {
    const result = commentCreateSchema.safeParse({
      content: "Reply!",
      parentId: "parent123",
    });
    expect(result.success).toBe(true);
  });
});

describe("commentPaginationSchema", () => {
  it("defaults limit to 20", () => {
    const result = commentPaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
    }
  });
});

describe("channelUpdateSchema", () => {
  it("accepts partial update", () => {
    const result = channelUpdateSchema.safeParse({ name: "New Name" });
    expect(result.success).toBe(true);
  });

  it("rejects name over 100 chars", () => {
    const result = channelUpdateSchema.safeParse({
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty object", () => {
    const result = channelUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("searchSchema", () => {
  it("accepts query with defaults", () => {
    const result = searchSchema.safeParse({ q: "cats" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(24);
    }
  });

  it("accepts empty query", () => {
    const result = searchSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects query over 200 chars", () => {
    const result = searchSchema.safeParse({ q: "a".repeat(201) });
    expect(result.success).toBe(false);
  });
});
