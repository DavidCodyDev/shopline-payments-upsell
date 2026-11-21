import type { AppConfig } from "../config/env.js";

export type ShoplineRequestResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
  rawText?: string;
};

/**
 * Thin Shopline Admin REST client.
 *
 * Base pattern (docs):
 *   https://{handle}.myshopline.com/admin/openapi/{version}/...
 *
 * Auth: Authorization: Bearer {access_token}
 * Content-Type: application/json; charset=utf-8
 *
 * Requires SHOPLINE_ACCESS_TOKEN plus either SHOPLINE_STORE_HANDLE or SHOPLINE_API_BASE.
 */
export class ShoplineAdminClient {
  constructor(private readonly config: AppConfig) {}

  get baseUrl(): string {
    if (this.config.apiBase) {
      return this.config.apiBase;
    }
    const handle = this.config.storeHandle;
    if (!handle) {
      throw new Error(
        "SHOPLINE_STORE_HANDLE or SHOPLINE_API_BASE is required for live Admin API calls",
      );
    }
    return `https://${handle}.myshopline.com/admin/openapi/${this.config.apiVersion}`;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<ShoplineRequestResult<T>> {
    if (!this.config.accessToken) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: "SHOPLINE_ACCESS_TOKEN missing — live API not configured",
      };
    }

    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false,
        status: 0,
        data: null,
        error: `Shopline API network error: ${message}`,
      };
    }

    const text = await res.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        rawText: text,
        error: `Shopline API ${res.status}: ${text.slice(0, 500)}`,
      };
    }

    return { ok: true, status: res.status, data, rawText: text };
  }
}
