import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./config/env.js";
import { createAdminRouter } from "./routes/admin.js";
import { createApiRouter } from "./routes/api.js";
import { buildScriptTagPayload } from "./thank-you/script-hook.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();
const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Shopline thank-you upsell</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
a{color:#0f766e}</style></head>
<body>
  <h1>Shopline thank-you upsell</h1>
  <p>Path 2 scaffold: thank-you CTA → second checkout / draft order.</p>
  <ul>
    <li><a href="/admin">Merchant admin (stub)</a></li>
    <li><a href="/thank-you">Buyer thank-you preview</a></li>
    <li><a href="/api/health">API health</a></li>
  </ul>
  <p><small>Mock draft orders: <strong>${config.useMockDraftOrder || !config.hasLiveCredentials}</strong>
  · Live credentials configured: <strong>${config.hasLiveCredentials}</strong></small></p>
</body></html>`);
});

app.use(createAdminRouter());
app.use(createApiRouter(config));

const adminPublic = join(__dirname, "admin/public");
const thankYouPublic = join(__dirname, "thank-you/public");

app.get(["/admin", "/admin/"], (_req, res) => {
  res.sendFile(join(adminPublic, "index.html"));
});
app.use("/admin", express.static(adminPublic, { index: false, redirect: false }));

app.get("/thank-you/mock-checkout", (_req, res) => {
  res.sendFile(join(thankYouPublic, "mock-checkout.html"));
});
app.get(["/thank-you", "/thank-you/"], (_req, res) => {
  res.sendFile(join(thankYouPublic, "index.html"));
});
app.use(
  "/thank-you",
  express.static(thankYouPublic, { index: false, redirect: false }),
);

/** Debug helper: shows the ScriptTag payload we would register (not installed). */
app.get("/api/script-tag-stub", (_req, res) => {
  res.json({
    stub: true,
    payload: buildScriptTagPayload(config.appUrl),
  });
});

app.listen(config.port, () => {
  console.log(`Shopline thank-you upsell listening on ${config.appUrl} (port ${config.port})`);
  console.log(
    `Mode: ${config.useMockDraftOrder || !config.hasLiveCredentials ? "stub/mock draft orders" : "live draft-order API"}`,
  );
});
