import type { AppConfig } from "../config/env.js";

/**
 * Thin Admin REST client stub.
 * Real calls need SHOPLINE_STORE_HANDLE + SHOPLINE_ACCESS_TOKEN.
 *
 * Base pattern (from spike / Shopline docs):
 *   https://{handle}.myshopline.com/admin/openapi/{version}/...
 *
 * Auth header: Authorization: Bearer {access_token} (OAuth or private-app token).
 */
export class ShoplineAdminClient {
  constructor(private readonly config: AppConfig) {}

  get baseUrl(): string {
    const handle = this.config.storeHandle;
    if (!handle) {
      throw new Error("SHOPLINE_STORE_HANDLE is required for live Admin API calls");
    }
    return `https://${handle}.myshopline.com/admin/openapi/${this.config.apiVersion}`;
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
    if (!this.config.accessToken) {
      return {
        ok: false,
        status: 0,
        data: null,
        error: "SHOPLINE_ACCESS_TOKEN missing — live API not configured",
      };
    }

    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

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
        error: `Shopline API ${res.status}: ${text.slice(0, 500)}`,
      };
    }

    return { ok: true, status: res.status, data };
  }
}
