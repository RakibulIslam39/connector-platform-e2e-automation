# Live Exploration Notes — Connector Hub Plugin

**Exploration Date**: 2026-06-02 / 2026-06-03  
**Method**: Playwright MCP Server (browser_navigate, browser_snapshot,
browser_evaluate, browser_take_screenshot)  
**URL**: `https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/`

---

## Critical Technical Observations

### 1. SPA Architecture

- The Connector Hub is a Single Page Application (Vue.js or React) embedded in
  WordPress admin
- URL routing uses `#` hash routes: `#/dashboard`, `#/partners`, etc.
- Content loads dynamically — `browser_snapshot` alone may show empty content
- **Solution**: Use
  `browser_evaluate(() => document.querySelector('#wpbody-content').innerText)`
  to extract all visible text

### 2. Custom Select Dropdowns (React Select)

- Most dropdowns in modals use React Select library (class prefix: `css-gqbp6w`,
  `css-1dimb5e-singleValue`)
- Native `<select>` elements NOT used for: Platform Type, Status (in modal),
  Type (in Add Type modal)
- Native `<select>` elements ARE used for: list filters (Platform, Status),
  Category in product form
- **Automation**: Use `page.locator('select').selectOption()` for native
  selects; for React Select, click the container div and select option from
  dropdown list

### 3. Dual Button Pattern

- All edit/create forms have BOTH a top and bottom set of Cancel + Create/Update
  buttons
- Top Cancel: `a[href="#/partners"]` (type="button")
- Bottom Create/Update: `button[type="submit"]` or `button[type="button"]`
- Two elements matching `button:has-text("Create Partner")` — use `nth(0)` or
  `nth(1)` to differentiate

### 4. HeadlessUI Dialog Overlay

- Modals (Add Type, Edit Type, Add Catalog, Edit Attribute) use HeadlessUI:
  `data-headlessui-state="open"`
- Overlay element: `div[aria-hidden="true"][class*="fixed inset-0"]`
- Pressing Escape closes the modal
- Cannot click behind the overlay while it's open

### 5. Accordion Behavior (Partner Attributes)

- Partner Attributes tab uses accordion-style expandable sections
- Accordion items are `div.cursor-pointer` elements (not `<button>`)
- Click: `.cursor-pointer:has-text('Partner Colors')` to expand
- When expanded: shows Select All button, catalog filter, and attribute table

### 6. Rich Text Editors (TinyMCE)

- FAQs and Shipping & Returns descriptions use WordPress TinyMCE editor
- Two modes: Visual (WYSIWYG) and Code (raw HTML)
- "Add media" button opens WordPress Media Library
- Automation should use the "Code" tab for reliable text input via `iframe`
  targeting

---

## Live Data Verified (2026-06-02)

### Dashboard Stats

```
TOTAL PARTNERS:    17
TOTAL PRODUCTS:    44
ATTRIBUTE TYPES:   58
TOTAL ATTRIBUTES:  300 (attribute values)
```

### Partners by Platform

```
WordPress: 8 partners (47%)
Magento:   2 partners (12%)
Shopify:   7 partners (41%)
```

### Partner List (all 17)

```
1.  TestRakibulQA          (id=7191, WordPress, Active, Staging, 3 products)
2.  RakibulQAPartner       (WordPress, Active, Staging, 9 products)
3.  ManualQAPartner        (WordPress, Active, Staging, 44 products)
4.  Palash Staging Site    (Shopify)
5.  Delowar-Public-App-Testing (Shopify)
6.  Ali Local Magento      (Magento)
7.  TicTacTo 007           (Shopify)
8.  delowar-staging-test   (Shopify)
9.  The range hoods        (Shopify)
10. Delowar Development Store (Shopify, 5 products)
11. Automation_Partner     (WordPress, 43 products)
12. Alamin                 (WordPress)
13. Magento Staging        (Magento)
14. badrul-local-app       (Shopify)
15. Demo Partner           (WordPress, 44 products)
16. Demo Partner B         (WordPress, 44 products)
17. Demo Partner C         (WordPress, 44 products)
```

### Product Categories (3 total)

```
Wood Hoods     (slug: wood-hoods-product-category)
Floating Shelves (slug: floating-shelves)
Quick Shipping  (slug: quick-shipping)
```

### Attribute Types (58 total)

- 54 Product Attribute Types (Partner Page = No)
- 4 Partner Attribute Types (Partner Page = Yes):
  - Partner Colors (93 values, Type: Color)
  - Partner Ventilations (5 values, Type: Select)
  - Partner Trims (3 values, Type: Select)
  - Partner Sizes (22 values, Type: Select)

### Attribute Types Input Types

- **Radio**: Color Options (inactive)
- **Select**: Most types (54+)
- **Color**: Partner Colors (special — shows color swatches)

### Attribute Values (300 total)

- 133 values have Missing SKU (no SKU code assigned)
- 167 values have SKU codes assigned

### Catalogs (8 total, all Active, sort=0)

```
USCD, TA Cabinetry, Hoodsly, Jarlin, Everly, Jim Bishop, Homemark, JSI
```

### Sync Logs

- 353 total log entries
- Most recent entries: TestRakibulQA (3 products sync), RakibulQAPartner (9
  products sync)
- Log entry has Technical Details with full JSON request payload

---

## Form Structures (Complete)

### Add/Edit Partner Form Fields

```
Tab: Basic Info (only tab on Add, 4 tabs on Edit)

1. Partner Name *           input[placeholder="Enter partner name"]
2. Partner Colors Style     input[name="color_style"] radio (select/swatch)
3. Partner Type             input[name="partner_type"] radio (b2b/b2c)
4. SKU Prefix               input[placeholder="e.g., HS-"]
5. Website URL *            input[placeholder="https://example.com"]
6. Platform Type *          react-select (wordpress/magento/shopify)
7. API Key                  input[placeholder="API key will be auto-generated"] + Generate button
8. Status                   native select (draft/active/inactive)
9. Environment              native select (staging/production)

Buttons: Cancel (link to #/partners) + Create/Update Partner (button)
API Key: 32-char hex string generated client-side
Edit mode only: "Regenerate" + "Copy" buttons instead of "Generate"
```

### Add/Edit Product Form Fields

```
Tab: Basic Info

1. Product Title *    input[placeholder="Enter product title"]
2. Product SKU *      input[placeholder="e.g., VEN-001"]
3. Status             native select (draft/active/inactive)
4. Description        TinyMCE rich text editor #1
5. Dimensions         TinyMCE rich text editor #2
6. Category           native select (Wood Hoods / Floating Shelves / Quick Shipping)
7. Product Images     "Add Images" / "Add More Images" button

Tab: Attributes
- 58 accordion sections, each showing "X selected"
- Each expandable to see checkbox list of values

Tab: Partners
- Per-partner sections with Custom Title + Custom SKU + Price Override table
```

### Add Attribute Type Modal

```
Name *      input[placeholder="e.g., Color, Size"]
Slug        input[placeholder="Auto-generated if empty"]
Type *      react-select (Select / Radio / Color)
Description textarea[placeholder="Optional description"]
Sort Order  number input (default: 0)
Status      react-select (Active default; Active/Inactive)
Show in Partner Page  toggle (default: off)

Buttons: Cancel | Create (blue)
```

### Edit Attribute Value Modal

```
Name        input (pre-filled)
Slug        input (pre-filled, auto-generated)
SKU         input[placeholder="e.g., WHT, BLK"] ← CRITICAL for master SKU
Base Price  number input
Sort Order  number input
Status      react-select (Active/Inactive)

Buttons: Cancel | Update (blue)
```

### Add Catalog Modal

```
Name *      input[placeholder="e.g., USCD, TA Cabinetry"]
Slug        input[placeholder="Auto-generated if empty"]
Sort Order  number input (default: 0)
Status      react-select (Active default)

Buttons: Cancel | Create (blue)
```

---

## Known Issues / Observations

### 1. Platform Filter May Not Work Client-Side

- When selecting "Shopify" platform filter, all 17 partners may still show
- Appears to be an issue with the `change` event not firing properly on the
  native select
- **Workaround**: Use Playwright's `selectOption()` which should trigger proper
  events

### 2. Session Expired Error on Empty Form Submit

- Submitting the Add Partner form with empty fields sometimes shows "Session
  expired" toast
- This is likely a backend validation response, not a true session issue
- Frontend validation should catch required fields before API call

### 3. FAQs Tab Initial State

- TestRakibulQA (id=7191) has "No FAQs added yet" on the FAQs tab
- This is expected for test partners

### 4. Missing Attribute Type Filter with "Product Attribute Type"

- The dropdown shows "Product Attribute Type" and "Partner Attribute Type"
- "Product" = 54 types (those without Partner Page)
- "Partner" = 4 types (those with Partner Page = Yes)

---

## Automation Strategy Notes

### Content Loading Strategy

```js
// Wait for SPA content to load
await page.waitForFunction(() =>
  document.querySelector('#wpbody-content')?.innerText?.includes('Dashboard')
);

// Or wait for specific element
await page.waitForSelector('table tbody tr');

// Extract all text content
const content = await page.evaluate(
  () => document.querySelector('#wpbody-content').innerText
);
```

### React Select Interaction Strategy

```js
// Method 1: Click container then click option
await page.locator('.css-gqbp6w:has-text("Select")').first().click();
// Wait for dropdown to open
await page.locator('[class*="option"]').filter({ hasText: 'Radio' }).click();

// Method 2: For status dropdowns with react-select
// First find the react-select container, click it, then select option
```

### Native Select Strategy (for list filters)

```js
// These use native <select> elements
await page.locator('select').first().selectOption('shopify'); // Platform filter
await page.locator('select').nth(1).selectOption('active'); // Status filter
await page.locator('select:nth-of-type(2)').selectOption('missing'); // Missing SKU filter
```

### Modal Interaction Pattern

```js
// Open modal
await page.locator('button:has-text("Add Type")').click();

// Wait for modal
await page.waitForSelector(
  'h2:has-text("Add Attribute Type"), h3:has-text("Add Attribute Type")'
);

// Fill fields
await page.locator('input[placeholder="e.g., Color, Size"]').fill('Test Type');

// Close with Cancel (find the border-gray Cancel button, not the WP link Cancel)
const cancelBtn = await page.evaluateHandle(() =>
  Array.from(document.querySelectorAll('button')).find(
    (b) =>
      b.innerText.trim() === 'Cancel' && b.className.includes('border-gray')
  )
);
await cancelBtn.click();
```

### Accordion Interaction Pattern

```js
// Partner Attributes accordion sections
await page.locator('.cursor-pointer:has-text("Partner Colors")').click();
// Wait for expansion
await page.waitForSelector('button:has-text("Select All")');
```

---

## Screenshots Taken

All screenshots saved to `transcripts/scenarios/screenshots/`:

```
01-dashboard-fresh.png          - Dashboard loaded state
02-partners-list-full.png       - Partners list full view
03-add-partner-form.png         - Add Partner form empty
04-add-partner-validation.png   - Add Partner form with validation errors
05-add-partner-filled.png       - Add Partner form filled with data
06-partner-faqs-tab.png         - Partner FAQs & Shipping tab
07-partner-shipping-returns.png - Shipping & Returns policy form
08-partner-products-tab.png     - Partner Products tab
09-partner-products-selector.png - Partner product selection panel
10-products-list.png            - Products list view
11-add-product-basic-info.png   - Add Product Basic Info tab
12-product-edit-basic-info.png  - Product Edit Basic Info
13-attributes-add-type.png      - Add Attribute Type modal
14-add-attribute-type-modal.png - Add Attribute Type modal (detailed)
15-attribute-type-dropdown.png  - Type dropdown interaction
16-attribute-values-list.png    - Attribute Values list
17-attribute-value-edit.png     - Edit Attribute Value modal
18-add-catalog-modal.png        - Add Catalog modal
19-settings-general.png         - Settings General tab
20-settings-products.png        - Settings Products tab
21-settings-partner-release.png - Settings Partner Release tab
22-settings-others.png          - Settings Others tab
23-sync-logs.png                - Sync Logs list
24-sync-log-details.png         - Sync Log Details modal (summary)
25-log-details-technical.png    - Sync Log Technical Details with JSON
26-partner-order-log.png        - Partner Order Log tab
```
