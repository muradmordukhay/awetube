export type VideoStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface VideoSummary {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number | null;
  viewCount: number;
  createdAt: string;
  channel: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
  };
}

export interface VideoDetail extends VideoSummary {
  description: string | null;
  status: VideoStatus;
  hlsUrl: string | null;
  mp4Url: string | null;
  likeCount: number;
  width: number | null;
  height: number | null;
}

export interface UploadInitiateResponse {
  videoId: string;
  uploadUrl: string;
  taskToken: string;
}

export interface TranscodeStatusResponse {
  status: string;
  percent: number;
  error?: string;
}
