/** Shared API response shape types used across all routes. */

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  details?: Array<{ path: string; message: string }>;
}

export interface ApiSuccess {
  success: true;
}
