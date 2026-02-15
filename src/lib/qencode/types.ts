export interface QencodeAccessTokenResponse {
  error: number;
  token: string;
  expire: string;
}

export interface QencodeCreateTaskResponse {
  error: number;
  task_token: string;
  upload_url: string;
}

export interface QencodeStatusResponse {
  error: number;
  statuses: Record<
    string,
    {
      status: string;
      percent: number;
      error: number;
      error_description?: string;
      videos?: Array<{
        url: string;
        tag?: string;
        profile?: string;
        duration?: number;
        width?: number;
        height?: number;
      }>;
      images?: Array<{
        url: string;
        tag?: string;
      }>;
    }
  >;
}

export interface TranscodingProfile {
  query: {
    source: string;
    format: Array<{
      output: string;
      destination?: {
        url: string;
        key: string;
        secret: string;
      };
      stream?: Array<{
        size: string;
        video_codec: string;
        bitrate: number;
      }>;
      width?: number;
      height?: number;
      time?: number;
    }>;
    callback_url?: string;
  };
}

export interface QencodeCallbackPayload {
  task_token: string;
  status: string;
  error?: number;
  error_description?: string;
  videos?: Array<{
    url: string;
    tag?: string;
    duration?: number;
    width?: number;
    height?: number;
  }>;
  images?: Array<{
    url: string;
    tag?: string;
  }>;
}
