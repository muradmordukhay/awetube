import type {
  QencodeAccessTokenResponse,
  QencodeCreateTaskResponse,
  QencodeStatusResponse,
} from "./types";

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
    // Reuse token if still valid (with 5 min buffer)
    if (
      this.accessToken &&
      this.tokenExpiry &&
      this.tokenExpiry > new Date(Date.now() + 5 * 60 * 1000)
    ) {
      return this.accessToken;
    }

    const params = new URLSearchParams({ api_key: this.apiKey! });
    const res = await fetch(`${this.endpoint}/v1/access_token`, {
      method: "POST",
      body: params,
    });

    const data: QencodeAccessTokenResponse = await res.json();
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

    const res = await fetch(`${this.endpoint}/v1/create_task`, {
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

    const res = await fetch(`${this.endpoint}/v1/start_encode2`, {
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

    const res = await fetch(`${this.endpoint}/v1/status`, {
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
