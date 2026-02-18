import { z } from "zod";

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(2000),
  parentId: z.string().optional().nullable(),
});

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(2000),
});

export const commentPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
