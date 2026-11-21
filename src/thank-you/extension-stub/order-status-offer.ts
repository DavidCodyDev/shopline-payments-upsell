/**
 * Placeholder for a future SHOPLINE Checkout UI Customizer module.
 *
 * Target extension points (thank you / order status):
 *   - Checkout::Dynamic::Render[OrderStatus1]
 *   - Checkout::Dynamic::Render[OrderStatus2]
 *   - Checkout::Dynamic::Render[OrderStatus3]
 *
 * Intended runtime behavior (when a real extension project is added):
 *   1. Read orderConfirmation.orderId / orderNumber (read-only).
 *   2. GET {appUrl}/api/offer?excludeVariantIds=...
 *   3. If show, render title/body/CTA.
 *   4. On CTA click, POST {appUrl}/api/checkout-link → redirect to checkoutUrl.
 *
 * This file is NOT wired into a Shopline CLI extension build. It exists so the
 * folder layout is ready for a public-app extension without claiming it runs live.
 */

export const EXTENSION_POINTS = [
  "Checkout::Dynamic::Render[OrderStatus1]",
  "Checkout::Dynamic::Render[OrderStatus2]",
  "Checkout::Dynamic::Render[OrderStatus3]",
] as const;

export type ThankYouOfferViewModel = {
  title: string;
  body: string;
  ctaCopy: string;
  imageUrl?: string;
  checkoutUrl?: string;
};

export function renderOfferHtml(view: ThankYouOfferViewModel): string {
  const img = view.imageUrl
    ? `<img src="${escapeAttr(view.imageUrl)}" alt="" width="120" height="120" />`
    : "";
  const href = view.checkoutUrl
    ? escapeAttr(view.checkoutUrl)
    : "#";
  return `
<section class="sl-upsell-offer" data-mode="thank_you_second_checkout">
  ${img}
  <h2>${escapeHtml(view.title)}</h2>
  <p>${escapeHtml(view.body)}</p>
  <a class="sl-upsell-cta" href="${href}">${escapeHtml(view.ctaCopy)}</a>
</section>`.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
