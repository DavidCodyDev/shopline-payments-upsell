#!/usr/bin/env node
/**
 * Mock-mode smoke test (no Shopline credentials required).
 *
 * Usage:
 *   npm run smoke          # starts nothing — expects server already on APP_URL
 *   npm run smoke:mock     # same
 *
 * Live smoke (manual, needs credentials):
 *   1. Set SHOPLINE_STORE_HANDLE + SHOPLINE_ACCESS_TOKEN in .env
 *   2. USE_MOCK_DRAFT_ORDER=false
 *   3. npm run dev
 *   4. Enable offer in /admin with real productId/variantId
 *   5. POST /api/checkout-link — expect mock:false and a real invoice_url
 */

const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

async function req(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: res.status, data };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log(`Smoke (mock) against ${base}`);

  const health = await req("GET", "/api/health");
  assert(health.status === 200, `health status ${health.status}`);
  assert(health.data?.ok === true, "health.ok !== true");
  assert(
    health.data?.mockDraftOrder === true,
    `Expected mockDraftOrder=true (got ${health.data?.mockDraftOrder}). Unset live credentials or set USE_MOCK_DRAFT_ORDER=true for this smoke.`,
  );
  console.log("✓ /api/health mock mode");

  const save = await req("PUT", "/api/admin/offer", {
    enabled: true,
    productId: "smoke-product",
    variantId: "smoke-variant",
    productTitle: "Smoke upsell",
    ctaCopy: "Add this",
    offerTitle: "Smoke offer",
    offerBody: "Mock smoke test offer",
    discountPercent: 10,
  });
  assert(save.status === 200, `admin save status ${save.status}`);
  assert(save.data?.offer?.enabled === true, "offer not enabled after save");
  console.log("✓ PUT /api/admin/offer (no Shopline required)");

  const offer = await req("GET", "/api/offer");
  assert(offer.status === 200, `offer status ${offer.status}`);
  assert(offer.data?.show === true, `offer.show !== true (${offer.data?.reason})`);
  assert(offer.data?.stub === true, "offer.stub should be true in mock mode");
  console.log("✓ GET /api/offer show=true stub=true");

  const link = await req("POST", "/api/checkout-link", {});
  assert(link.status === 200, `checkout-link status ${link.status}: ${JSON.stringify(link.data)}`);
  assert(link.data?.mock === true, "checkout-link.mock should be true");
  assert(
    typeof link.data?.checkoutUrl === "string" &&
      link.data.checkoutUrl.includes("/thank-you/mock-checkout"),
    `unexpected checkoutUrl: ${link.data?.checkoutUrl}`,
  );
  console.log("✓ POST /api/checkout-link → mock checkout URL");
  console.log(`  ${link.data.checkoutUrl}`);

  console.log("\nSmoke passed (mock). Live smoke: see README / script header.");
}

main().catch((err) => {
  console.error("\nSmoke failed:", err.message);
  console.error(
    "Is the server running? Try: npm run dev  (then re-run smoke in another terminal)",
  );
  process.exit(1);
});
