import type { AppConfig } from "../config/env.js";
import type { UpsellOffer } from "../offer/types.js";
import { ShoplineAdminClient } from "./client.js";

export type CheckoutLinkResult = {
  checkoutUrl: string;
  draftOrderId: string | null;
  mock: boolean;
  message: string;
};

/**
 * Create a draft order for the upsell product and return a buyer checkout URL.
 *
 * Docs (spike): Create a draft order
 * https://developer.shopline.com/docs/admin-rest-api/order/draft-order/create-a-draft-order
 *
 * This is intentionally NOT same-method post-pay capture (unavailable in public APIs).
 * Path chosen: thank-you CTA → second purchase via draft order / new checkout.
 */
export async function createUpsellCheckoutLink(
  config: AppConfig,
  offer: UpsellOffer,
  opts?: { customerEmail?: string; note?: string },
): Promise<CheckoutLinkResult> {
  if (config.useMockDraftOrder || !config.hasLiveCredentials) {
    const mockId = `mock-draft-${Date.now()}`;
    return {
      checkoutUrl: `${config.appUrl}/thank-you/mock-checkout?draft=${encodeURIComponent(mockId)}&variant=${encodeURIComponent(offer.variantId)}`,
      draftOrderId: mockId,
      mock: true,
      message:
        "Stub mode: no live Shopline draft order created. Set SHOPLINE_STORE_HANDLE + SHOPLINE_ACCESS_TOKEN and USE_MOCK_DRAFT_ORDER=false for real API calls.",
    };
  }

  const client = new ShoplineAdminClient(config);

  // Shape follows Shopline draft-order create patterns (product_id + variant_id).
  // Exact field names may need adjustment against live API responses once credentials exist.
  const payload = {
    draft_order: {
      note: opts?.note ?? "Thank-you page upsell (second checkout)",
      email: opts?.customerEmail,
      line_items: [
        {
          product_id: offer.productId,
          variant_id: offer.variantId,
          quantity: 1,
        },
      ],
    },
  };

  const result = await client.request<{
    draft_order?: {
      id?: string | number;
      invoice_url?: string;
      checkout_url?: string;
      order_status_url?: string;
    };
  }>("POST", "/orders/draft_orders.json", payload);

  if (!result.ok || !result.data?.draft_order) {
    throw new Error(
      result.error ?? "Failed to create Shopline draft order (live API)",
    );
  }

  const draft = result.data.draft_order;
  const checkoutUrl =
    draft.invoice_url || draft.checkout_url || draft.order_status_url;

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
