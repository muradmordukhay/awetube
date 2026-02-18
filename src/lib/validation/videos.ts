import { z } from "zod";

export const videoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export const tagSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const tagAddSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Tag name is required")
    .max(50)
    .transform((v) => v.toLowerCase()),
});

export const tagVideosSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

export const watchHistorySchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  progressSeconds: z.number().int().min(0).max(86400).optional(),
});

export const watchLaterToggleSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
});
