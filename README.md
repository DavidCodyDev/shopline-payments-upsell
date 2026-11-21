# Shopline thank-you upsell (scaffold)

Minimal **Node + TypeScript** partner-app scaffold for a SHOPLINE **thank-you / order-status** upsell that sends buyers to a **second checkout** (draft order) — not a same-method post-pay charge.

Inspired by [shopify-payments-upsell](https://github.com/DavidCodyDev/shopify-payments-upsell), adapted to what SHOPLINE’s public docs support (see project spike notes).

> **This PR does not claim live Shopline Admin API calls work.** Without credentials the app runs in stub/mock mode.

## What this is (Path 2)

| Surface | Role |
| --- | --- |
| Merchant admin (`/admin`) | Configure one upsell product + enable toggle + CTA copy |
| API (`/api/offer`, `/api/checkout-link`) | “Should we show?” + create draft-order checkout URL |
| Buyer thank-you (`/thank-you`) | Local preview of the offer + CTA |
| Extension / ScriptTag stubs | Placeholders for real store injection later |

**Chosen model:** thank-you CTA → **new draft order / second checkout**.

**Explicitly out of scope for v1:**

- Checkout UI Customizer **pre-pay** `applyCheckoutLinesChange`
- Same-method **post-pay** capture (not documented on public SHOPLINE APIs)

## Folder layout

```
src/
  index.ts                 Express entry
  config/env.ts            Env loading
  offer/                   Offer types, file store, should-show logic
  routes/admin.ts          Merchant config API
  routes/api.ts            Public offer + checkout-link APIs
  shopline/                Admin REST client + draft-order helper (live gated)
  admin/public/            Simple merchant HTML UI
  thank-you/
    public/                Buyer preview + widget JS
    script-hook.ts         ScriptTag registration stub
    extension-stub/        Checkout UI Customizer thank-you points stub
data/                      Local offer.json (gitignored contents)
```

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

- http://localhost:3000 — hub
- http://localhost:3000/admin — merchant stub
- http://localhost:3000/thank-you — buyer stub
- http://localhost:3000/api/health — health + mock flag

Production-style build:

```bash
npm run build
npm start
```

### Quick smoke

1. In `/admin`, enable the offer, set any product/variant IDs + copy, Save.
2. Open `/thank-you` — offer should appear.
3. Click CTA — redirects to `/thank-you/mock-checkout?...` in stub mode.

## Environment variables

| Variable | Required for live API? | Purpose |
| --- | --- | --- |
| `PORT` | No | Server port (default `3000`) |
| `APP_URL` | No | Public base URL for links / ScriptTag stub |
| `SHOPLINE_APP_KEY` | Later (OAuth) | Partner app key |
| `SHOPLINE_APP_SECRET` | Later (OAuth) | Partner app secret |
| `SHOPLINE_STORE_HANDLE` | **Yes** | `{handle}.myshopline.com` Admin host |
| `SHOPLINE_ACCESS_TOKEN` | **Yes** | OAuth or private-app Admin token |
| `SHOPLINE_API_VERSION` | No | Default `v20260601` |
| `USE_MOCK_DRAFT_ORDER` | No | Force mock checkout URLs (`true` by default without credentials) |

See `.env.example`. Auth patterns: [App authorization](https://developer.shopline.com/docs/apps/api-instructions-for-use/app-authorization). Draft orders: [Create a draft order](https://developer.shopline.com/docs/admin-rest-api/order/draft-order/create-a-draft-order).

## Stub vs real

| Piece | Status |
| --- | --- |
| Merchant config UI + JSON file store | **Real locally** (not embedded Shopline Admin / OAuth yet) |
| `GET /api/offer` should-show rules | **Real locally** (enabled + product/variant; exclude list) |
| `POST /api/checkout-link` | **Mock by default** — returns local mock checkout URL |
| Shopline draft-order create | **Stubbed** until `SHOPLINE_STORE_HANDLE` + `SHOPLINE_ACCESS_TOKEN` and `USE_MOCK_DRAFT_ORDER=false` |
| Checkout UI Customizer extension | **Stub only** (`src/thank-you/extension-stub/`) — needs public App Store app + Enterprise |
| ScriptTag install | **Stub only** (`GET /api/script-tag-stub` shows intended payload) |
| Product picker against Shopline catalog | **Not built** — paste product/variant IDs |
| OAuth install / session storage | **Not built** |

## Mapping: Shopify post-purchase → this thank-you CTA model

| Shopify payments upsell | This scaffold |
| --- | --- |
| `checkout_post_purchase` interstitial after pay | Thank-you / order-status surface (preview page + extension/ScriptTag stubs) |
| `POST /api/offer` + `ShouldRender` | `GET /api/offer` |
| Signed JWT changeset + `applyChangeset` (same card) | `POST /api/checkout-link` → draft order / second checkout |
| Accept charges original payment method | Buyer pays again on a new checkout |
| Embedded Polaris Admin + App Bridge picker | Simple `/admin` HTML form (IDs entered manually) |
| Prisma `UpsellOffer` | `data/offer.json` file store |

## Next steps (not in this PR)

1. OAuth (public/custom app) or private-app token wiring + session storage.
2. Validate live draft-order response fields (`invoice_url` vs `checkout_url`) against a real store.
3. Add Checkout UI Customizer module for `OrderStatus*` points **or** install ScriptTag for non-Enterprise / private-app paths.
4. Product search UI via `GET .../products/products.json`.
5. Event logging (shown / accept / decline) analogous to the Shopify app.

## License

Private / unlicensed scaffold for partner exploration.
