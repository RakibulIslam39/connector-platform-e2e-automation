# Module 09 — Full Order Flow (End-to-End)

> **Systems involved:** Partner Site → Connector Platform → HoodslyHub **Page
> Objects:** `partner-site-orders.page.js`, `partner-site-plugin.page.js`,
> `hub-dashboard.page.js`, `order-management.page.js` **Spec File:**
> `tests/e2e/full-order-flow.spec.js` (to be created) **Status:** Pending — most
> complex automation scenario

---

## Feature Overview

The complete order lifecycle spans four systems. Understanding each phase is
critical for automation:

### Phase 1: Customer Places Order on Partner Site

- Customer navigates to the partner site shop (e.g.,
  `rakbulqapart.s6-tastewp.com/shop`)
- Selects a product (e.g., "Curved" hood VEN-CCX)
- Chooses attributes: Size (e.g., 36×36), Color (e.g., Raw/Unfinished)
- Optionally adds modifiers (Crown Molding, Increase Depth, etc.)
- Adds to cart → proceeds to WooCommerce checkout
- Fills shipping address, valid US phone, email
- Submits order

### Phase 2: Attribute → SKU Conversion

- Partner site plugin converts selected attributes to Short SKUs via attribute
  mapping
- Master SKU assembled: `{Product}-{Size}-{Color}[-{Modifiers}]`
- Example: `VEN-CCX-3636-RAW`
- Order stored in WooCommerce with this SKU

### Phase 3: Order Hold Period (24 hours by default)

- Order sits on partner site for configured hold period
- During hold:
  - Customer can **cancel** the order
  - Admin can **Instant Release** to skip hold and forward immediately
  - Orders with customer notes → auto-routed to **Manual Placement** queue in
    Hub
- After hold period: order auto-forwarded to HoodslyHub

### Phase 4: HoodslyHub Receives Order

- Hub generates a unique order ID (e.g., `HUB-2024-001`)
- Multi-item orders get suffixed IDs: `HUB-2024-001-1`, `HUB-2024-001-2`
- Hub routes order to fulfillment shop:
  - Wood Hoods / Standard → **WRHHub**
  - Quick Ship Products (QSP) → **WRHHub** (one-in-one-out inventory)
  - Floating Shelves → **WiksHub** (UPS shipping, not RL)

### Phase 5: BOL Generation (Bill of Lading)

- RL Courier generates a Shipping Label + BOL
- Required: valid US phone, accurate email, shipper name
- If phone/email invalid → BOL generation fails → must correct details →
  regenerate

### Phase 6: Status Sync (Hub → Partner Site)

- WRHHub/WiksHub update order status: Production → Finishing → Shipped
- Hub syncs status back to partner site via Partner Source Name
- **Critical:** Partner Source Name in Hub Settings must EXACTLY match partner
  name in Connector Platform
- Status on partner site: `wc-production` → `wc-finishing` → `completed`

### Phase 7: Tracking

- Tracking number auto-generated after BOL
- If address/phone edited after BOL → tracking number regenerated

---

## Scenarios

### SCENARIO-09-01: Standard Wood Hood order — simple (no modifiers)

**Priority:** High (core E2E flow) **Pre-condition:** Partner site active;
partner has "Curved" product assigned **Test Data:**

```json
{
  "product": "Curved",
  "sku": "VEN-CCX",
  "size": "36\" x 36\"",
  "color": "Raw / Unfinished",
  "expectedMasterSku": "VEN-CCX-3636-RAW",
  "customer": {
    "name": "Test Customer",
    "address": "123 Main St, New York, NY 10001",
    "phone": "+1 (555) 123-4567",
    "email": "testcustomer@example.com"
  }
}
```

**Steps:**

1. Navigate to partner site shop
2. Open the "Curved" product
3. Select Size: 36×36
4. Select Color: Raw / Unfinished
5. Add to cart → checkout
6. Fill shipping details (valid US phone)
7. Submit order
8. Note the WooCommerce order ID
9. Go to WP Admin → WooCommerce Orders
10. Verify order status = "On Hold" (hold period active)
11. Verify Master SKU in order = `VEN-CCX-3636-RAW`

**Expected Result:** Order created with correct SKU in hold status

---

### SCENARIO-09-02: Order with customer note → Manual Placement routing

**Priority:** High **Steps:** (same as 09-01, but) 3b. Add a customer note:
"Please ship ASAP" ...continue through checkout 11. Navigate to HoodslyHub →
Manual Placement queue 12. Verify order appears in Manual Placement (not
auto-routed)

**Expected Result:** Customer note triggers manual placement routing **Business
Rule:** Any order with a customer note bypasses auto-routing

---

### SCENARIO-09-03: Instant Release (skip hold period)

**Priority:** High **Pre-condition:** An order is in "On Hold" status on partner
site **Steps:**

1. Go to WP Admin → WooCommerce Orders
2. Find the held order
3. Click "Instant Release" action
4. Verify order status changes from "On Hold" to processing/forwarded
5. Navigate to HoodslyHub → verify order appears

**Expected Result:** Order bypasses hold period and forwards immediately to Hub

---

### SCENARIO-09-04: Customer cancels order during hold period

**Priority:** Medium **Steps:**

1. Customer logs in to partner site → My Account → Orders
2. Find the held order
3. Click "Cancel Order"
4. Confirm cancellation
5. Verify order status = "Cancelled" in WooCommerce
6. Verify order does NOT appear in HoodslyHub

**Expected Result:** Cancelled orders are not forwarded to Hub

---

### SCENARIO-09-05: Wood Hood order routes to WRHHub

**Priority:** High **Pre-condition:** Order forwarded to HoodslyHub **Steps:**

1. Find the order in HoodslyHub
2. Verify fulfillment shop assignment = WRHHub
3. Navigate to WRHHub → verify order appears

**Expected Result:** Wood Hood orders are routed to WRHHub **Helper:**
`determineTargetShop("Wood Hoods")` returns `"wrh"`

---

### SCENARIO-09-06: Floating Shelf order routes to WiksHub (UPS)

**Priority:** High **Pre-condition:** Floating Shelf product available to
partner **Test Data:** Product category = "Floating Shelves" **Steps:**

1. Place order for a floating shelf product
2. Instant Release
3. Verify in HoodslyHub: fulfillment shop = WiksHub
4. Verify shipping method = UPS (not RL/Roadrunner)

**Expected Result:** Floating shelf orders use WiksHub + UPS **Note:** WiksHub
uses UPS courier, all others use RL Courier

---

### SCENARIO-09-07: Quick Ship (QSP) order routes to WRHHub with inventory check

**Priority:** High **Test Data:** Product with category containing "qsp" or
"quick" **Steps:**

1. Place QSP order
2. Forward to Hub
3. Verify WRHHub assignment
4. Verify one-in-one-out inventory logic is acknowledged in Hub

**Expected Result:** QSP orders handled with special inventory logic

---

### SCENARIO-09-08: BOL generation with valid US phone number

**Priority:** High **Pre-condition:** Order in HoodslyHub, routed to WRHHub
**Steps:**

1. Navigate to the order in HoodslyHub
2. Verify phone number is a valid US number (10 digits, US format)
3. Click "Generate BOL"
4. Wait for BOL to generate (may take a few seconds)
5. Verify BOL document is accessible
6. Verify tracking number appears in order

**Expected Result:** BOL generates successfully with valid phone

---

### SCENARIO-09-09: BOL generation fails with invalid phone number

**Priority:** High (negative test) **Steps:**

1. In HoodslyHub, find or create an order with an invalid phone (e.g.,
   "555-0000")
2. Attempt to generate BOL
3. Verify error message appears: "Invalid phone number" or similar
4. Correct the phone number to a valid US number
5. Regenerate BOL
6. Verify BOL generates successfully

**Expected Result:** Invalid phone is rejected; corrected phone allows BOL
generation **Helper:** `validateForBOL()` tests this logic at unit level

---

### SCENARIO-09-10: Status sync: Hub → Partner Site

**Priority:** High **Pre-condition:** Order exists in Hub; Partner Source Name
configured correctly **Steps:**

1. In WRHHub, update order status to "Production"
2. Wait for sync (or trigger manual sync)
3. On partner site WP Admin → WooCommerce Orders
4. Find the order → verify status = "In Production" (`wc-production`)
5. In WRHHub, update status to "Finishing"
6. Verify partner site status updates to "Finishing" (`wc-finishing`)
7. In WRHHub, update to "Shipped"
8. Verify partner site status = "Completed" (`completed`)

**Expected Result:** All three status transitions sync correctly to partner site

---

## Test Data Reference

```javascript
// From test-data/orders/order-scenarios.json
const woodHoodScenario = {
  product: 'VEN-CCX',
  size: '36x36',
  color: 'RAW',
  masterSku: 'VEN-CCX-3636-RAW',
  targetShop: 'wrh',
};

const floatingShelfScenario = {
  product: 'SHELF-001', // replace with actual floating shelf SKU
  size: '36x36',
  targetShop: 'wiks',
  courier: 'ups',
};
```

## MCP Codegen Notes

```bash
# Capture partner site order flow:
npx playwright codegen https://rakbulqapart.s6-tastewp.com/shop

# Capture HoodslyHub order view:
npx playwright codegen https://hub.hoodsly.com/wp-admin/edit.php?post_type=shop_order

# Capture WRHHub order update flow:
npx playwright codegen https://wrhhub.hoodsly.com/wp-admin/edit.php?post_type=shop_order
```

## Critical Business Rules for Tests

1. **Partner Source Name** in Hub Settings must EXACTLY match partner name in
   Connector Platform
2. **24-hour hold** is the default — tests should use Instant Release to avoid
   waiting
3. **Multi-item orders**: Hub creates `baseId-1`, `baseId-2`, etc. — test with
   2-item orders
4. **Floating Shelves**: MUST use UPS, not RL Courier — verify courier type in
   Hub
