# Module 11 — Hub Manual Order Placement

> **URL:** `{HUB_BASE_URL}/wp-admin/admin.php?page=manual-placement`
> **Page Object:** `pages/hoodsly-hub/order-placement.page.js` (367 lines)
> **Spec File:** `tests/hoodsly-hub/order-placement.spec.js`
> **Status:** Skeleton exists — needs real UI automation

---

## Feature Overview

Manual Placement is a Hub-specific workflow for orders that cannot be auto-routed. Orders land here when:
1. The original order had a **customer note** attached
2. The order requires **manual review** (exception handling)
3. An admin chooses to **manually route** an order

**Manual Placement Interface:**
- Lists all orders pending manual placement
- Shows order details: customer, product, SKU, partner
- Admin selects target shop (WRH or Wiks)
- Admin fills placement form: warehouse, product details, shipping info
- Submits to create the placement

**Key Fields in Placement Form:**
- Order ID (pre-filled from Hub)
- Partner name
- Product details (Master SKU, quantity)
- Warehouse destination
- Special instructions
- Shipping method

---

## Scenarios

### SCENARIO-11-01: Manual Placement page loads
**Priority:** High (smoke)
**Steps:**
1. Navigate to `{HUB_BASE_URL}/wp-admin/admin.php?page=manual-placement`
2. Verify page renders with manual placement queue or form
3. Verify column headers or form sections are visible

**Expected Result:** Manual Placement page loads without errors

---

### SCENARIO-11-02: Order with customer note appears in Manual Placement queue
**Priority:** High (business rule)
**Pre-condition:** Order placed on partner site with a customer note
**Steps:**
1. Place an order on partner site with note: "Please expedite shipping"
2. Release the hold (Instant Release)
3. Navigate to HoodslyHub → Manual Placement
4. Verify the order appears in the manual placement queue
5. Verify the customer note is visible in the order details

**Expected Result:** Customer note orders bypass auto-routing and appear in manual queue

---

### SCENARIO-11-03: Place order manually for WRHHub
**Priority:** High
**Pre-condition:** An order is in the Manual Placement queue
**Steps:**
1. Find the order in manual placement queue
2. Click to open the placement form
3. Select target: "WRHHub"
4. Fill warehouse details
5. Submit the placement
6. Verify order appears in WRHHub

**Expected Result:** Manually placed order reaches WRHHub

---

### SCENARIO-11-04: Place order manually for WiksHub (Floating Shelf)
**Priority:** High
**Pre-condition:** A floating shelf order is in manual placement
**Steps:**
1. Find floating shelf order in queue
2. Select target: "WiksHub"
3. Select shipping method: "UPS"
4. Submit placement
5. Verify order appears in WiksHub

**Expected Result:** Floating shelf orders can be manually placed in WiksHub with UPS

---

### SCENARIO-11-05: Manual Placement form validation
**Priority:** Medium (negative test)
**Steps:**
1. Open manual placement form
2. Submit without filling required fields
3. Verify validation errors appear for each required field

**Expected Result:** Form validation prevents empty submission

---

### SCENARIO-11-06: Partner Hub Role — restricted access to Manual Placement
**Priority:** Medium
**Pre-condition:** A user with "Partner Hub" role exists
**Steps:**
1. Log in to Hub as the partner hub user
2. Navigate to Manual Placement
3. Verify: partner can only see their own orders (not other partners' orders)
4. Verify: partner cannot place orders (view-only or restricted actions)

**Expected Result:** Partner role limits access appropriately

---

## MCP Codegen Notes

```bash
# Capture manual placement selectors:
npx playwright codegen https://hub.hoodsly.com/wp-admin/admin.php?page=manual-placement

# Key elements:
# - Manual placement queue table structure
# - Order row click → form open
# - Shop selector (WRH vs Wiks)
# - Warehouse field
# - Shipping method dropdown
# - Submit button
# - Success/error indicators
```

## Known Complexities
- Manual Placement page structure may differ significantly from standard WooCommerce pages
- The 367-line page object suggests a complex form — verify all field selectors with codegen
- Partner role (restricted Hub access) requires a separate test user with that role
