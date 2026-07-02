# Module 04 — Attribute Mapping (Types, Values, Catalogs)

**URL**: `https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub#/attributes`  
**Prerequisite**: WordPress admin authenticated  
**Live Data** (verified 2026-06-02): 58 Attribute Types | 300 Attribute Values | 8 Catalogs

---

## SCENARIO-04-01: Attributes page loads with 3 tabs

**Purpose**: Verify the Attributes module renders with all 3 sub-tabs.

### Steps
1. Navigate to `#/attributes`
2. Verify tab structure

### Expected Results
- Page heading: "Attributes"
- Sub-heading: "Manage attribute types and their values"
- Three tab buttons: "Attribute Types" | "Attribute Values" | "Catalogs"
- Default tab: "Attribute Types"

---

## SCENARIO-04-02: Attribute Types tab — list loads with all 58 types

**Purpose**: Verify all 58 attribute types are listed with correct columns.

### Steps
1. Navigate to `#/attributes` (Attribute Types tab)
2. Verify table structure and count

### Expected Results
- Intro text: "Define the types of attributes your products can have (e.g., Color, Size, Material)."
- "Add Type" button (top right)
- Filter dropdown: "All Attribute Types" | "Product Attribute Type" | "Partner Attribute Type"
- Table columns: NAME | SLUG | TYPE | VALUES | STATUS | PARTNER PAGE | ACTIONS
- 58 total rows (no pagination shown for 58 items)

### Key Attribute Type Data
| Name | Slug | Type | Values | Status | Partner Page |
|---|---|---|---|---|---|
| Color Options | color_options | Radio | 4 | Inactive | No |
| Color | color | Select | 0 | Active | No |
| Color Match Selection | color_match_selection | Select | 5 | Active | No |
| Size | size | Select | 34 | Active | No |
| Partner Colors | partner_colors | **Color** | 93 | Active | **Yes** |
| Partner Ventilations | partner_ventilations | Select | 5 | Active | **Yes** |
| Partner Trims | partner_trims | Select | 3 | Active | **Yes** |
| Partner Sizes | partner_sizes | Select | 22 | Active | **Yes** |

### Filter: Partner Attribute Type
- Returns only 4 rows (those with "Partner Page = Yes")
- Filter values: 'product' / 'partner' / '' (all)

---

## SCENARIO-04-03: Attribute Types filter by Product vs Partner type

**Purpose**: Verify the attribute type filter works correctly.

### Steps
1. Navigate to `#/attributes`
2. Select "Product Attribute Type" from dropdown
3. Verify count: 54 types (58 minus 4 partner types)
4. Select "Partner Attribute Type"
5. Verify count: 4 types (Partner Colors, Partner Ventilations, Partner Trims, Partner Sizes)
6. Reset to "All Attribute Types"

### Filter Select Options
```js
// Filter select has 3 options
// '' = All Attribute Types
// 'product' = Product Attribute Type (shows 54 types)
// 'partner' = Partner Attribute Type (shows 4 types)
```

---

## SCENARIO-04-04: Add Attribute Type modal — all fields and validation

**Purpose**: Verify the "Add Type" modal has all required fields.

### Steps
1. Navigate to `#/attributes`
2. Click "Add Type" button
3. Verify modal opens
4. Check all fields

### Add Attribute Type Modal Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | Yes | `input[placeholder="e.g., Color, Size"]` |
| Slug | text | No | `input[placeholder="Auto-generated if empty"]` — auto-generated from Name |
| Type | react-select | Yes | Options: Select, Radio, Color |
| Description | textarea | No | `textarea[placeholder="Optional description"]` |
| Sort Order | number | No | Default: 0 |
| Status | react-select | No | Default: Active; Options: Active, Inactive |
| Show in Partner Page | toggle | No | Default: Off (false) |

### Type Options (react-select)
- **Select**: single dropdown selection (most common)
- **Radio**: radio button group
- **Color**: special color swatch type (used for Partner Colors)

### Show in Partner Page
- Toggle switch (appears as peer checkbox with visual toggle)
- When ON: the attribute type appears in the Partner edit form's Attributes tab
- Currently only 4 types have this on: Partner Colors, Partner Ventilations, Partner Trims, Partner Sizes

### Validation
- Clicking "Create" without Name: required field validation
- Slug auto-generates from Name (e.g., "My Color" → "my-color")
- Click "Cancel" to close without creating

### Modal Selectors
```js
// Open modal
await page.locator('button:has-text("Add Type")').click();

// Name input
await page.locator('input[placeholder="e.g., Color, Size"]').fill('Test Type');

// Slug input (auto-filled, or override)
await page.locator('input[placeholder="Auto-generated if empty"]').fill('test-type');

// Sort Order input
await page.locator('input[placeholder="0"]').fill('5'); // or by label proximity

// Close button (X)
await page.locator('button.w-7.h-7').click(); // or Cancel button

// Create button
await page.locator('button:has-text("Create")').click();
```

---

## SCENARIO-04-05: Edit Attribute Type — modifies existing type

**Purpose**: Verify editing an attribute type pre-fills and saves correctly.

### Steps
1. Navigate to `#/attributes`
2. Find "Size" attribute type in the table
3. Click the edit (pen) icon in ACTIONS column
4. Verify modal opens pre-filled
5. Modify the name
6. Click "Update"
7. Verify change reflected in list

### Expected Results
- Edit modal: same fields as "Add Type" but pre-filled
- Modal title changes to "Edit Attribute Type"
- "Create" button becomes "Update" button
- Successful save: list refreshes with updated data

### Action Button Selectors
```js
// Edit button (blue hover, first button in row ACTIONS)
const editBtn = row.locator('button').first();

// Delete button (red hover, second button)
const deleteBtn = row.locator('button').nth(1);
```

---

## SCENARIO-04-06: Delete Attribute Type shows confirmation dialog

**Purpose**: Verify deleting an attribute type shows a confirmation.

### Steps
1. Navigate to `#/attributes`
2. Click delete icon for any attribute type
3. Verify confirmation dialog
4. Click Cancel

### Expected Results
- Headless UI dialog overlay appears (`data-headlessui-state="open"`)
- Dialog asks for confirmation to delete
- Cancel button: dismisses without deleting
- Confirm/Delete button: removes the type (and potentially its values)

---

## SCENARIO-04-07: Attribute Values tab — list with all 300 values and filters

**Purpose**: Verify the Attribute Values tab lists all values with filtering options.

### Steps
1. Navigate to `#/attributes`
2. Click "Attribute Values" tab
3. Verify structure

### Expected Results
- Page sub-text changes to reflect values context
- Filter 1: "Attribute Type" dropdown — "All Types" + all 58 type names
- Filter 2: "All Values" | "Missing SKU" dropdown
- Table columns: NAME | SLUG | TYPE | SKU | BASE PRICE | STATUS | ACTIONS
- 300 total values (with pagination if needed)

### Attribute Value Table Columns
- **NAME**: Display name (e.g., "Raw / Unfinished", "30\" x 30\"")
- **SLUG**: URL-friendly slug (e.g., "raw-unfinished", "30-x-30")
- **TYPE**: Parent attribute type name
- **SKU**: SKU code used in master SKU generation (or `—` if missing)
- **BASE PRICE**: Dollar amount (e.g., "$0.00", "$450.00")
- **STATUS**: Active/Inactive badge
- **ACTIONS**: Edit (blue pen) + Delete (red trash)

### Size Attribute SKU Examples
```
"30\" x 30\""        → SKU: 3030
"30\" Width x 36\" Height" → SKU: 3036
"36\" x 36\""        → SKU: 3636
"43\" x 48\""        → SKU: 4348
```

---

## SCENARIO-04-08: Missing SKU filter shows values without SKU assigned

**Purpose**: Verify the "Missing SKU" filter correctly shows attribute values that have no SKU code.

### Steps
1. Navigate to `#/attributes` > Attribute Values
2. Note total count (300)
3. Select "Missing SKU" from the second filter dropdown
4. Verify filtered results

### Expected Results
- Missing SKU filter: 133 values have no SKU assigned (live data)
- These are values where the SKU column shows "—" (dash)
- Examples of missing SKU values: "Our Color Options" (color_options type), "Our Colour Options"
- "All Values" filter: all 300 values
- Switching back to "All Values" restores full list

### Filter Selector
```js
// Second select (All Values / Missing SKU)
await page.locator('select').nth(1).selectOption('missing');
// or
await page.locator('select:nth-of-type(2)').selectOption('missing');
```

---

## SCENARIO-04-09: Filter Attribute Values by Type narrows list

**Purpose**: Verify filtering by attribute type shows only that type's values.

### Steps
1. Navigate to `#/attributes` > Attribute Values
2. Select "Size" from the "Attribute Type" dropdown
3. Verify only Size values appear

### Expected Results
- "Size" type has 34 values (from live data)
- All shown rows have TYPE = "Size"
- Size values are dimension pairs like "30\" x 30\"", "36\" x 36\"", etc.

---

## SCENARIO-04-10: Edit Attribute Value modal — all fields

**Purpose**: Verify the Edit Attribute Value modal shows all relevant fields.

### Steps
1. Navigate to `#/attributes` > Attribute Values
2. Click edit (pen) icon for any value row
3. Verify "Edit Attribute" modal

### Edit Attribute Modal Fields
| Field | Type | Example Value |
|---|---|---|
| Name | text | "Our Color Options" |
| Slug | text | "our-color-options" |
| SKU | text | placeholder "e.g., WHT, BLK" (empty for color options) |
| Base Price ($) | number | 0 |
| Sort Order | number | 1 |
| Status | select/react-select | Inactive / Active |

### SKU Field Purpose
- Short alphanumeric code that gets concatenated to form the Master SKU
- Example: Size "30 x 36" has SKU "3036", contributing to master SKU like `VEN-DBC-3036-WHT-...`
- Empty SKU means this attribute value doesn't add to the master SKU

### Selectors
```js
// Edit button in row (first button of action column)
const editBtn = row.locator('button').first();
await editBtn.click();

// SKU input in edit modal
const skuInput = page.locator('input[placeholder="e.g., WHT, BLK"]');

// Update button
await page.locator('button:has-text("Update")').click();
```

---

## SCENARIO-04-11: Catalogs tab — 8 catalogs listed correctly

**Purpose**: Verify the Catalogs tab shows all configured color catalogs.

### Steps
1. Navigate to `#/attributes`
2. Click "Catalogs" tab
3. Verify structure

### Expected Results
- Section intro: "Manage catalogs used to group color attributes."
- "Add Catalog" button
- Table columns: NAME | SLUG | SORT | STATUS | ACTIONS
- 8 catalogs (all Active, all SORT=0):
  1. USCD (slug: uscd)
  2. TA Cabinetry (slug: ta-cabinetry)
  3. Hoodsly (slug: hoodsly)
  4. Jarlin (slug: jarlin)
  5. Everly (slug: everly)
  6. Jim Bishop (slug: jim-bishop)
  7. Homemark (slug: homemark)
  8. JSI (slug: jsi)

---

## SCENARIO-04-12: Add Catalog modal — create new color catalog

**Purpose**: Verify the Add Catalog modal has all required fields.

### Steps
1. Navigate to `#/attributes` > Catalogs
2. Click "Add Catalog" button
3. Verify modal

### Add Catalog Modal Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | Yes | `input[placeholder="e.g., USCD, TA Cabinetry"]` |
| Slug | text | No | `input[placeholder="Auto-generated if empty"]` |
| Sort Order | number | No | Default: 0 |
| Status | react-select | No | Default: Active |

### Steps to Create a Catalog
```js
await page.locator('button:has-text("Add Catalog")').click();
await page.locator('input[placeholder="e.g., USCD, TA Cabinetry"]').fill('New Catalog');
await page.locator('button:has-text("Create")').click();
// Verify catalog appears in list
```

---

## SCENARIO-04-13: Edit Catalog — modify existing catalog

**Purpose**: Verify editing a catalog updates it correctly.

### Steps
1. Navigate to `#/attributes` > Catalogs
2. Click edit for "USCD" catalog
3. Verify pre-filled name "USCD", slug "uscd", sort 0, status Active
4. Modify sort order to 1
5. Click "Update"
6. Verify SORT column shows 1

---

## SCENARIO-04-14: Attribute Type "Color" type creates color swatch entries

**Purpose**: Verify that "Color" type attribute (specifically "Partner Colors") shows color swatches.

### Steps
1. Navigate to `#/attributes` > Attribute Types
2. Observe the "Partner Colors" row — TYPE = "Color"
3. Navigate to Partner edit form > Attributes tab > expand "Partner Colors"
4. Verify colors show as swatches (colored circles)

### Expected Results
- Partner Colors accordion in Partner edit form shows 93 values
- Each row has: checkbox, colored circle swatch, name, catalog, custom name, price columns
- 7 swatches are pre-selected for TestRakibulQA
- "Filter by Catalog" filters the color list by catalog name
- "Select All" button selects all visible colors

### Catalog Filter Options in Partner Attributes
```
All Catalogs
USCD (has ~27 colors: Shaker Antique White, York Antique White, etc.)
TA Cabinetry (has ~11 colors: Beige Gray, Charcoal Black, etc.)
Hoodsly (has ~12 colors: Blue, Black, Antique White, etc.)
Jarlin (has ~11 colors: Sterling Gray, Weston Shaker, etc.)
Everly (has ~5 colors: Admiral Blue Shaker, etc.)
Jim Bishop (has ~5 colors: Alabaster Paint, etc.)
Homemark (has ~9 colors: Ash Paint, Cloud Paint, etc.)
JSI (has ~10 colors: Amesbury Mist Slab, etc.)
```
