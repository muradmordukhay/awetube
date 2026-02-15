import { z } from "zod";

// === Auth ===
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

// === Upload ===
export const uploadInitiateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const startTranscodeSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  taskToken: z.string().min(1, "taskToken is required"),
  tusUri: z.string().url("tusUri must be a valid URL"),
});

export const callbackSchema = z.object({
  task_token: z.string().min(1, "task_token is required"),
  status: z.string().optional(),
  error: z.number().optional(),
  error_description: z.string().optional(),
  videos: z
    .array(
      z.object({
        url: z.string(),
        tag: z.string().optional(),
        duration: z.number().optional(),
        width: z.number().int().optional(),
        height: z.number().int().optional(),
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

// === Videos ===
export const videoUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional().nullable(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

// === Comments ===
export const commentCreateSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Comment content is required")
    .max(2000),
  parentId: z.string().optional().nullable(),
});

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1, "Comment content is required").max(2000),
});

export const commentPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// === Channels ===
export const channelUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

// === Notifications ===
export const notificationPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// === Playlists ===
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

// === Watch History ===
export const watchHistorySchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
  progressSeconds: z.number().int().min(0).max(86400).optional(),
});

// === Playlist Item Remove ===
export const playlistItemRemoveSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
});

// === Watch Later ===
export const watchLaterToggleSchema = z.object({
  videoId: z.string().min(1, "videoId is required"),
});

// === Password Reset ===
export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

// === Tags ===
export const tagSearchSchema = z.object({
  q: z.string().trim().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const tagAddSchema = z.object({
  name: z.string().trim().min(1, "Tag name is required").max(50).transform((v) => v.toLowerCase()),
});

export const tagVideosSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});

// === Playlist Reorder ===
export const playlistReorderSchema = z.object({
  itemIds: z.array(z.string().min(1)).min(1).max(500),
});

// === Search ===
export const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
});
