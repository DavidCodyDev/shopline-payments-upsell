/**
 * Offline check: draft-order payload shape (no network, no credentials).
 * Run: npx tsx scripts/check-draft-payload.ts
 */
import { buildDraftOrderPayload } from "../src/shopline/draft-order.ts";
import type { UpsellOffer } from "../src/offer/types.ts";

const offer: UpsellOffer = {
  shop: "demo",
  enabled: true,
  productId: "16056761559984840457934011",
  variantId: "18056761559987524812644011",
  productTitle: "Upsell SKU",
  productImageUrl: "",
  ctaCopy: "Buy",
  offerTitle: "Offer",
  offerBody: "Body",
  discountPercent: 15,
  updatedAt: new Date().toISOString(),
};

const payload = buildDraftOrderPayload(offer, {
  customerEmail: "buyer@example.com",
});
const item = payload.draft_order.line_items[0];
const checks: Array<[boolean, string]> = [
  [item.product_id === offer.productId, "product_id"],
  [item.variant_id === offer.variantId, "variant_id"],
  [item.quantity === 1, "quantity"],
  [item.product_source === "main_site", "product_source"],
  [item.applied_discount?.value_type === "percentage", "discount type"],
  [item.applied_discount?.value === 15, "discount value"],
  [payload.draft_order.stock_reserved === false, "stock_reserved"],
  [payload.draft_order.calc_sku_stock_mode === "not_limit", "calc_sku_stock_mode"],
  [payload.draft_order.shipping_lines.shipping_type === "custom", "shipping_type"],
  [payload.draft_order.customer?.email === "buyer@example.com", "customer email"],
];

for (const [ok, label] of checks) {
  if (!ok) {
    console.error("FAIL:", label);
    console.error(JSON.stringify(payload, null, 2));
    process.exit(1);
  }
}

console.log("✓ draft-order payload shape OK");
