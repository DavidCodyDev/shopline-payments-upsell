import { readOffer } from "./store.js";
import type { PublicOfferPayload, UpsellOffer } from "./types.js";

export function isOfferReady(offer: UpsellOffer): boolean {
  return Boolean(
    offer.enabled && offer.productId.trim() && offer.variantId.trim(),
  );
}

/**
 * "Should we show?" for thank-you / order-status surfaces.
 * v1: enabled + product/variant set. Later: exclude variants already in the paid order.
 */
export function buildPublicOffer(opts?: {
  excludeVariantIds?: string[];
  stub?: boolean;
}): PublicOfferPayload {
  const offer = readOffer();
  const stub = opts?.stub ?? true;

  if (!offer.enabled) {
    return {
      show: false,
      reason: "offer_disabled",
      mode: "thank_you_second_checkout",
      stub,
    };
  }

  if (!offer.productId.trim() || !offer.variantId.trim()) {
    return {
      show: false,
      reason: "missing_product",
      mode: "thank_you_second_checkout",
      stub,
    };
  }

  const excluded = new Set((opts?.excludeVariantIds ?? []).map(String));
  if (excluded.has(offer.variantId)) {
    return {
      show: false,
      reason: "already_in_order",
      mode: "thank_you_second_checkout",
      stub,
    };
  }

  return {
    show: true,
    mode: "thank_you_second_checkout",
    stub,
    offer: {
      productId: offer.productId,
      variantId: offer.variantId,
      productTitle: offer.productTitle || "Upsell product",
      productImageUrl: offer.productImageUrl,
      offerTitle: offer.offerTitle,
      offerBody: offer.offerBody,
      ctaCopy: offer.ctaCopy,
      discountPercent: offer.discountPercent,
    },
  };
}
