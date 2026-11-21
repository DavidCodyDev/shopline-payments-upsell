# Thank-you / order-status extension stub

SHOPLINE Checkout UI Customizer supports dynamic points on the thank-you / order status page:

| Extension point | Role |
| --- | --- |
| `Checkout::Dynamic::Render[OrderStatus1]` | After order number |
| `Checkout::Dynamic::Render[OrderStatus2]` | After order update subscription |
| `Checkout::Dynamic::Render[OrderStatus3]` | After customer information |

Docs: [Extension points](https://developer.shopline.com/docs/apps/checkout/checkout-ui-customizer/extension-points)

## Constraints (from spike)

- Requires a **public** App Store app (passed review).
- Merchants need **SHOPLINE Enterprise** + Settings → Checkout → Customize checkout.
- Thank-you APIs are **read-only** (`orderConfirmation`); they cannot charge the original card.
- Private apps **cannot** use App Extensions / App Bridge.

## This scaffold’s choice

**Path 2:** show an offer on thank-you / order status, CTA → **new draft order / second checkout**.

We do **not** use:

- Pre-pay `applyCheckoutLinesChange` on the checkout page
- Fake same-method post-pay capture via order edit + `customPay`

`order-status-offer.ts` is a **placeholder** for a future Checkout UI Customizer module. Until a public app + Enterprise store exist, use the local `/thank-you` demo page and/or ScriptTag stub instead.
