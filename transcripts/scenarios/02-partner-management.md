# Module 02 — Partner Management

**URL**:
`https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub#/partners`  
**Prerequisite**:
WordPress admin authenticated  
**Live Data** (verified 2026-06-02): 17 Partners total (WP=8, M2=2, SH=7)

---

## SCENARIO-02-01: Partners list loads with correct table structure

**Purpose**: Verify the partners list page renders correctly with all required
UI elements.

### Steps

1. Navigate to `#/partners`
2. Wait for table to load
3. Extract page content

### Expected Results

- Page heading: "Partners"
- Sub-heading: "Manage your connector partners"
- "Add Partner" button visible (top right)
- Search input: placeholder "Search partners..."
- Filter 1: Platform dropdown (All Platforms, WordPress, Magento, Shopify)
- Filter 2: Status dropdown (All Status, Active, Inactive, Staging, Production)
- Table columns: PARTNER (name + initials badge + website), PLATFORM (with
  icon), PRODUCTS (count), ENVIRONMENT, STATUS, ACTIONS
- Pagination: "Showing 1–17 of 17 partners" (or current count)

### Selectors

```js
// Search input
const search = page.locator('input[placeholder="Search partners..."]');

// Platform filter (first select)
const platformFilter = page.locator('select').first();

// Status/env filter (second select)
const statusFilter = page.locator('select').nth(1);

// Table rows
const rows = page.locator('table tbody tr');
```

---

## SCENARIO-02-02: Search partners by name filters results correctly

**Purpose**: Verify the search input filters the partner list.

### Steps

1. Navigate to `#/partners`
2. Get the initial row count
3. Type "Rakibul" in `input[placeholder="Search partners..."]`
4. Wait for the table to update
5. Verify filtered results

### Expected Results

- Filtered list shows only partners matching "Rakibul" in their name
- Live test: searching "Rakibul" returns 2 partners: TestRakibulQA,
  RakibulQAPartner
- Clearing search restores the full list
- Empty search result shows appropriate message

### Selectors

```js
await page.locator('input[placeholder="Search partners..."]').fill('Rakibul');
const rows = page.locator('table tbody tr');
await expect(rows).toHaveCount(2);
```

---

## SCENARIO-02-03: Platform filter filters partners by platform type

**Purpose**: Verify the platform dropdown filter works.

### Steps

1. Navigate to `#/partners`
2. Select "Shopify" from the first `select` dropdown
3. Wait for list to update
4. Verify only Shopify partners appear
5. Reset to "All Platforms"

### Expected Results

- When "Shopify" selected: 7 Shopify partners visible (per live data)
- When "WordPress" selected: 8 WordPress partners visible
- When "Magento" selected: 2 Magento partners visible
- "All Platforms" shows all 17

### Filter Values

```js
// Platform filter option values
// '' = All Platforms
// 'wordpress' = WordPress
// 'magento' = Magento
// 'shopify' = Shopify
await page.locator('select').first().selectOption('shopify');
```

---

## SCENARIO-02-04: Status/Environment filter filters partners

**Purpose**: Verify the second filter (status or environment) works correctly.

### Steps

1. Navigate to `#/partners`
2. Select from the second select dropdown
3. Verify filtering

### Expected Results

- Second filter has options: All Status, Active, Inactive (or All, Staging,
  Production)
- Filtering changes the displayed partners

---

## SCENARIO-02-05: "Add Partner" button navigates to create form

**Purpose**: Verify the Add Partner button opens the partner creation form.

### Steps

1. Navigate to `#/partners`
2. Click the "Add Partner" button (blue, top right)
3. Verify navigation

### Expected Results

- URL changes to `#/partners?action=add`
- Page heading: "Add New Partner"
- "Back to Partners" link visible
- Form tabs: Basic Info (only one tab, no Products/Attributes/FAQs tabs)
- Form shows: Cancel and "Create Partner" buttons (both at top AND at bottom of
  form)

---

## SCENARIO-02-06: Add Partner form — all fields and validation

**Purpose**: Verify the Add New Partner form has all required fields and
validates input.

### Steps

1. Navigate to `#/partners?action=add`
2. Click "Create Partner" (submit button) without filling any fields
3. Observe validation errors
4. Fill all required fields and submit

### Add Partner Form Fields

| Field                | Type                  | Required | Selector                                              | Notes                                |
| -------------------- | --------------------- | -------- | ----------------------------------------------------- | ------------------------------------ |
| Partner Name         | text                  | Yes\*    | `input[placeholder="Enter partner name"]`             | Shows validation on empty            |
| Partner Colors Style | radio                 | No       | `input[name="color_style"]`                           | Values: "select", "swatch"           |
| Partner Type         | radio                 | No       | `input[name="partner_type"]`                          | Values: "b2b", "b2c"                 |
| SKU Prefix           | text                  | No       | `input[placeholder="e.g., HS-"]`                      | Prepended to product SKUs            |
| Website URL          | url                   | Yes\*    | `input[placeholder="https://example.com"]`            | Must be valid URL                    |
| Platform Type        | select (react-select) | Yes\*    | Custom dropdown                                       | Options: WordPress, Magento, Shopify |
| API Key              | text                  | No       | `input[placeholder="API key will be auto-generated"]` | Generated by "Generate" button       |
| Status               | select                | No       | 2nd custom dropdown                                   | Options: Draft, Active, Inactive     |
| Environment          | select                | No       | 3rd custom dropdown                                   | Options: Staging, Production         |

\*Required fields validated client-side by Vue/React (not HTML required
attribute)

### Select Option Values

```js
// Platform Type (native select)
// 'wordpress' / 'magento' / 'shopify'

// Status (native select)
// 'draft' / 'active' / 'inactive'

// Environment (native select)
// 'staging' / 'production'
```

### Validation Behavior

- Submit without fields: shows asterisks (\*) on required fields; "Session
  expired" toast may show from API
- Required: Partner Name, Website URL, Platform Type

### Two Submit/Cancel Buttons

- Both "Cancel" links point to `#/partners` (navigating away without saving)
- `a[href="#/partners"]` — two exist; top Cancel and bottom Cancel
- Top "Create Partner": `button[type="button"]` class `bg-primary`
- Bottom "Create Partner": `button[type="submit"]` class `bg-primary`

---

## SCENARIO-02-07: API Key generation works on Add Partner form

**Purpose**: Verify the "Generate" button creates a valid API key.

### Steps

1. Navigate to `#/partners?action=add`
2. Click the "Generate" button next to the API Key field
3. Check the API Key input value

### Expected Results

- API Key input is populated with a 32-character hexadecimal string
- Format: `[a-f0-9]{32}` (all lowercase)
- Each click generates a new key
- API key field is readonly (cannot be manually edited)

### Selectors

```js
await page.locator('button:has-text("Generate")').click();
const apiKey = await page
  .locator('input[placeholder="API key will be auto-generated"]')
  .inputValue();
expect(apiKey).toMatch(/^[a-f0-9]{32}$/);
```

---

## SCENARIO-02-08: Cancel buttons on Add Partner form navigate back without saving

**Purpose**: Verify both Cancel links navigate back to Partners list without
creating a partner.

### Steps

1. Navigate to `#/partners?action=add`
2. Fill in some fields (e.g., Partner Name)
3. Click the top "Cancel" link
4. Verify redirect to `#/partners`
5. Confirm no new partner was created

### Expected Results

- Clicking Cancel: URL changes to `#/partners`
- Partner was not saved (new name not visible in list)

---

## SCENARIO-02-09: Edit Partner form — Basic Info tab pre-fills with existing data

**Purpose**: Verify that an existing partner's data loads correctly in the edit
form.

### Steps

1. Navigate to `#/partners`
2. Click the edit button (pen icon) for a partner (e.g., TestRakibulQA, id=7191)
3. Verify URL: `#/partners?action=edit&id=7191`
4. Check all pre-filled values

### Expected Results (TestRakibulQA / id=7191)

| Field         | Expected Value                                  |
| ------------- | ----------------------------------------------- |
| Partner Name  | "TestRakibulQA"                                 |
| Color Style   | "Select" radio selected                         |
| Partner Type  | "B2C" radio selected                            |
| SKU Prefix    | "" (empty)                                      |
| Website URL   | "https://recruittooth.s3-tastewp.com"           |
| Platform Type | "WordPress"                                     |
| API Key       | "bd7d3b7384e7e6d00c557b20efc5cd76" (or similar) |
| Status        | "Active"                                        |
| Environment   | "Staging"                                       |

### Buttons in Edit Mode

- Top: "Cancel" link + "Update Partner" button
- Bottom: "Cancel" link + "Update Partner" button
- "Regenerate" button + "Copy" button (for API key, replacing "Generate")

---

## SCENARIO-02-10: Edit Partner — Products tab shows assigned products and allows additions

**Purpose**: Verify the Products tab in Partner edit shows assigned products and
allows adding more.

### Steps

1. Navigate to `#/partners?action=edit&id=7191`
2. Click "Products" tab
3. Verify assigned products table
4. Click "Add Products" button
5. Verify product selection panel opens
6. Click Cancel to close without changes

### Expected Results (TestRakibulQA)

- "Products - 3 selected" header
- Table columns: PRODUCT (name + SKU badge), CUSTOM TITLE (editable input)
- Current products: Double Curved (VEN-DBC), Angled (VEN-LCX), Curved (VEN-CCX)
- Remove button (trash icon) for each row
- "Add Products" button opens a panel showing 41 available products
- Panel shows two columns: Available products list (left) + currently selected
  (right)

### Selectors

```js
// Products tab
await page.locator('button:has-text("Products")').click();

// Add Products button
await page.locator('button:has-text("Add Products")').click();

// Available products panel
const availablePanel = page.locator(
  '[class*="available"], text="AVAILABLE PRODUCTS"'
);
```

---

## SCENARIO-02-11: Edit Partner — Attributes tab shows attribute categories with selection counts

**Purpose**: Verify the Attributes tab displays all 4 attribute categories with
selection counts.

### Steps

1. Navigate to `#/partners?action=edit&id=7191`
2. Click "Attributes" tab
3. Verify 4 accordion sections are visible
4. Click "Partner Colors" to expand
5. Verify color list, Select All button, and catalog filter

### Expected Results

- Section heading: "Available Attributes"
- Sub-text: "Select which attributes this partner can access. You can also set
  custom names and prices."
- 4 accordion sections:
  - "Partner Colors — 7 selected" (for TestRakibulQA)
  - "Partner Ventilations — 0 selected"
  - "Partner Trims — 0 selected"
  - "Partner Sizes — 0 selected"
- When "Partner Colors" expanded:
  - "Select All" button visible
  - "Filter by Catalog" dropdown with 9 options: All Catalogs, USCD, TA
    Cabinetry, Hoodsly, Jarlin, Everly, Jim Bishop, Homemark, JSI
  - Table: COLOR | CATALOG | CUSTOM NAME | CURRENT PRICE | CUSTOM PRICE
  - ~100 color rows (93 for Partner Colors attribute type)
  - Rows have checkbox, color swatch, name, catalog, custom name input, prices

### Click Accordion Selector

```js
// Accordion items are divs with cursor-pointer class
await page.locator('.cursor-pointer:has-text("Partner Colors")').click();
```

---

## SCENARIO-02-12: Edit Partner — FAQs & Shipping tab allows adding FAQ entries

**Purpose**: Verify the FAQs & Shipping tab has two sub-sections and allows
creating FAQs.

### Steps

1. Navigate to `#/partners?action=edit&id=7191`
2. Click "FAQs & Shipping" tab
3. Verify two sub-tabs: FAQs | Shipping & Returns
4. Click "Add FAQ" button
5. Verify FAQ entry form appears
6. Fill in Title and Answer fields
7. Click "Done" to save the FAQ entry
8. Verify FAQ appears in list
9. Switch to "Shipping & Returns" sub-tab
10. Click "Add Policy" button
11. Verify policy form appears

### Expected Results — FAQs Tab

- Default state: "No FAQs added yet." + "Add FAQ" button
- Clicking "Add FAQ" adds an inline form with:
  - Label: "No Label" (editable)
  - Title: text input
  - Answer: rich text editor (WordPress TinyMCE with "Add media", Visual, Code
    tabs)
  - "Delete" button (removes the entry)
  - "Done" button (saves the entry)

### Expected Results — Shipping & Returns Tab

- Default state: "No shipping & return policies added yet." + "Add Policy"
  button
- Clicking "Add Policy" adds inline form with:
  - Label: "No Label"
  - Title: text input
  - Description: rich text editor
  - "Delete" and "Done" buttons

### Selectors

```js
// Tab navigation
await page.locator('button:has-text("FAQs & Shipping")').click();

// Sub-tabs (within the tab)
await page.locator('button:has-text("Shipping & Returns")').click();

// Add FAQ
await page.locator('button:has-text("Add FAQ")').click();

// Add Policy
await page.locator('button:has-text("Add Policy")').click();
```

---

## SCENARIO-02-13: Edit Partner — API Key Regenerate and Copy buttons work

**Purpose**: Verify API key management actions on the edit form.

### Steps

1. Navigate to partner edit form
2. Note the current API key value
3. Click "Regenerate" button
4. Verify new key is different from old
5. Click "Copy" button
6. Verify the key is copied to clipboard

### Expected Results

- "Regenerate": replaces the current API key with a new 32-char hex string
- "Copy": copies the API key to system clipboard (check clipboard value or
  toaster notification)
- API key input remains read-only

---

## SCENARIO-02-14: Partner list row shows correct columns and action buttons

**Purpose**: Verify each row in the Partners list has the correct data and
actions.

### Steps

1. Navigate to `#/partners`
2. Inspect one row

### Expected Results per Row

- Column 1: Partner initials avatar badge (colored circle with 2-letter
  abbreviation)
- Column 2: Partner name + website URL sub-text
- Column 3: Platform type with icon badge (WordPress/Magento/Shopify)
- Column 4: Product count (number)
- Column 5: Environment badge (Staging/Production)
- Column 6: Status badge (Active/Inactive/Draft) with color coding
- Column 7: Actions — Edit button (pen/blue hover), Delete button (trash/red
  hover)

### Action Button Selectors

```js
// Edit button (title="Edit" or blue hover icon)
const editBtn = row.locator(
  'button[title="Edit"], button.hover\\:text-primary'
);

// Delete button (title="Delete" or red hover icon)
const deleteBtn = row.locator(
  'button[title="Delete"], button.hover\\:text-red'
);
```

---

## SCENARIO-02-15: Delete partner shows confirmation modal

**Purpose**: Verify deleting a partner shows a confirmation dialog.

### Steps

1. Navigate to `#/partners`
2. Click the delete (trash) icon for a test partner
3. Verify a confirmation modal appears
4. Click Cancel to dismiss

### Expected Results

- Confirmation modal appears with partner name
- Modal has "Cancel" and "Delete/Confirm" buttons
- Clicking Cancel closes modal without deletion
- Clicking Confirm deletes the partner and removes from list

---

## SCENARIO-02-16: Partner list pagination works correctly

**Purpose**: Verify pagination controls work on the Partners list.

### Steps

1. Navigate to `#/partners` (with 17+ partners, may all fit on one page)
2. Check if pagination is shown
3. If pagination exists: click "Next" and verify page 2 loads

### Expected Results

- "Showing 1–N of M partners" text visible
- Previous/Next buttons and page numbers shown
- Clicking page number or Next loads the correct page
- (With 17 partners and default 20-per-page, all fit on one page — no pagination
  needed)
