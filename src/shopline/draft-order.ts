import {
  shouldUseLiveDraftOrder,
  type AppConfig,
} from "../config/env.js";
import type { UpsellOffer } from "../offer/types.js";
import { ShoplineAdminClient } from "./client.js";

export type CheckoutLinkResult = {
  checkoutUrl: string;
  draftOrderId: string | null;
  mock: boolean;
  message: string;
};

export type DraftOrderLineItem = {
  product_id: string;
  variant_id: string;
  quantity: number;
  product_source: "main_site" | "customize";
  title?: string;
  applied_discount?: {
    value: number;
    value_type: "percentage" | "fixed_amount";
    description?: string;
  };
};

export type CreateDraftOrderPayload = {
  draft_order: {
    note?: string;
    stock_reserved: boolean;
    calc_sku_stock_mode: "not_limit" | "real" | "reserve_real";
    language_info: {
      customer_language: string;
      merchant_language: string;
    };
    shipping_lines: {
      shipping_type: "custom" | "system";
      title: string;
      price: string;
    };
    line_items: DraftOrderLineItem[];
    customer?: {
      email?: string;
    };
  };
};

export type DraftOrderResponse = {
  draft_order?: {
    id?: string | number;
    invoice_url?: string;
    checkout_url?: string;
    order_status_url?: string;
    status?: string;
  };
};

/**
 * Build the Admin REST body for creating an upsell draft order.
 *
 * Docs: https://developer.shopline.com/docs/admin-rest-api/order/draft-order/create-a-draft-order
 * Required line fields include product_id, variant_id, quantity, product_source.
 */
export function buildDraftOrderPayload(
  offer: UpsellOffer,
  opts?: { customerEmail?: string; note?: string },
): CreateDraftOrderPayload {
  const lineItem: DraftOrderLineItem = {
    product_id: offer.productId,
    variant_id: offer.variantId,
    quantity: 1,
    product_source: "main_site",
    title: offer.productTitle || undefined,
  };

  if (offer.discountPercent > 0) {
    lineItem.applied_discount = {
      value: offer.discountPercent,
      value_type: "percentage",
      description: "Thank-you upsell discount",
    };
  }

  const draft_order: CreateDraftOrderPayload["draft_order"] = {
    note: opts?.note ?? "Thank-you page upsell (second checkout)",
    stock_reserved: false,
    calc_sku_stock_mode: "not_limit",
    language_info: {
      customer_language: "en",
      merchant_language: "en",
    },
    // Free custom shipping so the buyer can complete payment without a delivery template.
    shipping_lines: {
      shipping_type: "custom",
      title: "Thank-you upsell",
      price: "0",
    },
    line_items: [lineItem],
  };

  if (opts?.customerEmail) {
    draft_order.customer = { email: opts.customerEmail };
  }

  return { draft_order };
}

function mockCheckoutLink(
  config: AppConfig,
  offer: UpsellOffer,
): CheckoutLinkResult {
  const mockId = `mock-draft-${Date.now()}`;
  return {
    checkoutUrl: `${config.appUrl}/thank-you/mock-checkout?draft=${encodeURIComponent(mockId)}&variant=${encodeURIComponent(offer.variantId)}`,
    draftOrderId: mockId,
    mock: true,
    message:
      "Stub mode: no live Shopline draft order created. Set SHOPLINE_STORE_HANDLE (or SHOPLINE_API_BASE) + SHOPLINE_ACCESS_TOKEN and USE_MOCK_DRAFT_ORDER=false for real API calls.",
  };
}

function pickCheckoutUrl(draft: NonNullable<DraftOrderResponse["draft_order"]>): string | null {
  const url = draft.invoice_url || draft.checkout_url || draft.order_status_url;
  if (!url) return null;
  // Docs sometimes show invoice_url without a scheme in examples.
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url.replace(/^\/\//, "")}`;
}

/**
 * Create a draft order for the upsell product and return a buyer checkout URL.
 *
 * This is intentionally NOT same-method post-pay capture (unavailable in public APIs).
 * Path chosen: thank-you CTA → second purchase via draft order / new checkout.
 *
 * Live mode is gated: without credentials (or with USE_MOCK_DRAFT_ORDER=true) returns mock.
 */
export async function createUpsellCheckoutLink(
  config: AppConfig,
  offer: UpsellOffer,
  opts?: { customerEmail?: string; note?: string },
): Promise<CheckoutLinkResult> {
  if (!shouldUseLiveDraftOrder(config)) {
    return mockCheckoutLink(config, offer);
  }

  const client = new ShoplineAdminClient(config);
  const payload = buildDraftOrderPayload(offer, opts);

  const result = await client.request<DraftOrderResponse>(
    "POST",
    "/orders/draft_orders.json",
    payload,
  );

  if (!result.ok || !result.data?.draft_order) {
    throw new Error(
      result.error ?? "Failed to create Shopline draft order (live API)",
    );
  }

  const draft = result.data.draft_order;
  const checkoutUrl = pickCheckoutUrl(draft);

  if (!checkoutUrl) {
    throw new Error(
      "Draft order created but no invoice_url/checkout_url in response — inspect live payload and map fields.",
    );
  }

  return {
    checkoutUrl,
    draftOrderId: draft.id != null ? String(draft.id) : null,
    mock: false,
    message: "Live draft order created via Shopline Admin API.",
  };
}
