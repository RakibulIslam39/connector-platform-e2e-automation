# Module 16 — Logs & Debugging

**URL**: `https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub#/logs`  
**Prerequisite**: WordPress admin authenticated  
**Live Data** (verified 2026-06-02): 353 total sync log entries

---

## SCENARIO-16-01: Logs page loads with 2 tabs and Sync Logs stats

**Purpose**: Verify the Logs module renders correctly with stats and filters.

### Steps
1. Navigate to `#/logs`
2. Verify page structure

### Expected Results
- Page heading: "Logs"
- Sub-heading: "Monitor sync activity and debug partner order payloads"
- Two tab buttons: "Sync Logs" | "Partner Order Log"
- Default tab: "Sync Logs"
- Four stat cards:
  - **TOTAL TODAY**: count (may be 0 if no syncs today)
  - **SUCCESSFUL**: count of today's successful syncs
  - **FAILED**: count of today's failed syncs
  - **SUCCESS RATE**: percentage (e.g., "0%" or "98%")

---

## SCENARIO-16-02: Sync Logs list with filters and pagination

**Purpose**: Verify the Sync Logs list shows log entries with correct filters.

### Steps
1. Navigate to `#/logs`
2. Verify all filters and table

### Expected Results
- Action filter: "All Actions" | "Product Sync" | "Attribute Sync"
- Status filter: "All Status" | "Success" | "Failed" | "Pending"
- "Refresh" button to reload logs
- Table columns: TIME | PARTNER | ACTION | PRODUCT | STATUS | MESSAGE | ACTIONS
- Pagination: "Showing 1–20 of 353 logs"

### Live Log Entry Examples
```
2026-05-24 21:16:43 | TestRakibulQA | Product Sync | — | Success | Full sync completed (3 products)
2026-05-24 21:10:44 | Test Partner  | Product Sync | — | Success | Full sync completed (6 products)
2026-05-24 18:52:46 | ManualQAPartner | Product Sync | — | Success | Full sync completed (44 products)
```

---

## SCENARIO-16-03: Filter Sync Logs by Action type

**Purpose**: Verify filtering logs by action type (Product Sync vs Attribute Sync).

### Steps
1. Navigate to `#/logs` > Sync Logs
2. Note total count
3. Select "Product Sync" from Action filter
4. Verify only Product Sync entries appear
5. Select "Attribute Sync" from Action filter
6. Verify only Attribute Sync entries appear

### Expected Results
- "Product Sync": all entries are Product Sync action
- "Attribute Sync": all entries are Attribute Sync action (may be 0 if none exist)
- "All Actions": restores full list

### Selectors
```js
// Action filter (first select)
await page.locator('select').first().selectOption('product_sync');
// or whatever the option value is

// Status filter (second select)
await page.locator('select').nth(1).selectOption('success');
```

---

## SCENARIO-16-04: Filter Sync Logs by Status (Success / Failed / Pending)

**Purpose**: Verify filtering logs by status.

### Steps
1. Navigate to `#/logs` > Sync Logs
2. Select "Success" from Status filter
3. Verify all visible entries have "Success" status (green badge)
4. Select "Failed" — verify entries with "Failed" status (red badge)
5. Select "Pending" — verify pending entries

---

## SCENARIO-16-05: View Log Details modal — expand Technical Details

**Purpose**: Verify the "View Details" action shows full log information including request payload.

### Steps
1. Navigate to `#/logs` > Sync Logs
2. Click the "View Details" button (blue hover) on the first log entry
3. Verify Log Details modal opens
4. Expand "TECHNICAL DETAILS" `<details>` element
5. Verify JSON payload visible

### Expected Results — Log Details Modal
- Modal title: "Log Details" (with colored dot: green=Success, red=Failed)
- Fields:
  - **PARTNER**: Partner name (e.g., "TestRakibulQA")
  - **PRODUCT**: Product name or "—" for full syncs
  - **ACTION**: Action badge (e.g., "Product Sync" in blue chip)
  - **STATUS**: Status badge (e.g., "● Success" green)
  - **TIMESTAMP**: datetime string (e.g., "2026-05-24 21:16:43")
  - **MESSAGE**: Description (e.g., "Full sync completed (3 products)")
  - **TECHNICAL DETAILS**: `<details>` expandable section
    - "Request Payload:" heading
    - JSON code block showing the synced data
- "Close" button

### Technical Details JSON Structure
```json
{
  "partner_type": "b2c",
  "data": [
    {
      "id": 5082,
      "sku": "VEN-DBC",
      "category": "Wood Hoods",
      "label": "wood-hoods-product-category",
      "title": "Double Curved",
      "custom_title": "",
      "description": "<p>Our hoods are made from cabinet-grade..."
    }
  ]
}
```

### Selectors
```js
// View Details button (title="View Details")
const viewBtn = row.locator('button[title="View Details"]');
await viewBtn.click();

// Technical details expandable
await page.locator('summary:has-text("TECHNICAL DETAILS")').click();

// Close modal
await page.locator('button:has-text("Close")').click();
```

---

## SCENARIO-16-06: Delete log entry removes it from list

**Purpose**: Verify that deleting a log entry removes it from the list.

### Steps
1. Navigate to `#/logs` > Sync Logs
2. Note current count (353)
3. Click "Delete" button (red hover) on a log entry
4. Confirm deletion in dialog
5. Verify count decreases by 1 (352)

### Expected Results
- Confirmation dialog appears before delete
- After confirmation: row removed from list
- Pagination count decrements

---

## SCENARIO-16-07: Refresh button reloads sync logs

**Purpose**: Verify the Refresh button fetches latest log data.

### Steps
1. Navigate to `#/logs` > Sync Logs
2. Trigger a product sync in another tab
3. Click "Refresh" button
4. Verify new log entry appears

### Selectors
```js
await page.locator('button:has-text("Refresh")').click();
```

---

## SCENARIO-16-08: Sync Logs pagination works correctly

**Purpose**: Verify pagination navigates between log pages.

### Steps
1. Navigate to `#/logs` (353 total logs)
2. Check current page: "Showing 1–20 of 353 logs"
3. Click page 2
4. Verify "Showing 21–40 of 353 logs"
5. Click "Next" button
6. Click "Previous" button

### Pagination Elements
```
Previous | 1 | 2 | 3 | 4 | 5 | Next
```
(With 353 logs / 20 per page = 18 pages total)

---

## SCENARIO-16-09: Partner Order Log — select partner and enter order ID

**Purpose**: Verify the Partner Order Log allows order payload inspection.

### Steps
1. Navigate to `#/logs`
2. Click "Partner Order Log" tab
3. Verify page structure

### Expected Results
- Heading: "Fetch & Analyse Order Payload"
- Sub-text: "Select a partner and enter an order ID to inspect the live payload and validate SKU mappings."
- **Partner**: react-select dropdown (shows all 17 partners)
- **Order ID**: text input (placeholder: "e.g. CON5047-493")
- **"Fetch Order Data"** button
- Default state message: "Enter an order ID above and click Fetch Order Data."

### Order ID Format
```
CON[post_id]-[partner_id]
Example: CON5047-493
```

---

## SCENARIO-16-10: Partner Order Log — fetch a live order payload

**Purpose**: Verify fetching a real order shows the payload with SKU analysis.

### Steps
1. Navigate to `#/logs` > Partner Order Log
2. Select a partner (e.g., "TestRakibulQA") from the Partner dropdown
3. Enter a valid Order ID (e.g., "CON5047-493" or similar real order)
4. Click "Fetch Order Data" button
5. Verify the order payload appears

### Expected Results
- Order data fetched from the selected partner's site
- Payload shows:
  - Order details (order number, products, quantities)
  - SKU mapping validation (which master SKUs are in the order)
  - Any mapping errors or mismatches highlighted
- If order not found: appropriate error message

### Selectors
```js
// Partner dropdown (react-select)
// Click on the react-select container to open
const partnerDropdown = page.locator('.css-gqbp6w').first();
await partnerDropdown.click();
// Then click on the desired option

// Order ID input
await page.locator('input[placeholder="e.g. CON5047-493"]').fill('CON5047-493');

// Fetch button
await page.locator('button:has-text("Fetch Order Data")').click();
```

---

## SCENARIO-16-11: Partner Order Log — error handling for invalid order ID

**Purpose**: Verify that entering an invalid order ID shows an appropriate error.

### Steps
1. Navigate to Partner Order Log
2. Select any partner
3. Enter invalid order ID (e.g., "INVALID123")
4. Click "Fetch Order Data"
5. Verify error message

### Expected Results
- Error message displayed: something like "Order not found" or "Invalid order ID"
- No crash or blank page
