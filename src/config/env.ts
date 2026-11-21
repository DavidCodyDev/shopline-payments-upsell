/**
 * Runtime config from environment variables.
 * Live Shopline Admin API calls need credentials; without them the app runs in stub/mock mode.
 */

function boolEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

export type AppConfig = {
  port: number;
  appUrl: string;
  shoplineAppKey: string;
  shoplineAppSecret: string;
  storeHandle: string;
  accessToken: string;
  /** Optional override for the full Admin OpenAPI base (no trailing slash). */
  apiBase: string;
  apiVersion: string;
  useMockDraftOrder: boolean;
  hasLiveCredentials: boolean;
};

export function loadConfig(): AppConfig {
  const accessToken = process.env.SHOPLINE_ACCESS_TOKEN?.trim() ?? "";
  const storeHandle = process.env.SHOPLINE_STORE_HANDLE?.trim() ?? "";
  const apiBase = (process.env.SHOPLINE_API_BASE?.trim() ?? "").replace(/\/$/, "");
  const hasLiveCredentials = Boolean(accessToken && (storeHandle || apiBase));

  return {
    port: Number(process.env.PORT ?? 3000),
    appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    shoplineAppKey: process.env.SHOPLINE_APP_KEY?.trim() ?? "",
    shoplineAppSecret: process.env.SHOPLINE_APP_SECRET?.trim() ?? "",
    storeHandle,
    accessToken,
    apiBase,
    apiVersion: process.env.SHOPLINE_API_VERSION?.trim() || "v20260901",
    // Default: mock unless credentials exist and USE_MOCK_DRAFT_ORDER is explicitly false.
    // Without credentials, mock always wins so local admin / thank-you still work.
    useMockDraftOrder: hasLiveCredentials
      ? boolEnv("USE_MOCK_DRAFT_ORDER", false)
      : true,
    hasLiveCredentials,
  };
}

/** True when checkout-link should call Shopline instead of returning a local mock URL. */
export function shouldUseLiveDraftOrder(config: AppConfig): boolean {
  return config.hasLiveCredentials && !config.useMockDraftOrder;
}
