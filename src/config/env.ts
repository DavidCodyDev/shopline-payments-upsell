/**
 * Runtime config from environment variables.
 * Live Shopline Admin API calls need credentials; without them the app runs in stub mode.
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
  apiVersion: string;
  useMockDraftOrder: boolean;
  hasLiveCredentials: boolean;
};

export function loadConfig(): AppConfig {
  const accessToken = process.env.SHOPLINE_ACCESS_TOKEN?.trim() ?? "";
  const storeHandle = process.env.SHOPLINE_STORE_HANDLE?.trim() ?? "";
  const hasLiveCredentials = Boolean(accessToken && storeHandle);

  return {
    port: Number(process.env.PORT ?? 3000),
    appUrl: (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    shoplineAppKey: process.env.SHOPLINE_APP_KEY?.trim() ?? "",
    shoplineAppSecret: process.env.SHOPLINE_APP_SECRET?.trim() ?? "",
    storeHandle,
    accessToken,
    apiVersion: process.env.SHOPLINE_API_VERSION?.trim() || "v20260601",
    // Default: mock unless credentials exist and USE_MOCK_DRAFT_ORDER is explicitly false.
    useMockDraftOrder: hasLiveCredentials
      ? boolEnv("USE_MOCK_DRAFT_ORDER", false)
      : boolEnv("USE_MOCK_DRAFT_ORDER", true),
    hasLiveCredentials,
  };
}
