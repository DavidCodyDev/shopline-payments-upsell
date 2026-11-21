const form = document.getElementById("offer-form");
const statusEl = document.getElementById("status");

const fields = [
  "shop",
  "productId",
  "variantId",
  "productTitle",
  "productImageUrl",
  "offerTitle",
  "offerBody",
  "ctaCopy",
  "discountPercent",
];

function setStatus(message, kind = "") {
  statusEl.textContent = message;
  statusEl.className = `status ${kind}`.trim();
}

function fillForm(offer) {
  document.getElementById("enabled").checked = Boolean(offer.enabled);
  for (const name of fields) {
    const el = document.getElementById(name);
    if (el) el.value = offer[name] ?? "";
  }
}

async function loadOffer() {
  setStatus("Loading…");
  const res = await fetch("/api/admin/offer");
  if (!res.ok) throw new Error(`Load failed (${res.status})`);
  const data = await res.json();
  fillForm(data.offer);
  setStatus("Loaded.", "ok");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Saving…");

  const body = {
    enabled: document.getElementById("enabled").checked,
  };
  for (const name of fields) {
    const el = document.getElementById(name);
    body[name] = name === "discountPercent" ? Number(el.value || 0) : el.value;
  }

  try {
    const res = await fetch("/api/admin/offer", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Save failed (${res.status})`);
    const data = await res.json();
    fillForm(data.offer);
    setStatus(`Saved at ${data.offer.updatedAt}`, "ok");
  } catch (err) {
    setStatus(err.message || "Save failed", "err");
  }
});

loadOffer().catch((err) => setStatus(err.message || "Load failed", "err"));
