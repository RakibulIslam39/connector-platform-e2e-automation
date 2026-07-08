# Module 14 — WiksHub Fulfillment

> **URL:** `{WIKS_BASE_URL}/wp-admin/edit.php?post_type=shop_order` **Page
> Object:** `pages/wiks-hub/wiks-orders.page.js` (70 lines) **Spec File:**
> `tests/wiks-hub/wiks-order-flow.spec.js` **Status:** Skeleton exists —
> placeholder tests only

---

## Feature Overview

WiksHub is the fulfillment shop for **Floating Shelves**. It differs from WRHHub
in a critical way:

**Key Difference: UPS Courier (not RL/Roadrunner)**

- All WiksHub shipments use **UPS** instead of RL Courier
- This affects: shipping label generation, BOL format, tracking number source
- Floating shelves are a product type described as **"Itself"** (the product IS
  the shelf, no assembly)

**Product types routed to WiksHub:**

- Floating Shelves (product category)
- Some hoods (when manually reassigned)

**Same status flow as WRHHub:**

```
Received → Production → Finishing → Shipped
```

---

## Scenarios

### SCENARIO-14-01: WiksHub orders page loads

**Priority:** High (smoke) **Steps:**

1. Navigate to WiksHub admin (`{WIKS_BASE_URL}/wp-admin/`)
2. Log in with WiksHub credentials
3. Navigate to orders list
4. Verify orders table is visible

**Expected Result:** WiksHub orders page is accessible

---

### SCENARIO-14-02: Floating shelf orders appear in WiksHub

**Priority:** High **Pre-condition:** A floating shelf order was placed and
forwarded through Hub **Steps:**

1. Note the Hub order ID for a floating shelf product
2. Navigate to WiksHub orders
3. Search for the order
4. Verify it appears with correct product info

**Expected Result:** Floating shelf orders are present in WiksHub (not WRHHub)

---

### SCENARIO-14-03: Update floating shelf order status

**Priority:** High **Steps:**

1. Open a floating shelf order in WiksHub
2. Update status to "Production"
3. Verify status sync to Hub and partner site

**Expected Result:** Status change syncs through Hub to partner site (same as
WRH flow)

---

### SCENARIO-14-04: Shipping via UPS — verify shipping method

**Priority:** High **Steps:**

1. Open a floating shelf order in WiksHub
2. Find the shipping/courier section
3. Verify shipping method = UPS (not RL Roadrunner)
4. Verify UPS tracking number format (differs from RL)

**Expected Result:** WiksHub orders use UPS, not RL Courier

---

### SCENARIO-14-05: Partner Source Name consistency check

**Priority:** High (business rule) **Pre-condition:** A partner's orders are in
WiksHub **Steps:**

1. In WiksHub, find the partner name for an order
2. Cross-check: partner name in WiksHub = partner name in Hub = partner name in
   Connector Platform
3. If names don't match exactly (spaces vs underscores), verify sync is failing
4. After fixing name consistency: verify status updates propagate

**Expected Result:** Exact name match is required across all three systems for
sync to work

---

## MCP Codegen Notes

```bash
# Capture WiksHub order management:
npx playwright codegen https://wikshub.hoodsly.com/wp-admin/edit.php?post_type=shop_order

# Key elements:
# - Order table structure (may be simpler than WRHHub — 70 lines suggests less complexity)
# - Shipping method indicator (UPS vs RL)
# - Status update controls
# - Floating shelf product type indicator
```

## Known Complexities

- WiksHub is relatively simpler than WRHHub (page object is only 70 lines)
- UPS tracking number format is different from RL — don't use the same regex for
  both
- WIKS_BASE_URL must be set in environment variables
- "Itself" product type is the business term for floating shelves — may appear
  as metadata in orders
