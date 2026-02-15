import type { Video, Channel, User, Comment, Tag } from "@prisma/client";

// Video with related data for display
export type VideoWithChannel = Video & {
  channel: Pick<Channel, "id" | "handle" | "name" | "avatarUrl">;
};

export type VideoWithDetails = Video & {
  channel: Pick<Channel, "id" | "handle" | "name" | "avatarUrl">;
  tags: { tag: Tag }[];
  _count: {
    comments: number;
    likes: number;
  };
};

export type CommentWithUser = Comment & {
  user: Pick<User, "id" | "name" | "image">;
  replies?: CommentWithUser[];
};

export type ChannelWithStats = Channel & {
  _count: {
    videos: number;
  };
};

// API request/response types
export type PaginatedResponse<T> = {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
};

export type VideoUploadInitResponse = {
  videoId: string;
  uploadUrl: string;
  taskToken: string;
};

export type TranscodeStartRequest = {
  videoId: string;
  taskToken: string;
  tusUri: string;
};

export type VideoStatusResponse = {
  status: string;
  percent?: number;
  error?: string;
};
