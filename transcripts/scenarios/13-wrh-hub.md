# Module 13 — WRHHub Fulfillment

> **URL:** `{WRH_BASE_URL}/wp-admin/edit.php?post_type=shop_order`
> **Page Object:** `pages/wrh-hub/wrh-orders.page.js` (247 lines)
> **Spec File:** `tests/wrh-hub/wrh-order-flow.spec.js`
> **Status:** Skeleton exists — placeholder tests only

---

## Feature Overview

WRHHub is the primary fulfillment shop for:
- **Standard Wood Hoods** (all styles: curved, angled, sloped, etc.)
- **Quick Ship Products (QSP)** — one-in-one-out inventory model

WRHHub is built on WooCommerce but has custom order management extensions for the Hoodsly workflow. Key capabilities:

- **Order list** with status and partner filtering
- **Status updates**: Production → Finishing → Shipped
- **BOL/shipping label** management
- **Tracking number** generation and display
- **Inventory tracking** for QSP (one-in-one-out)
- **Address/contact editing** with tracking number regeneration

**Order Status Flow in WRH:**
```
Received (from Hub) → Production → Finishing → Shipped
                 ↘ Cancelled
```

---

## Scenarios

### SCENARIO-13-01: WRHHub orders page loads
**Priority:** High (smoke)
**Steps:**
1. Navigate to WRHHub admin (`{WRH_BASE_URL}/wp-admin/`)
2. Log in with WRH credentials
3. Navigate to orders list
4. Verify orders table is visible

**Expected Result:** WRHHub orders page is accessible

---

### SCENARIO-13-02: Orders routed from HoodslyHub appear in WRHHub
**Priority:** High
**Pre-condition:** An order was placed and routed to WRH in the E2E flow
**Steps:**
1. Note the Hub order ID
2. Navigate to WRHHub orders
3. Search for the order ID
4. Verify order appears with correct product/SKU info

**Expected Result:** Order from Hub is visible in WRHHub

---

### SCENARIO-13-03: Update order status to Production in WRHHub
**Priority:** High
**Steps:**
1. Open an order in WRHHub
2. Change status from "Received" to "Production"
3. Save
4. Verify status updated in WRHHub
5. Verify status synced to HoodslyHub (Production)
6. Verify partner site order status changed to `wc-production`

**Expected Result:** Status change cascades through Hub to partner site

---

### SCENARIO-13-04: Update order status to Shipped and add tracking
**Priority:** High
**Steps:**
1. Set order to "Shipped" in WRHHub
2. Verify tracking number is auto-generated or can be entered
3. Save
4. Verify tracking appears on partner site order detail

**Expected Result:** Shipped status + tracking number syncs to partner site

---

### SCENARIO-13-05: Edit shipping address and verify tracking regeneration
**Priority:** Medium
**Steps:**
1. Open an order in WRHHub
2. Find "Edit Address" section
3. Change the shipping address
4. Save
5. Verify tracking number is regenerated (new tracking number)
6. Verify BOL reflects updated address

**Expected Result:** Address edit triggers tracking number regeneration

---

### SCENARIO-13-06: Edit phone number and verify BOL regeneration
**Priority:** Medium
**Steps:**
1. Open an order in WRHHub
2. Edit the customer phone number to a valid US number
3. Save
4. Trigger BOL regeneration
5. Verify new BOL is generated with updated phone

**Expected Result:** Phone edit requires and enables BOL regeneration

---

### SCENARIO-13-07: QSP order one-in-one-out inventory (if visible)
**Priority:** Medium
**Steps:**
1. Find a QSP order in WRHHub
2. Verify it's marked or labeled as Quick Ship
3. If inventory display exists: verify QSP inventory count decrements on order receipt
4. Verify inventory count increments when QSP order is shipped (one-in-one-out)

**Expected Result:** QSP inventory logic is tracked correctly

---

## MCP Codegen Notes

```bash
# Capture WRHHub order management:
npx playwright codegen https://wrhhub.hoodsly.com/wp-admin/edit.php?post_type=shop_order

# Key elements:
# - Order table columns (may include custom WRH columns)
# - Status update dropdown/buttons
# - BOL/tracking section in order detail
# - Address edit form
# - QSP indicator/badge
```

## Known Complexities
- WRH_BASE_URL needs to be configured in `.env` files
- WRHHub may share WooCommerce order structure with Hub — verify admin user credentials separately
- Status sync latency: after updating WRH → Hub → partner site, there may be a delay (use `page.waitForResponse` or polling)
- Tracking number regeneration timing — may require an additional API call to RL Courier
