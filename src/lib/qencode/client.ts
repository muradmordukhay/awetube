/**
 * Qencode API client singleton.
 *
 * Handles authentication (access token with 5-min-early refresh), task
 * creation, encoding start, and status polling. Uses globalThis singleton
 * pattern (same as db.ts).
 *
 * Used by: upload/initiate (createTask), upload/start-transcode (startEncode),
 *          upload/status/[taskToken] (getStatus)
 */
import type {
  QencodeAccessTokenResponse,
  QencodeCreateTaskResponse,
  QencodeStatusResponse,
} from "./types";
import { UPLOAD, TOKEN } from "@/lib/constants";

/** Wraps fetch with an AbortController timeout. */
function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = UPLOAD.QENCODE_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer)
  );
}

class QencodeClient {
  private apiKey: string | null = null;
  private endpoint: string = "https://api.qencode.com";
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private ensureConfigured() {
    if (!this.apiKey) {
      this.apiKey = process.env.QENCODE_API_KEY || null;
      this.endpoint =
        process.env.QENCODE_API_ENDPOINT || "https://api.qencode.com";
    }
    if (!this.apiKey) {
      throw new Error("QENCODE_API_KEY is not set");
    }
  }

  private async getAccessToken(): Promise<string> {
    this.ensureConfigured();
    // Reuse token if still valid (with 5-min buffer).
    const bufferMs = TOKEN.QENCODE_TOKEN_REFRESH_BUFFER_S * 1000;
    if (
      this.accessToken &&
      this.tokenExpiry &&
      this.tokenExpiry > new Date(Date.now() + bufferMs)
    ) {
      return this.accessToken;
    }

    const params = new URLSearchParams({ api_key: this.apiKey! });
    const res = await fetchWithTimeout(`${this.endpoint}/v1/access_token`, {
      method: "POST",
      body: params,
    });

    const data: QencodeAccessTokenResponse = await res.json();
    // Qencode error codes: 0 = success, non-zero = failure.
    if (data.error) {
      throw new Error(`Qencode auth failed: ${JSON.stringify(data)}`);
    }

    this.accessToken = data.token;
    this.tokenExpiry = new Date(data.expire);
    return this.accessToken;
  }

  async createTask(): Promise<QencodeCreateTaskResponse> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({ token });

    const res = await fetchWithTimeout(`${this.endpoint}/v1/create_task`, {
      method: "POST",
      body: params,
    });

    const data: QencodeCreateTaskResponse = await res.json();
    if (data.error) {
      throw new Error(`Qencode create task failed: ${JSON.stringify(data)}`);
    }

    return data;
  }

  async startEncode(
    taskToken: string,
    query: Record<string, unknown>
  ): Promise<void> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      token,
      task_token: taskToken,
      query: JSON.stringify(query),
    });

    const res = await fetchWithTimeout(`${this.endpoint}/v1/start_encode2`, {
      method: "POST",
      body: params,
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(`Qencode start encode failed: ${JSON.stringify(data)}`);
    }
  }

  async getStatus(taskTokens: string[]): Promise<QencodeStatusResponse> {
    const token = await this.getAccessToken();
    const params = new URLSearchParams({
      token,
      task_tokens: JSON.stringify(taskTokens),
    });

    const res = await fetchWithTimeout(`${this.endpoint}/v1/status`, {
      method: "POST",
      body: params,
    });

    const data: QencodeStatusResponse = await res.json();
    if (data.error) {
      throw new Error(`Qencode status check failed: ${JSON.stringify(data)}`);
    }

    return data;
  }
}

// Singleton
const globalForQencode = globalThis as unknown as {
  qencode: QencodeClient | undefined;
};

export const qencode =
  globalForQencode.qencode ?? new QencodeClient();

if (process.env.NODE_ENV !== "production") globalForQencode.qencode = qencode;
