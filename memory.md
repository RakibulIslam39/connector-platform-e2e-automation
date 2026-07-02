# Project Memory — Connector Platform 2.0 E2E Automation
> Last updated: 2026-06-28 | Framework version: 1.1.0
> Reference this file at the start of every new chat to restore full project context.

---

## 1. Project Goals & Scope

**Primary Goal:** Build and maintain an enterprise-grade Playwright + JavaScript E2E automation framework for the Connector Platform 2.0 project.

**Scope:**
- Connector Platform 2.0 (WordPress plugin at `hoodslypartnersconnector3.kinsta.cloud`)
- HoodslyHub Order Management System
- WRHHub (fulfillment shop)
- WiksHub (fulfillment shop)
- Partner sites (WordPress/Shopify/Magento)
- REST API testing for Connector Platform APIs

**Test site under automation:** `https://rakbulqapart.s6-tastewp.com`

---

## 2. System Architecture

```
Partner Site (WP/Shopify/Magento)
    ↓ Plugin installed: Hoodsly Partners Connector
    ↓ API Keys configured
Connector Platform 2.0 (hoodslypartnersconnector3.kinsta.cloud)
    ↓ Product data sync (colors, SKUs, variants)
    ↓ Order forwarding (via API)
HoodslyHub (Order Management System)
    ↓ Routes orders to fulfillment shops
    ├── WRHHub (standard hoods, QSP)
    └── WiksHub (floating shelves via UPS; some hoods)
    ↓ Status sync back to partner sites
Partner Site ← Production / Finishing / Shipped status updates
```

**Key Systems:**
| System | Role | URL |
|--------|------|-----|
| Connector Platform 2.0 | Central product/partner data management | hoodslypartnersconnector3.kinsta.cloud |
| HoodslyHub | Order management, routing, BOL generation | hub.hoodsly.com |
| WRHHub | Fulfillment shop (standard hoods, Quick Ship) | wrhhub.hoodsly.com |
| WiksHub | Fulfillment shop (floating shelves + some hoods) | wikshub.hoodsly.com |
| Partner Site (QA) | Test partner WordPress/WooCommerce site | rakbulqapart.s6-tastewp.com |

---

## 3. API Configuration

| API | Endpoint | Auth |
|-----|----------|------|
| Products | `GET /wp-json/connector-platform/v1/products` | `api-signature` header |
| Attributes Mapping | `GET /wp-json/connector-platform/v1/attributes-mapping` | `api-signature` header |

**API Signature:** `0N611zTpYJ4DyZ907geVnf7jKaM3RXaufixLs819t0Ofx4grhsV9HTUXdKiyTYHe`
**API Base URL:** `https://hoodslypartnersconnector3.kinsta.cloud`

---

## 4. Business Workflows (from transcripts)

### 4.1 Partner Onboarding Flow
1. Install Hoodsly Partners Connector plugin on partner WordPress site
2. Generate API keys for the partner in Connector Platform
3. Create partner profile: name, type (B2B/B2C), SKU prefix, platform type, website URL
4. Configure color style (Select = B2B, Swatch = B2C)
5. Set up ventilation, trims, sizes, products availability
6. Configure partner-wise custom colors and pricing
7. Import products with terms and MAP policy acceptance
8. Configure B2B/B2C pricing logic
9. Set up SKU prefix for product identification
10. ⚠️ Partner name MUST match exactly in both Connector Platform and Hub API Settings (spaces/underscores cause sync failure)

### 4.2 Product Data Flow
- Products managed centrally in Connector Platform
- ACF Field Groups control: models, ventilation, molding, sizing modifications, order options
- Product images loaded directly from Connector Platform URLs (no separate storage on partner sites)
- Color options include: partner-specific names, custom pricing, swatch vs select display
- Connector vs Non-Connector products have different management workflows

### 4.3 Order Flow (End-to-End)
1. Customer places order on partner site (WordPress/Shopify/Magento)
2. Selected attributes → Short SKUs via attribute mapping
3. Order held on partner site for 24h (configurable)
   - Customer can cancel during hold period
   - Admin can "Instant Release" to skip hold
   - Orders with customer notes → auto-routed to Manual Placement
4. Order forwarded to HoodslyHub
5. HoodslyHub generates unique order ID (multi-item: orderId-1, orderId-2, etc.)
6. Hub routes order to WRHHub or WiksHub based on product category:
   - Standard hoods → WRHHub
   - Quick Ship (QSP) → WRHHub (One-In-One-Out inventory)
   - Floating Shelves → WiksHub (UPS, not RL; "Itself" product type)
7. RL Courier generates Shipping Label + BOL
   - Requires: valid US phone number, accurate email, shipper name
   - Failure → must correct details and regenerate from Hub
8. Status synced back to partner site:
   - Production → Finishing → Shipped
9. Tracking number auto-regenerated after address/phone edits

### 4.4 Status Sync Rules
- Partner Source Name in Hub Settings must EXACTLY match partner name in Connector Platform
- Caching delays after updating Source Names (may not reflect immediately)
- Status changes in WRHHub/WiksHub sync to partner sites
- Same update workflow for WordPress, Shopify, and Magento

### 4.5 SKU Generation Logic
- **Short SKU** = Master SKU + Attribute Short Codes (from attribute mapping)
- **Partner SKU** = SKU Prefix + Short SKU
- **Reduce Height logic** = Modifies height dimension in SKU by configured reduction amount
- Multi-item orders: baseOrderId-1, baseOrderId-2, etc.
- QSP (Quick Ship) products: One-In-One-Out inventory logic

### 4.6 Damage Claim Flow
1. Admin/CSM creates partner Hub role (restricted access)
2. Partner accesses Hub → views completed orders only
3. Partner clicks "File Damage Claim" from order ID
4. Uploads images + description
5. Submits → Admin email notification
6. Admin/CSM reviews → sets claim type (Overall Damage, etc.)
7. Confirms pickup week and exact pickup date via email
8. Marks claim as Completed

---

## 5. Environment Map

| Environment | Partner Site URL | Connector API | Hub URL |
|-------------|-----------------|---------------|---------|
| Local/Staging | rakbulqapart.s6-tastewp.com | hoodslypartnersconnector3.kinsta.cloud | TBD |
| Production | partner production URL | production Connector | hub.hoodsly.com |

**Environment files:** `environments/.env.local`, `.env.staging`, `.env.ci`
**Load order:** `ENV=local|staging|ci` → dotenv loads `environments/.env.{ENV}`

---

## 6. File Structure Reference

```
connector-platform2.0-e2e-automation/
├── playwright.config.js          Main config (multi-browser, reporters, env)
├── package.json                  Scripts, dependencies
├── .env.example                  Environment template
├── .gitignore                    Excludes secrets and artifacts
├── Dockerfile                    Docker test runner
├── docker-compose.yml            Docker service definitions
├── memory.md                     THIS FILE — project memory
├── .github/workflows/            CI/CD workflows
│   ├── e2e-ci.yml                Push/PR CI (install → lint → smoke → regression)
│   └── e2e-scheduled.yml         Nightly regression
├── environments/                 Environment .env files + validation schema
├── pages/                        Page Object Model classes
│   ├── base.page.js              BasePage — shared methods
│   ├── auth/login.page.js
│   ├── connector/                Connector Platform pages
│   ├── hoodsly-hub/              HoodslyHub pages
│   ├── wrh-hub/                  WRHHub pages
│   └── wiks-hub/                 WiksHub pages
├── tests/                        Test specs (mirror pages/ structure)
├── fixtures/index.js             Merged fixture — import { test, expect } from here
├── common/                       Reusable utilities
│   ├── api/                      API client, Connector API, Hub API
│   ├── auth/auth-manager.js      Session management
│   ├── actions/                  WP, WooCommerce, Form actions
│   └── utils/                    Logger, wait utils, retry, data utils
├── helpers/                      Domain-specific helpers (SKU, order, partner)
├── hooks/before-all.js           Global setup (auth state creation)
├── hooks/after-all.js            Global teardown (summary logging)
├── constants/                    URLs, API endpoints, selectors, tags
├── test-data/                    JSON test data (partners, products, orders, users)
├── json-data/                    API-derived configs (attribute-mapping, SKU, colors)
├── skills/                       Technical knowledge reference files
├── transcripts/                  Video transcript analysis and scenarios
│   ├── processed/                Raw transcript analysis (business-workflows.md, automation-scenarios.md)
│   └── scenarios/                Module-level scenario docs (00-index.md through 15-partner-site-plugin.md)
└── docs/                         Architecture, onboarding, test strategy
│
│ ── Partner Creation V2 additions (2026-06-28) ──────────────────────────────
├── common/runtime/runtime-state.js          Module-level singleton for cross-scenario data
├── common/utils/random-data-generator.js    Extended Faker generators (B2C price rule, pickRandom)
├── common/utils/notification-validator.js   Toast/popup assertion helpers
├── common/utils/wp-cli-service.js           WP-CLI SSH + REST API fallback for validation
├── pages/connector/partner-form.page.js     PartnerFormPage POM (all 6 form sections)
├── pages/partner-site/connector-settings.page.js  ConnectorSettingsPage POM
└── tests/connector/partner-creation-v2.spec.js    3-scenario serial spec (SC1→SC2→SC3)
```

---

## 7. Current Progress & Status

| Area | Status | Notes |
|------|--------|-------|
| Framework scaffold | ✅ Complete | package.json, dirs, configs |
| Playwright config | ✅ Complete | Multi-browser, reporters, auth |
| Environment setup | ✅ Complete | local/staging/ci envs |
| BasePage | ✅ Complete | All shared methods |
| Page objects | ✅ Complete | All 13 + 2 new V2 page classes |
| Common modules | ✅ Complete | API, auth, actions, utils |
| Fixtures | ✅ Complete | Merged test + expect + V2 fixtures |
| Constants | ✅ Complete | URLs, endpoints, tags, selectors |
| Helpers | ✅ Complete | SKU, order, partner, report |
| Test data / JSON | ✅ Complete | All JSON data files |
| Test specs (skeleton) | ✅ Complete | 11 spec files with tests |
| Global hooks | ✅ Complete | Setup/teardown |
| GitHub Actions CI | ✅ Complete | 2 workflow files |
| Docker | ✅ Complete | Dockerfile + docker-compose |
| ESLint + Prettier | ✅ Complete | With playwright plugin |
| Memory file | ✅ Complete | This file |
| Skills docs | ✅ Complete | 11 skill files |
| Transcripts processed | ✅ Complete | 9 videos analyzed |
| Scenario docs | ✅ Complete | 15 modules × scenario files in transcripts/scenarios/ |
| Docs | ✅ Complete | Architecture, README, etc. |
| **Partner Creation V2** | ✅ Complete | Full 3-scenario POM suite (partner-creation-v2.spec.js) |
| RuntimeState module | ✅ Complete | common/runtime/runtime-state.js |
| RandomDataGenerator | ✅ Complete | common/utils/random-data-generator.js |
| NotificationValidator | ✅ Complete | common/utils/notification-validator.js |
| WpCliService | ✅ Complete | common/utils/wp-cli-service.js (SSH + REST fallback) |
| PartnerFormPage POM | ✅ Complete | pages/connector/partner-form.page.js |
| ConnectorSettingsPage POM | ✅ Complete | pages/partner-site/connector-settings.page.js |

---

## 8. Automation Scenario Backlog

### Phase 1 — Smoke (Priority)
- [x] Connector Platform dashboard loads
- [x] Partners list page loads
- [x] Products list page loads
- [x] API health check (products endpoint)
- [x] API health check (attributes-mapping endpoint)
- [ ] WP Admin login flow
- [ ] Hub dashboard loads

### Phase 2 — Regression (Core Flows)
- [x] Full partner onboarding (create → configure → verify) — partner-creation-v2.spec.js
- [ ] Product import from Connector Platform
- [ ] Attribute mapping CRUD
- [ ] SKU generation end-to-end
- [ ] Partner color catalog management
- [ ] Full order flow: place order → hold → forward to Hub
- [ ] Order status sync: Hub → Partner site
- [ ] BOL generation (valid phone/email)
- [ ] BOL failure (invalid phone)
- [ ] Order with customer note → Manual Placement routing
- [ ] Instant Release workflow
- [ ] Floating Shelf order → WiksHub + UPS routing
- [ ] QSP order → WRHHub + One-In-One-Out
- [ ] Damage claim submission workflow
- [ ] Partner role creation and access restriction
- [ ] Estimated ship date update
- [ ] Tracking number regeneration

### Phase 3 — Extended
- [ ] Multi-item order with suffix ID generation
- [ ] Reduce height SKU logic
- [ ] B2B vs B2C pricing validation
- [ ] Partner Source Name sync failure/fix scenario
- [ ] Cross-platform: Shopify partner order flow
- [ ] Cross-platform: Magento partner order flow

---

## 9. Project Decisions & Standards

| Decision | Rationale |
|----------|-----------|
| JavaScript (not TypeScript) | Faster iteration, lower entry barrier for team |
| CommonJS (require/module.exports) | Consistent with WordPress plugin ecosystem |
| Page Object Model | Industry standard, maintainability, DRY |
| Single fixture entry point (fixtures/index.js) | One import for all fixtures in specs |
| Auth state persisted to disk | Avoid re-logging in for every test, speeds up suite |
| Environment-based .env files | Clear separation of local/staging/CI config |
| Tags with @ prefix | Consistent with Playwright grep pattern matching |
| loadTestData() / loadJsonConfig() | Centralized JSON data access, consistent path resolution |
| retryApiCall() wrapping | API flakiness handled transparently |
| winston logger | Structured logging, log levels, file output |
| test.describe.serial() for multi-scenario flows | Enforces sequential execution and allows module-level runtimeState sharing without file I/O |
| Module-level runtimeState singleton | Cross-scenario data (API key, partner name, selected attributes) shared in-memory across all three onboarding scenarios |
| connectorSettingsPage uses separate browser context | Partner site context isolated from Connector Hub admin session (different origin, different credentials) |
| WpCliService SSH + REST fallback | WP-CLI preferred for Scenario 3 attribute validation; REST API used when SSH is unavailable (SaaS/cloud envs) |
| expect.soft() in Scenario 3 | All attribute validations run to completion even if individual checks fail; failures aggregated in report |
| generateCustomPrice(minPrice) for B2C rule | Guarantees custom price >= current price at data-generation time, preventing form submission failures |

---

## 10. Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| Hub/WRH/Wiks URLs not confirmed | Use process.env.HUB_BASE_URL etc. — fill in .env files |
| WP admin selectors may vary by plugin version | Update selectors in constants/selectors.js or page objects |
| BOL generation needs valid US phone | Use generateUSPhone() from data-utils.js |
| Partner Source Name caching | Wait for cache invalidation or trigger status change |
| Auth state expires | Global setup regenerates state older than 12 hours |
| Floating shelf uses UPS not RL | Separate courier handling in order-helper.js |
