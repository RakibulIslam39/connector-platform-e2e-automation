# Migration Memory — Connector Platform 1.0 → 2.0 Automation

> This file tracks every important decision, discovery, and code change made
> during the migration analysis sessions. Read this first when picking up the
> work again.

---

## 1. Project Overview

| Item | Value |
|---|---|
| **Framework** | Playwright + JavaScript (Page Object Model) |
| **Live site** | `https://hoodslypartnersconnector3.kinsta.cloud` |
| **WP Admin user** | `admin` (see `.env.local` / `.env.staging`) |
| **1.0 source** | `C:\Users\User\Downloads\connector-e2e-automation-main` (Python + pytest-bdd) |
| **2.0 workspace** | `d:\Rakibul Islam\Hypemill\connector-platform2.0-e2e-automation` |

---

## 2. Most Important Discovery — Connector Hub SPA

**The single biggest finding of the entire migration review:**

Connector Platform 2.0 does **NOT** use the native WordPress CPT editor for
Partners or Products. Instead, everything is managed inside a modern
**Vue/React Single Page Application** (SPA) embedded at:

```
/wp-admin/admin.php?page=connector-hub
```

Hash-router routes:

| Purpose | URL |
|---|---|
| Partners list | `#/partners` |
| Create partner | `#/partners?action=add` |
| Edit partner | `#/partners?action=edit&id=<id>` |
| Products list | `#/products` |
| Edit product | `#/products?action=edit&id=<id>` |
| Attributes | `#/attributes` |
| Settings | `#/settings` |
| Logs | `#/logs` |

The WordPress admin menu also has standalone **Partners** and **Products** CPT
list pages (`edit.php?post_type=partner`, `edit.php?post_type=product`) but
these are **not used for automation**. All test automation targets the SPA.

> **Why this matters:** All previous code that targeted `#title`, `#acf-field_...`,
> `li[title='...']` (Select2), `#the-list tr`, `span.edit a`, etc. was
> completely wrong. Those selectors only exist in the native WP admin post
> editor — which is bypassed entirely by the SPA.

---

## 3. Partner Edit Form — SPA Structure

The SPA partner edit form (`#/partners?action=edit&id=<id>`) has **4 tabs**:

### Tab 1 — Basic Info
| Field | Selector / Role |
|---|---|
| Partner Name | `input[placeholder="Enter partner name"]` |
| Partner Colors Style | `role=radio` — "Select" or "Swatch" |
| Partner Type | `role=radio` — "B2B" or "B2C" |
| SKU Prefix | `input[placeholder="e.g., HS-"]` |
| Website URL | `input[placeholder="https://example.com"]` |
| Platform Type | `<select>` with options WordPress / Magento / Shopify |
| API Key | `input[placeholder="API key will be auto-generated"]` |
| Generate (API Key) | `button:has-text("Generate")` |
| Status | `<select>` with options Draft / Active / Inactive |
| Environment | `<select>` with options Staging / Production |
| Update Partner | `button:has-text("Update Partner")` |

> Note: The "Generate" API Key button **IS present** in the SPA. It was
> missing from the native WP admin ACF view, causing confusion earlier.

### Tab 2 — Products
- Shows a table of assigned products (image + name/SKU + custom title + remove button)
- `button:has-text("Add Products")` → opens a modal to add products
- Each product row has a remove button (last `<button>` in the row)

### Tab 3 — Attributes
Four accordion sections, each expandable by clicking the label:

| Section | What it controls |
|---|---|
| `text=Partner Colors` | Colors the partner can offer (checkbox per color + custom name + custom price) |
| `text=Partner Ventilations` | Ventilation options (checkbox per option) |
| `text=Partner Trims` | Trim options |
| `text=Partner Sizes` | Size options |

Each accordion has a "Select All" checkbox and a "Filter by Catalog" combobox.
Individual items are checkboxes inside a `<table>`.

### Tab 4 — FAQs & Shipping
Not yet automated (no 1.0 equivalent mapped).

---

## 4. Product Edit Form — SPA Structure

The SPA product edit form (`#/products?action=edit&id=<id>`) has **3 tabs**:

### Tab 1 — Basic Info
| Field | Selector |
|---|---|
| Product Title | `input[placeholder="Enter product title"]` |
| Product SKU | `input[placeholder="e.g., VEN-001"]` |
| Status | `<select>` with Draft / Active / Inactive |
| Description | TinyMCE editor (Visual/Code toggle + iframe) |
| Dimensions | Second TinyMCE editor |
| Category | `<select>` with "Select a category" |
| Product Images | `button:has-text("Add Images")` |
| Update Product | `button:has-text("Update Product")` |

### Tab 2 — Attributes
(Not yet fully analyzed — to be done when Attribute management tests are built)

### Tab 3 — Partners
- Checkbox per partner to enable/disable product access
- Each row also has: Custom Title textbox, Custom SKU textbox, Price Override table
- To assign a partner: check its checkbox and click "Update Product"
- To remove: uncheck and save

---

## 5. Partner List — SPA Structure (`#/partners`)

- Search box: `input[placeholder="Search partners..."]`
- Platform filter: `<select>` with All Platforms / WordPress / Magento / Shopify
- Status filter: `<select>` with All Status / Draft / Active / Inactive / Trash
- Partner table columns: Partner (name + URL) | Platform | Products | Environment | Status | Actions
- Actions per row: `a:has-text("Edit")` | `button:has-text("Duplicate")` | `button:has-text("Move to Trash")`
- "Add Partner" button: `a[href*="action=add"]`

---

## 6. Product List — SPA Structure (`#/products`)

- Search box: `input[placeholder="Search products..."]`
- Partner filter: `<select>` with All Partners + each partner name
- Status filter: `<select>` with All Status / Active / Draft / Inactive / Trash
- Product table columns: Product (name + SKU) | Category | Status | Actions
- Actions per row: `a:has-text("Edit")` | `button:has-text("Duplicate")` | `button:has-text("Move to Trash")`

---

## 7. Files Changed — What and Why

### `constants/selectors.js`
**Changed:** Complete rewrite (twice — first pass used wrong ACF selectors; final pass uses SPA selectors)

**Current state:** SPA-based placeholder/role selectors. No more `#acf-field_*` IDs.

---

### `pages/connector/partner-creation.page.js`
**Changed:** Complete rewrite for SPA

Key method changes vs old code:

| Old method | New behaviour |
|---|---|
| `navigateToPartners()` | Navigates to `#/partners`, waits for SPA search box |
| `searchPartner(name)` | Types in SPA search box (real-time filter, no Enter needed) |
| `hoverOnPartner()` | No-op (hover not needed in SPA table) |
| `clickEditButton(name)` | Delegates to `clickEditForPartner(name)` |
| `editPartner(name)` | `gotoPartnersList` → `searchPartner` → click Edit link in row |
| `selectProducts([])` | Opens Products tab → "Add Products" modal |
| `deselectProducts([])` | Opens Products tab → clicks remove button per product row |
| `selectColors([])` | Opens Attributes tab → expands "Partner Colors" accordion → checks checkboxes |
| `removeColors([])` | Same accordion, unchecks checkboxes |
| `selectVentilations([])` | Attributes tab → "Partner Ventilations" accordion |
| `selectTrims([])` | Attributes tab → "Partner Trims" accordion |
| `selectSizes([])` | Attributes tab → "Partner Sizes" accordion |
| `updateSkuPrefix(p)` | Basic Info tab → fills `input[placeholder="e.g., HS-"]` |
| `selectStagingEnvironment()` | Selects "Staging" from Environment `<select>` (was radio button) |
| `selectProductionEnvironment()` | Selects "Production" from Environment `<select>` |
| `generateApiKey()` | Clicks "Generate" button (now works — button exists in SPA) |
| `_openSelect2()` | **Removed** — SPA doesn't use Select2 |
| `_select2AddTag()` | **Removed** |
| `_select2RemoveTag()` | **Removed** |
| `configureDiscount()` | Stub — not yet located in SPA |
| `configureVentilation()` | Stub — not yet located in SPA |

---

### `pages/connector/product-management.page.js`
**Changed:** Complete rewrite for SPA

Key method changes:

| Old method | New behaviour |
|---|---|
| `goto()` | Navigates to `#/products`, waits for SPA search box |
| `searchProduct(name)` | Types in SPA search box (real-time filter) |
| `hoverProduct()` | No-op |
| `clickEditButton(name)` | Delegates to `clickEditForProduct(name)` |
| `editProduct(name)` | `searchProduct` → click Edit link in row |
| `assignPartnerToProduct(p, n)` | Partners tab → check partner checkbox |
| `removePartnerFromProduct(p, n)` | Partners tab → uncheck partner checkbox |
| `updateProductDescription(p, d)` | TinyMCE iframe (3 fallback strategies) |
| `filterByConnectorType()` | Stub — WP admin filter, not in SPA |
| `getProductSyncStatus()` | Stub — not in SPA |

---

### `tests/connector/partner-creation.spec.js`
**Changed:** URL assertion fixed
- `toHaveURL(/connector-partners/)` → `toHaveURL(/connector-hub/)`

---

### `tests/connector/partner-management.spec.js`
**Changed:** Full rewrite
- URL assertions: `/post_type=partner/` → `/connector-hub/`
- Test descriptions updated (removed "Select2", "ACF" references)
- Method calls aligned to new page object (e.g. `clickEditForProduct` instead of `hoverProduct` + `clickEditButton`)
- Ventilation/trim test data now falls back to known attribute names if not in JSON

---

### `tests/connector/product-management.spec.js`
**Changed:** URL assertions and broken method calls fixed
- `/connector-products/` → `/connector-hub/`
- Removed broken `importProducts()` call (method doesn't exist in new page object)
- `searchProduct` test now uses `isProductVisible()` instead of URL check

---

## 8. Files Created This Session

| File | Purpose |
|---|---|
| `tests/connector/partner-management.spec.js` | Migrated 1.0 partner_page.feature + products.feature scenarios |
| `tests/hoodsly-hub/connector-order-search.spec.js` | Migrated 1.0 HoodslyHub order search, SKU/BOL, shop assignment |
| `tests/wrh-hub/wrh-order-status-update.spec.js` | Migrated 1.0 WilkesHub order status update flow |

---

## 9. HoodslyHub — Key Page Object Updates

### `pages/hoodsly-hub/order-management.page.js`
New methods added for 1.0 migration:
- `clickHoodslyConnector()` — clicks the Hoodsly Connector link in the sidebar
- `openConnectorSearch()` — navigates to the search tab
- `inputOrderNumber(id)` — fills the order search field
- `searchOrderNumber(id)` — full search flow with wait-for-result logic
- `clickOrderNumber(id)` — clicks the order in search results
- `getGeneratedSkuValue()` — extracts the generated SKU text from order details
- `isBolGenerated()` — checks if BOL has been created
- `getRlTrackingNumber()` — extracts R+L carrier tracking number
- `getShopAssignmentState()` — reads current shop assignment text
- `clickReassignShopLink()` — clicks "Reassign Shop" link
- `selectShop(name)` — selects a shop from the assignment dropdown
- `clickReassignSubmitButton()` — submits shop reassignment
- `getOrderStatusText()` — reads order status label
- `waitForShopAssignment()` — waits for successful assignment

### `pages/hoodsly-hub/order-placement.page.js`
New methods added mirroring order-management for Manual Placement flows.

### `pages/wrh-hub/wrh-orders.page.js`
New methods added for WilkesHub order status update:
- `clickSearchIcon()` — opens the search overlay
- `inputOrderIdWithKeyboard(id)` — types order ID using keyboard events
- `searchOrderInResult(id)` — waits for order to appear in results
- `clickOrderFromSearchResult(id)` — clicks the order link
- `clickSelectOrderStatusButton()` — clicks status change button
- `selectOrderStatusByClicking(status)` — picks the new status
- `isSuccessMessageVisible(status)` — checks for success confirmation
- `clickOkButtonIfVisible()` — dismisses OK dialog

---

## 10. Test Data

### `test-data/partners/partner-profiles.json`
Added sections:
```json
"partnerManagement": {
  "existingPartner": "Automation_Partner",
  "addProducts": ["VEN-DBC", "VEN-BSH"],
  "removeProducts": ["VEN-DBC"],
  "addColors": ["Raw / Unfinished"],
  "removeColors": ["Raw / Unfinished"],
  "skuPrefix": "Auto",
  "searchPartner": "Automation_Partner"
},
"productManagement": {
  "existingProduct": "VEN-DBC (Double Curved)",
  "addPartner": "Automation_Partner",
  "removePartner": "Automation_Partner"
}
```

### `.env.example` — new optional variables
```
ORDER_WITH_BOL=           # order number with known BOL + R+L tracking
ORDER_FOR_SHOP_ASSIGN=    # order number to use in shop reassignment tests
TARGET_SHOP_NAME=Wilkes   # shop to assign in reassignment tests
WRH_TEST_ORDER_ID=        # order ID for WRH Hub status update tests
WRH_NEW_ORDER_STATUS=In Production
```

---

## 11. Known Stubs / TODO Items

| Method | File | Status |
|---|---|---|
| `configureDiscount()` | partner-creation.page.js | Stub — SPA location not yet found |
| `configureVentilation()` | partner-creation.page.js | Stub — SPA location not yet found |
| `filterByConnectorType()` | product-management.page.js | Stub — not in SPA |
| `getProductSyncStatus()` | product-management.page.js | Stub — not in SPA |
| Partner Site checkout flow | (not yet created) | Full WooCommerce checkout page object not built yet |
| FAQs & Shipping tab | partner-creation.page.js | Tab discovered but not automated |
| Product Attributes tab | product-management.page.js | Tab discovered but not fully analyzed |

---

## 12. What Was NOT Migrated (Intentionally Skipped)

| 1.0 Feature | Reason skipped |
|---|---|
| `master_sku_generation.py` | Pure data/utility service — 2.0 SKU generation is API-driven (`tests/connector/sku-generation.spec.js` already exists) |
| `wordpress_partner_dynamic_config_page.py` | Frontend partner site product configurator — complex dynamic attributes; no 2.0 equivalent test yet |
| `wordpress_partner_place_order_page.py` | Full WooCommerce checkout flow — needs `partner-site-checkout.page.js` (not yet built) |
| WilkesHub login page | 2.0 uses shared auth fixture; WilkesHub has its own credential vars |

---

## 13. Automation Test Run Commands

```bash
# Run all tests
npm test

# Run only Connector Hub (partners + products)
npm run test:connector

# Run new partner management tests
npm run test:partner-mgmt

# Run HoodslyHub connector order search tests
npm run test:connector-search

# Run WRH Hub order status update tests
npm run test:wrh-status

# Run with headed browser (for debugging)
npm run test:headed

# Run with Playwright UI (interactive)
npm run test:ui
```

---

## 14. Session History

| Session | Key Work Done |
|---|---|
| Session 1 | Generated migration analysis prompt |
| Session 2 | Implemented initial migration plan — created base page objects, specs, test data |
| Session 3 (current) | Full code review; discovered SPA vs native WP admin discrepancy; rewrote partner-creation.page.js, product-management.page.js, selectors.js; fixed all URL assertions; created 3 new spec files; updated wrh-orders.page.js, order-management.page.js, order-placement.page.js |
