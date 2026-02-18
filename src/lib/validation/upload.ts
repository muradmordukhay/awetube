import { z } from "zod";

export const uploadInitiateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const startTranscodeSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  taskToken: z.string().min(1, "taskToken is required"),
  /** Must be a "tus:<uuid>" URI as returned by the TUS upload Location header. */
  tusUri: z
    .string()
    .min(1, "tusUri is required")
    .refine(
      (val) => val.startsWith("tus:") || z.string().url().safeParse(val).success,
      { message: "tusUri must be a tus: URI or valid URL" }
    ),
});

export const callbackSchema = z.object({
  task_token: z.string().min(1, "task_token is required"),
  status: z.string().optional(),
  /** Qencode error code: 0 = success, non-zero = failure. */
  error: z.number().optional(),
  error_description: z.string().optional(),
  videos: z
    .array(
      z.object({
        url: z.string(),
        tag: z.string().optional(),
        duration: z.number().min(0).optional(),
        width: z.number().int().min(0).optional(),
        height: z.number().int().min(0).optional(),
      })
    )
    .optional(),
  images: z
    .array(
      z.object({
        url: z.string(),
        tag: z.string().optional(),
      })
    )
    .optional(),
});
