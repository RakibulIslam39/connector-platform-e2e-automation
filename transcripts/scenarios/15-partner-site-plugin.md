# Module 15 — Partner Site Plugin

> **URL:** `{BASE_URL}` (partner site: `rakbulqapart.s6-tastewp.com`)
> **Page Objects:** `partner-site-plugin.page.js` (345 lines), `partner-site-orders.page.js` (132 lines)
> **Spec File:** `tests/partner-site/partner-site-plugin.spec.js` (to be created)
> **Status:** Pending

---

## Feature Overview

The partner site is a WordPress/WooCommerce store with the **Hoodsly Partners Connector** plugin installed. This plugin is what connects the partner store to the Connector Platform 2.0.

**Plugin capabilities (from partner site admin):**
- **Plugin Settings**: configure API key, Connector Platform URL, partner name
- **Product Import**: import products from Connector Platform into WooCommerce
- **Attribute Configuration**: set up product attributes (Size, Color, Modifiers)
- **Order Forwarding**: configure hold period, auto-forward settings
- **BOL Toggle**: enable/disable BOL generation from partner side
- **Import Terms**: import WooCommerce product attributes/terms from Connector Platform
- **MAP Policy**: accept MAP pricing policy before import

**Partner Site Frontend:**
- WooCommerce shop with Connector Platform products
- Product pages with attribute selectors (Size, Color, optional Modifiers)
- Cart + Checkout with WooCommerce flow
- My Account → Orders (for customer order tracking, cancellation)

**Partner Site Admin Backend:**
- WP Admin → WooCommerce Orders (for admin to manage orders, trigger Instant Release)
- WP Admin → Plugin Settings (API key, partner name, etc.)

---

## Scenarios

### SCENARIO-15-01: Hoodsly Partners Connector plugin is active
**Priority:** High (smoke)
**Steps:**
1. Log in to partner site WP Admin (`{BASE_URL}/wp-admin/`)
2. Navigate to Plugins page
3. Verify "Hoodsly Partners Connector" plugin is listed and active (not deactivated)

**Expected Result:** Plugin is active on partner site

---

### SCENARIO-15-02: Plugin settings page opens and shows API configuration
**Priority:** High
**Steps:**
1. Navigate to plugin settings page (WP Admin → Settings → Hoodsly Connector, or dedicated menu)
2. Verify: API Key field is present and has a value
3. Verify: Connector Platform URL is configured
4. Verify: Partner name matches what's in Connector Platform

**Expected Result:** Plugin settings are properly configured

---

### SCENARIO-15-03: Import products from Connector Platform
**Priority:** High
**Steps:**
1. Go to plugin settings / import section
2. Click "Import Products" button (or equivalent)
3. Accept MAP pricing policy (if prompted)
4. Wait for import to complete
5. Navigate to WooCommerce Products
6. Verify imported products appear (e.g., "Curved" VEN-CCX)

**Expected Result:** Products from Connector Platform are imported into WooCommerce

---

### SCENARIO-15-04: Product page shows correct attributes (Size, Color)
**Priority:** High
**Steps:**
1. Navigate to partner site shop (`{BASE_URL}/shop`)
2. Open the "Curved" product (VEN-CCX)
3. Verify Size dropdown/selector shows: 30×36, 36×36, 42×36
4. Verify Color selector shows partner's assigned colors

**Expected Result:** Product attributes match what's configured in Connector Platform for this partner

---

### SCENARIO-15-05: Place an order — validate SKU in WooCommerce
**Priority:** High (integration)
**Steps:**
1. Navigate to product page (e.g., "Curved")
2. Select Size: 36×36
3. Select Color: Raw / Unfinished
4. Add to cart → checkout
5. Fill: shipping address, US phone, email
6. Submit order
7. Note order ID
8. Go to WP Admin → WooCommerce Orders
9. Open the order → verify line item SKU = `VEN-CCX-3636-RAW`

**Expected Result:** Master SKU is correctly generated from selected attributes

---

### SCENARIO-15-06: Order with modifier — validate SKU includes modifier codes
**Priority:** High
**Steps:**
1. Open a product that supports Crown Molding modifier
2. Select Size + Color + Crown Molding option
3. Submit order
4. Verify order SKU includes `-CM` suffix (e.g., `VEN-VCX-3636-RAW-CM`)

**Expected Result:** Modifier selections append correct codes to Master SKU

---

### SCENARIO-15-07: Customer cancels order during hold period
**Priority:** Medium
**Pre-condition:** Order is in "On Hold" status (within hold period)
**Steps:**
1. Customer logs in to My Account → Orders
2. Find the held order
3. Click "Cancel Order"
4. Confirm the cancellation
5. Verify order status = "Cancelled"
6. Verify in WP Admin: order is not forwarded to Hub

**Expected Result:** Customer can cancel during hold; cancelled orders don't go to Hub

---

### SCENARIO-15-08: Admin uses Instant Release on partner site
**Priority:** High
**Pre-condition:** An order is in "On Hold" status
**Steps:**
1. Go to WP Admin → WooCommerce Orders
2. Find the held order
3. Use "Instant Release" bulk action or order-level action
4. Verify order is released immediately (status changes)
5. Verify order appears in HoodslyHub shortly after

**Expected Result:** Instant Release forwards order to Hub without waiting for hold period

---

## MCP Codegen Notes

```bash
# Capture partner site shop flow:
npx playwright codegen https://rakbulqapart.s6-tastewp.com/shop

# Capture plugin settings page (WP admin):
npx playwright codegen https://rakbulqapart.s6-tastewp.com/wp-admin/

# Key elements to capture:
# - Product page attribute selectors (Size dropdown, Color selector)
#   - Note: B2B uses Select (dropdown), B2C uses Swatch (visual tiles)
# - Modifier options display (Crown Molding, Increase Depth checkboxes)
# - Checkout form fields (phone, email, address)
# - WooCommerce order list "Instant Release" action selector
# - Plugin settings page URL and field selectors
# - "Import Products" button location
```

## Known Complexities
- B2B partners use `Select` (dropdown) for colors; B2C uses `Swatch` (tile grid) — different selectors
- Plugin settings page URL may vary — could be under Settings → Hoodsly or a top-level menu item
- MAP policy acceptance is a one-time step — may show a checkbox/modal only on first import
- Product import may be slow (network-intensive) — set extended timeout for import completion
- Hold period makes E2E tests slow — always use Instant Release in automation
- The partner site (`rakbulqapart.s6-tastewp.com`) is on staging/TasteWP — may have uptime limitations

## Integration Test Note
The partner site is the "entry point" for the full E2E flow. Scenarios 15-05 through 15-08 are the starting steps of the full order flow described in Module 09 (`09-order-flow-e2e.md`). Those modules should be tested together in the E2E spec.
