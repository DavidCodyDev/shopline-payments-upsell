# Shopline 感谢页加购（thank-you upsell）

面向 SHOPLINE 的 **Node + TypeScript** 合作伙伴应用脚手架：在 **感谢页 / 订单状态页** 展示加购，并通过 **草稿订单（draft order）二次结账链接** 完成购买——**不是**同卡二次扣款。

参考 [shopify-payments-upsell](https://github.com/DavidCodyDev/shopify-payments-upsell)，按 SHOPLINE 公开文档能力改写（见项目 spike）。

> **未在未配置凭证时宣称线上 Admin API 已调通。** 无凭证时应用默认走 mock；有凭证且关闭 mock 后才会创建真实草稿订单。

## 这是什么（Path 2）

| 表面 | 作用 |
| --- | --- |
| 商家后台（`/admin`） | 配置一个加购商品、开关、CTA 文案 |
| API（`/api/offer`、`/api/checkout-link`） | 「是否展示？」+ 创建草稿订单结账 URL |
| 买家感谢页（`/thank-you`） | 本地预览加购 + CTA |
| Extension / ScriptTag 桩 | 后续真实店铺注入占位 |

**选定模型：** 感谢页 CTA → **新草稿订单 / 二次结账**。

**明确不在 v1 范围：**

- Checkout UI Customizer **支付前** `applyCheckoutLinesChange`
- 同支付方式 **支付后** 再扣款（公开 SHOPLINE API 未文档化）

## 本地运行

```bash
npm install
cp .env.example .env
npm run dev
```

打开：

- http://localhost:3000 — 入口
- http://localhost:3000/admin — 商家配置（**无需** Shopline 凭证）
- http://localhost:3000/thank-you — 买家预览
- http://localhost:3000/api/health — 健康检查 + mock 标志

生产式构建：

```bash
npm run build
npm start
```

### Mock 冒烟（默认）

需先在一个终端启动服务，再在另一个终端执行：

```bash
npm run dev
# 另开终端：
npm run smoke
```

脚本会：健康检查 → 本地保存 offer → `GET /api/offer` → `POST /api/checkout-link`，并断言返回 **mock** 结账 URL。

另可离线检查草稿订单请求体形状（无需服务 / 凭证）：

```bash
npm run check:payload
```

### 线上草稿订单冒烟（需凭证，勿在无密钥时宣称成功）

1. 在 `.env` 填入下方「线上必需」变量（**不要提交真实密钥**）。
2. 设置 `USE_MOCK_DRAFT_ORDER=false`。
3. `npm run dev`，在 `/admin` 用**真实** `productId` / `variantId` 启用加购。
4. `POST /api/checkout-link`（或感谢页点 CTA），期望响应 `mock: false` 且 `checkoutUrl` 为 Shopline `invoice_url`。
5. 若 Admin API 报错：检查 token 作用域（需 `write_draft_orders`）、handle、API 版本，并暂时保持 `USE_MOCK_DRAFT_ORDER=true`。

## 环境变量

| 变量 | 线上是否必需 | 说明 |
| --- | --- | --- |
| `PORT` | 否 | 服务端口（默认 `3000`） |
| `APP_URL` | 否 | 对外 base URL（链接 / ScriptTag 桩） |
| `SHOPLINE_APP_KEY` | OAuth 时需要 | 合作伙伴应用 App Key |
| `SHOPLINE_APP_SECRET` | OAuth 时需要 | 合作伙伴应用 App Secret |
| `SHOPLINE_STORE_HANDLE` | **是**（或改用 `SHOPLINE_API_BASE`） | `{handle}.myshopline.com` 前缀 |
| `SHOPLINE_ACCESS_TOKEN` | **是** | OAuth 或私有应用 Admin token |
| `SHOPLINE_API_BASE` | 否 | 可选，覆盖完整 Admin OpenAPI base（无尾斜杠） |
| `SHOPLINE_API_VERSION` | 否 | 默认 `v20260901`（与 handle 拼 URL 时） |
| `USE_MOCK_DRAFT_ORDER` | 否 | 强制 mock；**无凭证时始终 mock** |

详见 `.env.example`。鉴权：[应用授权](https://developer.shopline.com/docs/apps/api-instructions-for-use/app-authorization)。草稿订单：[创建草稿订单](https://developer.shopline.com/docs/admin-rest-api/order/draft-order/create-a-draft-order)。

### 向商家 / 开发者索取的凭证清单

要打通 **真实** Shopline Admin 草稿订单，请提供（通过安全渠道，勿贴进聊天）：

1. **`SHOPLINE_STORE_HANDLE`** — 店铺 handle（例如域名 `open001.myshopline.com` → `open001`）。
2. **`SHOPLINE_ACCESS_TOKEN`** — 带 `write_draft_orders`（及按需 `read_products`）的访问令牌。
   - **私有应用：** Admin → Apps → Develop Apps → API certificate 中的 token（约 3 年）。
   - **公开/定制应用：** OAuth 换取的 access token（约 10 小时，需 refresh）。
3. （可选，OAuth 后续）**`SHOPLINE_APP_KEY`** + **`SHOPLINE_APP_SECRET`**。
4. （可选）**`SHOPLINE_API_VERSION`** 或完整 **`SHOPLINE_API_BASE`**，若默认版本与店铺不一致。

无以上密钥时：本地 `/admin` 与 mock 结账路径仍可完整演示。

## 线上草稿订单接线说明

| 行为 | 条件 |
| --- | --- |
| **Mock（默认回退）** | 缺少 `SHOPLINE_ACCESS_TOKEN`，或缺少 handle/`SHOPLINE_API_BASE`，或 `USE_MOCK_DRAFT_ORDER=true` |
| **Live** | 已配置 token +（handle 或 `SHOPLINE_API_BASE`），且 `USE_MOCK_DRAFT_ORDER=false` |

实现要点（`src/shopline/`）：

- **Client**（`client.ts`）：`Authorization: Bearer …`，`Content-Type: application/json; charset=utf-8`；base = `SHOPLINE_API_BASE` 或 `https://{handle}.myshopline.com/admin/openapi/{version}`。
- **Create**（`draft-order.ts`）：`POST /orders/draft_orders.json`，`line_items` 含 `product_id`、`variant_id`、`quantity`、`product_source: "main_site"`；并带上文档要求的 `stock_reserved`、`calc_sku_stock_mode`、`language_info`、免费 `shipping_lines`（custom / price `0`）。若 offer 有折扣百分比，写入 `applied_discount`（percentage）。
- **结账 URL**：优先响应字段 `invoice_url`（其次 `checkout_url` / `order_status_url`）。
- **商家配置**：`/admin` + `data/offer.json` **不依赖** Shopline，可在无凭证环境使用。

## Stub vs 真实

| 模块 | 状态 |
| --- | --- |
| 商家配置 UI + JSON 文件存储 | **本地真实**（尚未嵌入 Shopline Admin / OAuth） |
| `GET /api/offer` 展示规则 | **本地真实**（启用 + 商品/变体；可排除列表） |
| `POST /api/checkout-link` | **默认 mock**；凭证齐且关闭 mock 时走 live |
| Shopline 创建草稿订单 | **已接线、凭证门控**；本环境无密钥时未做 live 验证 |
| Checkout UI Customizer | **仅桩**（需公开应用上架 + Enterprise） |
| ScriptTag 安装 | **仅桩**（`GET /api/script-tag-stub`） |
| 商品选择器 | **未做** — 手动粘贴 product/variant ID |
| OAuth 安装 / 会话存储 | **未做** |

## 目录结构

```
src/
  index.ts                 Express 入口
  config/env.ts            环境变量与 live/mock 门控
  offer/                   Offer 类型、文件存储、是否展示
  routes/admin.ts          商家配置 API
  routes/api.ts            公开 offer + checkout-link
  shopline/                Admin REST client + 草稿订单（live 门控）
  admin/public/            简易商家 HTML
  thank-you/
    public/                买家预览 + widget JS
    script-hook.ts         ScriptTag 注册桩
    extension-stub/        Checkout UI 感谢页点位桩
data/                      本地 offer.json（内容 gitignore）
scripts/smoke-mock.mjs     Mock 冒烟脚本
scripts/check-draft-payload.ts   离线请求体形状检查
```

## 与 Shopify 支付后加购的对照

| Shopify payments upsell | 本仓库 |
| --- | --- |
| `checkout_post_purchase` 支付后插页 | 感谢页 / 订单状态（预览页 + extension/ScriptTag 桩） |
| `POST /api/offer` + `ShouldRender` | `GET /api/offer` |
| JWT changeset + `applyChangeset`（同卡） | `POST /api/checkout-link` → 草稿订单 / 二次结账 |
| Accept 用原支付方式扣款 | 买家在新结账页再次付款 |
| 嵌入式 Polaris + App Bridge 选择器 | 简易 `/admin` HTML（手填 ID） |
| Prisma `UpsellOffer` | `data/offer.json` |

## 后续（不在本 PR 必做）

1. OAuth（公开/定制应用）或私有应用 token 会话化。
2. 用真实店铺核对 `invoice_url` 字段与最小必填 body。
3. Checkout UI Customizer `OrderStatus*` 或 ScriptTag（非 Enterprise / 私有应用路径）。
4. `GET .../products/products.json` 商品搜索 UI。
5. 事件日志（shown / accept / decline）。

## License

Private / 未授权脚手架，供合作伙伴方案探索。
