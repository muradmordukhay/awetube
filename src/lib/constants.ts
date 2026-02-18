/**
 * Application-wide constants.
 *
 * Centralizes magic numbers and limits that were previously scattered
 * across route handlers, validation schemas, and utility files.
 */

export const PAGINATION = {
  DEFAULT_LIMIT: 24,
  COMMENT_DEFAULT_LIMIT: 20,
  NOTIFICATION_DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
} as const;

export const RATE_LIMITS = {
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX_REQUESTS: 10,
  EMAIL_LINK_WINDOW_MS: 60 * 1000,
  EMAIL_LINK_MAX_REQUESTS: 30,
  UPLOAD_WINDOW_MS: 60 * 60 * 1000,
  UPLOAD_MAX_REQUESTS: 20,
  SEARCH_WINDOW_MS: 60 * 1000,
  SEARCH_MAX_REQUESTS: 30,
  API_WINDOW_MS: 60 * 1000,
  API_MAX_REQUESTS: 60,
  PASSWORD_RESET_WINDOW_MS: 15 * 60 * 1000,
  PASSWORD_RESET_MAX_REQUESTS: 3,
  CALLBACK_WINDOW_MS: 60 * 1000,
  CALLBACK_MAX_REQUESTS: 100,
} as const;

export const TOKEN = {
  /** Login link token TTL in milliseconds (1 hour) */
  LOGIN_LINK_TTL_MS: 60 * 60 * 1000,
  /** Password reset token TTL in milliseconds (1 hour) */
  PASSWORD_RESET_TTL_MS: 60 * 60 * 1000,
  /** Callback signature validity window in seconds (5 minutes) */
  CALLBACK_SIGNATURE_WINDOW_S: 5 * 60,
  /** Qencode access token early refresh buffer in seconds (5 minutes) */
  QENCODE_TOKEN_REFRESH_BUFFER_S: 5 * 60,
} as const;

export const UPLOAD = {
  /** TUS chunk size in bytes (50 MB) */
  CHUNK_SIZE: 50 * 1024 * 1024,
  /** TUS retry delay sequence in milliseconds */
  RETRY_DELAYS: [0, 1000, 3000, 5000] as number[],
  /** Qencode fetch timeout in milliseconds (30 seconds) */
  QENCODE_FETCH_TIMEOUT_MS: 30_000,
} as const;

export const QENCODE = {
  /** Non-zero error codes indicate failure (0 = success) */
  ERROR_CODE_SUCCESS: 0,
  STATUS_COMPLETED: "completed",
  STATUS_ERROR: "error",
} as const;
