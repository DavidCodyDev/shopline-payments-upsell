/** Shop-scoped thank-you upsell offer (v1: one offer per shop). */
export type UpsellOffer = {
  shop: string;
  enabled: boolean;
  /** Shopline product id (string from Admin API). */
  productId: string;
  /** Shopline variant id — distinct from SKU. */
  variantId: string;
  productTitle: string;
  productImageUrl: string;
  /** Merchant-facing CTA button label on thank-you / order status. */
  ctaCopy: string;
  offerTitle: string;
  offerBody: string;
  /** Optional display-only discount hint; second checkout may apply a real discount later. */
  discountPercent: number;
  updatedAt: string;
};

export type OfferInput = Partial<
  Omit<UpsellOffer, "shop" | "updatedAt">
> & {
  shop?: string;
};

export type PublicOfferPayload = {
  show: boolean;
  reason?: string;
  offer?: {
    productId: string;
    variantId: string;
    productTitle: string;
    productImageUrl: string;
    offerTitle: string;
    offerBody: string;
    ctaCopy: string;
    discountPercent: number;
  };
  mode: "thank_you_second_checkout";
  stub: boolean;
};

export function defaultOffer(shop = "demo-shop"): UpsellOffer {
  return {
    shop,
    enabled: false,
    productId: "",
    variantId: "",
    productTitle: "",
    productImageUrl: "",
    ctaCopy: "Complete this offer",
    offerTitle: "Add this to your order",
    offerBody: "Exclusive add-on available right after checkout.",
    discountPercent: 0,
    updatedAt: new Date().toISOString(),
  };
}
