import { Router } from "express";
import { readOffer, writeOffer } from "../offer/store.js";
import type { OfferInput } from "../offer/types.js";

export function createAdminRouter(): Router {
  const router = Router();

  router.get("/api/admin/offer", (_req, res) => {
    res.json({ offer: readOffer() });
  });

  router.put("/api/admin/offer", (req, res) => {
    const body = (req.body ?? {}) as OfferInput;
    const offer = writeOffer({
      shop: body.shop,
      enabled: body.enabled,
      productId: body.productId,
      variantId: body.variantId,
      productTitle: body.productTitle,
      productImageUrl: body.productImageUrl,
      ctaCopy: body.ctaCopy,
      offerTitle: body.offerTitle,
      offerBody: body.offerBody,
      discountPercent: body.discountPercent,
    });
    res.json({ offer });
  });

  return router;
}
