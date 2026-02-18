import { z } from "zod";

export const playlistCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).default("PUBLIC"),
});

export const playlistUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]).optional(),
});

export const playlistItemAddSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
});

export const playlistItemRemoveSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
});

export const playlistReorderSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1).max(500),
});

export const notificationPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
