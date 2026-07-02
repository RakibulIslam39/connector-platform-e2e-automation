# Module 10 — HoodslyHub Order Management

> **URL:** `{HUB_BASE_URL}/wp-admin/edit.php?post_type=shop_order`
> **Page Object:** `pages/hoodsly-hub/order-management.page.js` (543 lines)
> **Spec File:** `tests/hoodsly-hub/order-management.spec.js`
> **Status:** Skeleton exists — needs real UI automation

---

## Feature Overview

HoodslyHub is the central Order Management System. It receives orders forwarded from partner sites and routes them to fulfillment shops. The order management interface is the most feature-rich page in the Hub.

**Key Capabilities:**
- **Order list** with filtering by status, partner, date range
- **Search orders** by order ID, partner name, customer name
- **Order detail view**: full order info, line items, SKUs, shipping address
- **Shop assignment**: manually reassign order to WRH or Wiks
- **BOL generation**: generate Bill of Lading via RL Courier
- **Status update**: change order status (Production / Finishing / Shipped / Cancelled)
- **Estimated ship date**: set/update projected shipping date
- **Connector search**: find order by Connector Platform reference
- **Tracking number management**: view, regenerate tracking

**Order Status Flow:**
```
Pending → Production → Finishing → Shipped
                ↘ Cancelled (at any point)
                ↘ On Hold (manual review)
```

---

## Scenarios

### SCENARIO-10-01: HoodslyHub dashboard loads
**Priority:** High (smoke)
**Steps:**
1. Navigate to `{HUB_BASE_URL}/wp-admin/`
2. Verify WP Admin bar is visible
3. Verify Hub-specific menu items are present (e.g., "Orders", "Manual Placement")

**Expected Result:** Hub admin dashboard loads
**Page Object:** `hub-dashboard.page.js`

---

### SCENARIO-10-02: Orders list page loads and shows orders
**Priority:** High
**Steps:**
1. Navigate to `{HUB_BASE_URL}/wp-admin/edit.php?post_type=shop_order`
2. Verify orders table renders
3. Verify at least one order row exists (if orders have been placed)
4. Verify columns: Order ID, Partner, Customer, Status, Date, Actions

**Expected Result:** Orders list is accessible and shows data

---

### SCENARIO-10-03: Filter orders by status
**Priority:** High
**Steps:**
1. Load orders list
2. Click "Production" status filter tab
3. Verify all visible orders have status "Production"
4. Click "Finishing" status filter
5. Verify all visible orders have status "Finishing"
6. Click "All" to reset filter

**Expected Result:** Status filter shows only orders with that status

---

### SCENARIO-10-04: Search for order by order ID
**Priority:** High
**Steps:**
1. Load orders list
2. Type a known order ID in the search box
3. Submit search
4. Verify exactly one result is shown
5. Verify the shown order matches the searched ID

**Expected Result:** Search by order ID returns the correct order

---

### SCENARIO-10-05: Search orders by partner name
**Priority:** Medium
**Steps:**
1. Load orders list
2. Search by a known partner name (e.g., "AutoB2B")
3. Verify all results belong to that partner

**Expected Result:** Partner name search filters correctly

---

### SCENARIO-10-06: View order detail
**Priority:** High
**Steps:**
1. Load orders list
2. Click on an order to open its detail view
3. Verify: order ID, partner name, customer name, shipping address visible
4. Verify: line items with SKUs are shown
5. Verify: BOL section is present

**Expected Result:** Full order detail is visible

---

### SCENARIO-10-07: Update order status to Production
**Priority:** High
**Steps:**
1. Find a "Pending" order in Hub
2. Open order detail
3. Change status to "Production"
4. Save
5. Verify status indicator shows "Production"
6. Verify partner site order status updates to `wc-production`

**Expected Result:** Order status updates and syncs to partner site

---

### SCENARIO-10-08: Set estimated ship date
**Priority:** Medium
**Steps:**
1. Open an order in Hub
2. Find "Estimated Ship Date" field
3. Set date to next business day
4. Save
5. Verify date persists on reload

**Expected Result:** Estimated ship date is saved

---

### SCENARIO-10-09: Generate BOL with valid contact info
**Priority:** High
**Pre-condition:** Order has valid US phone, email, shipper name
**Steps:**
1. Open order in Hub
2. Verify contact details (phone, email, shipper)
3. Click "Generate BOL" button
4. Wait for BOL generation (loading indicator)
5. Verify BOL is generated (download link or inline preview appears)
6. Verify tracking number appears in order

**Expected Result:** BOL generated; tracking number assigned

---

### SCENARIO-10-10: BOL generation fails with invalid phone
**Priority:** High (negative test)
**Steps:**
1. Open order with invalid phone (e.g., "0000000000")
2. Attempt to generate BOL
3. Verify error message about invalid phone
4. Edit phone to valid US number: "+1 (555) 234-5678"
5. Save and regenerate BOL
6. Verify BOL now generates

**Expected Result:** Invalid phone rejected; valid phone succeeds

---

### SCENARIO-10-11: Manually reassign order to different shop
**Priority:** Medium
**Steps:**
1. Open an order assigned to WRHHub
2. Find "Reassign Shop" dropdown or button
3. Change assignment to WiksHub
4. Save
5. Verify order now appears in WiksHub

**Expected Result:** Shop assignment can be manually overridden

---

### SCENARIO-10-12: Multi-item order shows suffixed IDs
**Priority:** Medium
**Steps:**
1. Find or create a 2-item order in Hub
2. Verify Hub creates `orderId-1` and `orderId-2` as separate line items or sub-orders
3. Verify each sub-order has its own status tracking

**Expected Result:** Multi-item orders are split with suffix IDs

---

## MCP Codegen Notes

```bash
# Capture Hub order management selectors:
npx playwright codegen https://hub.hoodsly.com/wp-admin/edit.php?post_type=shop_order

# Capture order detail view:
# Open any order and capture the detail page selectors

# Key elements:
# - Status filter tabs/links
# - Search input
# - Order table row structure
# - BOL generation button
# - Status update dropdown
# - Estimated ship date input
# - Tracking number field
```

## Known Complexities
- Hub uses WooCommerce orders (`post_type=shop_order`) — shares WP admin order list structure but with custom columns/meta
- BOL generation is async — may need extended wait or polling
- Partner Source Name caching: status sync may be delayed by minutes after Hub update
- Hub URL (`HUB_BASE_URL`) needs to be set in environment variables
