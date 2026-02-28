/**
 * Core HTTP client for the AnySpend Platform API.
 * Handles authentication, retries, error parsing, and idempotency.
 */

import { parseApiError, type ApiErrorResponse } from "./errors";
import { generateIdempotencyKey } from "./utils/idempotency";
import type { ListResponse } from "./types";

export interface ClientConfig {
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  idempotencyKeyGenerator?: () => string;
}

const DEFAULT_BASE_URL = "https://platform-api.anyspend.com/api/v1";
const DEFAULT_TIMEOUT = 30000;
const DEFAULT_MAX_RETRIES = 3;

export class HttpClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private maxRetries: number;
  private generateIdempotencyKey: () => string;

  constructor(apiKey: string, config: ClientConfig = {}) {
    this.apiKey = apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/$/, "");
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries || DEFAULT_MAX_RETRIES;
    this.generateIdempotencyKey = config.idempotencyKeyGenerator || generateIdempotencyKey;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>("GET", url);
  }

  async post<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>("POST", url, body);
  }

  async patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>("PATCH", url, body);
  }

  async delete<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>("DELETE", url, body);
  }

  async postFormData<T>(path: string, formData: FormData): Promise<T> {
    const url = this.buildUrl(path);
    return this.requestRaw<T>("POST", url, formData);
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async request<T>(method: string, url: string, body?: Record<string, unknown>): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    // Auto-generate idempotency key for POST/PATCH
    if (method === "POST" || method === "PATCH") {
      headers["Idempotency-Key"] = this.generateIdempotencyKey();
    }

    return this.executeWithRetry<T>(method, url, headers, body ? JSON.stringify(body) : undefined);
  }

  private async requestRaw<T>(method: string, url: string, body: FormData): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };

    return this.executeWithRetry<T>(method, url, headers, body);
  }

  private async executeWithRetry<T>(
    method: string,
    url: string,
    headers: Record<string, string>,
    body?: string | FormData,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          // Handle CSV/text responses
          const contentType = response.headers.get("Content-Type") || "";
          if (contentType.includes("text/csv")) {
            return (await response.text()) as unknown as T;
          }
          return (await response.json()) as T;
        }

        // Parse error response
        const errorBody = (await response.json().catch(() => ({
          error: { type: "api_error", code: "internal_error", message: "Unknown error" },
        }))) as ApiErrorResponse;

        const error = parseApiError(response.status, errorBody, response.headers);

        // Don't retry 4xx errors (except 429 rate limits)
        if (response.status < 500 && response.status !== 429) {
          throw error;
        }

        // For 429, wait the specified retry-after time
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          await this.sleep(retryAfter * 1000);
          lastError = error;
          continue;
        }

        // For 5xx, retry with exponential backoff
        lastError = error;
        if (attempt < this.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          lastError = new Error(`Request timed out after ${this.timeout}ms`);
        } else if (err instanceof Error && "type" in err) {
          // Already a parsed ApiError, re-throw
          throw err;
        } else {
          lastError = err instanceof Error ? err : new Error(String(err));
        }

        if (attempt < this.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Static HTTP client for unauthenticated requests (quick-pay).
 */
export class StaticHttpClient {
  static async post<T>(baseUrl: string, path: string, body: Record<string, unknown>): Promise<T> {
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    const errorBody = (await response.json().catch(() => ({
      error: { type: "api_error", code: "internal_error", message: "Unknown error" },
    }))) as ApiErrorResponse;

    throw parseApiError(response.status, errorBody, response.headers);
  }
}
