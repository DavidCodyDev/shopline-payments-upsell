import express from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, shouldUseLiveDraftOrder } from "./config/env.js";
import { createAdminRouter } from "./routes/admin.js";
import { createApiRouter } from "./routes/api.js";
import { buildScriptTagPayload } from "./thank-you/script-hook.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const config = loadConfig();
const liveDraft = shouldUseLiveDraftOrder(config);
const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.type("html").send(`<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/><title>Shopline 感谢页加购</title>
<style>body{font-family:system-ui,sans-serif;max-width:40rem;margin:2rem auto;padding:0 1rem;line-height:1.5}
a{color:#0f766e}</style></head>
<body>
  <h1>Shopline 感谢页加购</h1>
  <p>Path 2：感谢页 CTA → 二次结账 / 草稿订单（draft order）。</p>
  <ul>
    <li><a href="/admin">商家后台（本地）</a></li>
    <li><a href="/thank-you">买家感谢页预览</a></li>
    <li><a href="/api/health">API 健康检查</a></li>
  </ul>
  <p><small>Mock 草稿订单: <strong>${!liveDraft}</strong>
  · 已配置线上凭证: <strong>${config.hasLiveCredentials}</strong></small></p>
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
    `Mode: ${liveDraft ? "live draft-order API" : "stub/mock draft orders"}`,
  );
});
