import { Router } from "express";
import type { AppConfig } from "../config/env.js";
import { buildPublicOffer, isOfferReady } from "../offer/service.js";
import { readOffer } from "../offer/store.js";
import { createUpsellCheckoutLink } from "../shopline/draft-order.js";

export function createApiRouter(config: AppConfig): Router {
  const router = Router();

  /**
   * Thank-you / order-status surface asks: should we show an offer?
   * Analogous to Shopify extension POST /api/offer — but response drives a
   * second-checkout CTA, not a same-method changeset.
   */
  router.get("/api/offer", (req, res) => {
    const exclude = String(req.query.excludeVariantIds ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = buildPublicOffer({
      excludeVariantIds: exclude,
      stub: config.useMockDraftOrder || !config.hasLiveCredentials,
    });

    res.json(payload);
  });

  /**
   * Buyer accepts CTA → create draft order (or mock) and return checkout URL.
   */
  router.post("/api/checkout-link", async (req, res) => {
    try {
      const offer = readOffer();
      if (!isOfferReady(offer)) {
        res.status(400).json({
          error: "Offer is disabled or missing product/variant",
        });
        return;
      }

      const customerEmail =
        typeof req.body?.customerEmail === "string"
          ? req.body.customerEmail
          : undefined;

      const result = await createUpsellCheckoutLink(config, offer, {
        customerEmail,
      });

      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      res.status(502).json({
        error: message,
        hint: "Live Shopline draft-order API failed or is misconfigured. Keep USE_MOCK_DRAFT_ORDER=true until credentials work.",
      });
    }
  });

  router.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      mode: "thank_you_second_checkout",
      mockDraftOrder: config.useMockDraftOrder || !config.hasLiveCredentials,
      hasLiveCredentials: config.hasLiveCredentials,
    });
  });

  return router;
}
