import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultOffer, type OfferInput, type UpsellOffer } from "./types.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const dataPath = join(rootDir, "data", "offer.json");

function ensureDataFile(): void {
  mkdirSync(dirname(dataPath), { recursive: true });
  if (!existsSync(dataPath)) {
    writeFileSync(dataPath, JSON.stringify(defaultOffer(), null, 2), "utf8");
  }
}

export function readOffer(): UpsellOffer {
  ensureDataFile();
  const raw = readFileSync(dataPath, "utf8");
  return { ...defaultOffer(), ...JSON.parse(raw) } as UpsellOffer;
}

export function writeOffer(input: OfferInput): UpsellOffer {
  const current = readOffer();
  const next: UpsellOffer = {
    ...current,
    ...input,
    shop: input.shop?.trim() || current.shop,
    enabled: input.enabled ?? current.enabled,
    productId: input.productId !== undefined ? String(input.productId) : current.productId,
    variantId: input.variantId !== undefined ? String(input.variantId) : current.variantId,
    productTitle: input.productTitle ?? current.productTitle,
    productImageUrl: input.productImageUrl ?? current.productImageUrl,
    ctaCopy: input.ctaCopy ?? current.ctaCopy,
    offerTitle: input.offerTitle ?? current.offerTitle,
    offerBody: input.offerBody ?? current.offerBody,
    discountPercent:
      input.discountPercent !== undefined
        ? Number(input.discountPercent) || 0
        : current.discountPercent,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(dataPath, JSON.stringify(next, null, 2), "utf8");
  return next;
}
