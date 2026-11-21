/**
 * Thank-you / order-status upsell widget (browser stub).
 * Can be loaded from the local preview page or (later) via ScriptTag src.
 */
const root = document.getElementById("upsell-root");
const empty = document.getElementById("empty");
const titleEl = document.getElementById("offer-title");
const bodyEl = document.getElementById("offer-body");
const productEl = document.getElementById("offer-product");
const ctaEl = document.getElementById("offer-cta");
const imageEl = document.getElementById("offer-image");
const noteEl = document.getElementById("offer-note");

async function loadOffer() {
  const params = new URLSearchParams(window.location.search);
  const exclude = params.get("excludeVariantIds") ?? "";
  const qs = exclude ? `?excludeVariantIds=${encodeURIComponent(exclude)}` : "";
  const res = await fetch(`/api/offer${qs}`);
  if (!res.ok) throw new Error(`Offer request failed (${res.status})`);
  return res.json();
}

function hideOffer(message) {
  if (root) root.hidden = true;
  if (empty) {
    empty.hidden = false;
    empty.textContent = message;
  }
}

function showOffer(payload) {
  const offer = payload.offer;
  if (!offer || !root) return;

  titleEl.textContent = offer.offerTitle;
  bodyEl.textContent = offer.offerBody;
  productEl.textContent =
    offer.discountPercent > 0
      ? `${offer.productTitle} · ${offer.discountPercent}% off (display hint)`
      : offer.productTitle;
  ctaEl.textContent = offer.ctaCopy || "Complete this offer";

  if (offer.productImageUrl) {
    imageEl.src = offer.productImageUrl;
    imageEl.hidden = false;
  } else {
    imageEl.hidden = true;
  }

  noteEl.textContent = payload.stub
    ? "Stub mode: CTA opens a mock second-checkout URL (no live Shopline draft order)."
    : "CTA creates a Shopline draft order and redirects to its checkout / invoice URL.";

  empty.hidden = true;
  root.hidden = false;
}

ctaEl?.addEventListener("click", async () => {
  ctaEl.disabled = true;
  noteEl.textContent = "Creating checkout link…";
  try {
    const res = await fetch("/api/checkout-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    noteEl.textContent = data.message || "";
    window.location.href = data.checkoutUrl;
  } catch (err) {
    noteEl.textContent = err.message || "Could not create checkout link";
    ctaEl.disabled = false;
  }
});

loadOffer()
  .then((payload) => {
    if (!payload.show) {
      hideOffer(`No offer shown (${payload.reason || "hidden"}). Enable + set product/variant in /admin.`);
      return;
    }
    showOffer(payload);
  })
  .catch((err) => hideOffer(err.message || "Failed to load offer"));
