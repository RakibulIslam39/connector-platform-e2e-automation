# Module 07 — Platform Settings

**URL**:
`https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub#/settings`  
**Prerequisite**:
WordPress admin authenticated

---

## SCENARIO-07-01: Settings page loads with 4 tabs

**Purpose**: Verify the Settings module renders correctly with all sub-tabs.

### Steps

1. Navigate to `#/settings`
2. Verify page structure

### Expected Results

- Page heading: "Settings"
- Sub-heading: "Configure your connector platform settings"
- Four tab buttons: General | Products | Partner Release | Others

---

## SCENARIO-07-02: General settings tab — Auto-sync toggle and Webhook timeout

**Purpose**: Verify General settings has Auto-sync checkbox and Webhook Timeout
field.

### Steps

1. Navigate to `#/settings`
2. "General" tab is default
3. Verify fields present

### General Tab Fields

| Field                       | Type     | Default        | Selector                           |
| --------------------------- | -------- | -------------- | ---------------------------------- |
| Auto-sync on product update | checkbox | Checked (true) | `input[type="checkbox"]:not([id])` |
| Webhook Timeout (seconds)   | number   | 30             | `input[placeholder="30"]`          |
| Save Settings               | button   | —              | `button:has-text("Save Settings")` |

### Auto-sync Behavior

- When checked: product changes automatically sync to partners via webhook
- When unchecked: manual sync required
- Live state: Currently **CHECKED** (enabled)

### Webhook Timeout

- Number input, current value: 30 seconds
- Increase for slower partner APIs

### Selectors

```js
// Auto-sync checkbox
const autoSync = page.locator('input[type="checkbox"].w-4.h-4');
const isChecked = await autoSync.isChecked();
expect(isChecked).toBe(true);

// Webhook timeout
const timeout = page.locator('input[placeholder="30"]');
expect(await timeout.inputValue()).toBe('30');

// Save button
await page.locator('button:has-text("Save Settings")').click();
```

### Save Settings

- Click "Save Settings" → success toast notification appears
- Verify the checkbox and number states are preserved after refresh

---

## SCENARIO-07-03: General settings — toggle Auto-sync and save

**Purpose**: Verify toggling the auto-sync checkbox and saving persists the
change.

### Steps

1. Navigate to `#/settings` > General
2. Check if "Auto-sync on product update" is checked
3. Uncheck it
4. Click "Save Settings"
5. Verify success notification
6. Refresh page
7. Verify the checkbox remains unchecked
8. Re-enable and save

### Expected Results

- Change persists across page refresh
- Success toast: something like "Settings saved" or "Success"

---

## SCENARIO-07-04: Products settings tab — FAQs sub-section

**Purpose**: Verify the Products settings tab has FAQs, Shipping & Returns, and
Categories sub-sections.

### Steps

1. Navigate to `#/settings` > Products tab
2. Verify sub-section tabs
3. Verify FAQs sub-section content

### Expected Results

- Heading: "Manage product-related information for partners."
- Three sub-tabs: FAQs | Shipping & Returns | Categories
- Default: FAQs sub-tab
- FAQs sub-text: "Default FAQs shown to all partners. Partner-specific FAQs are
  managed from each partner's form."
- "Add FAQ" button
- Current state: "No FAQs found. Add one to get started." (empty)

### Add FAQ Form (same as Partner's FAQ form)

- Label field
- Title input
- Answer: rich text editor (TinyMCE)
- Delete / Done buttons

---

## SCENARIO-07-05: Products settings — Shipping & Returns default policies

**Purpose**: Verify the Shipping & Returns sub-section shows global policies.

### Steps

1. Navigate to `#/settings` > Products > Shipping & Returns
2. Verify existing policies

### Expected Results

- Sub-text: "Default shipping & return policies shown to all partners.
  Partner-specific policies are managed from each partner's form."
- "Add Policy" button
- Existing policies (live data): 3 policies:
  1. "LTL Shipping – Residential"
  2. "Custom Color Match Program"
  3. "Return Policy"

### Shipping Policy Form

- Label: text input
- Title: text input
- Description: rich text editor
- Delete / Done buttons

---

## SCENARIO-07-06: Products settings — Categories CRUD

**Purpose**: Verify product categories can be added, edited, and deleted in
Settings.

### Steps

1. Navigate to `#/settings` > Products > Categories
2. Verify existing categories
3. Click "Add Category"
4. Fill form and create
5. Edit existing category
6. Delete test category

### Expected Results

- 3 categories shown: | Name | Slug | Sort | Status | |---|---|---|---| | Wood
  Hoods | wood-hoods-product-category | 0 | Active | | Floating Shelves |
  floating-shelves | 0 | Active | | Quick Shipping | quick-shipping | 0 | Active
  |

### Add Category

- Click "Add Category" button
- Fill Name (slug auto-generated)
- Sort Order and Status fields
- Click "Create"

### Edit Category

- Click edit icon → Edit modal pre-fills
- Modify and click "Update"
- Verify change in list

### Delete Category

- Click delete icon → confirmation dialog
- Cancel or Confirm

### Selectors

```js
// Categories sub-tab in Products settings
await page.locator('button:has-text("Categories")').click();

// Add Category button
await page.locator('button:has-text("Add Category")').click();
```

---

## SCENARIO-07-07: Partner Release settings — Magento module fields

**Purpose**: Verify Partner Release tab shows Magento module configuration
fields.

### Steps

1. Navigate to `#/settings` > Partner Release
2. Verify Magento section

### Expected Results

- Section heading: "Manage release information for each partner platform."
- Platform tab: "Magento" (only Magento module release settings shown)
- "Magento Module" section with fields:
  - **Version**: text (placeholder: "e.g., 1.0.0")
  - **Release Date**: date input (format: mm/dd/yyyy)
  - **Download URL**: text (placeholder: "Enter download URL")
  - **Changelog URL**: text (placeholder: "Enter changelog URL")
  - **Changelog**: textarea (placeholder: "Enter changelog notes")
  - **Alert Message**: text (placeholder: "Enter alert message (optional)")
- "Save Settings" button

### Selectors

```js
// Version input
const versionInput = page.locator('input[placeholder="e.g., 1.0.0"]');

// Release date input
const dateInput = page.locator('input[type="date"]');

// Changelog textarea
const changelogArea = page.locator(
  'textarea[placeholder="Enter changelog notes"]'
);

// Save Settings
await page.locator('button:has-text("Save Settings")').click();
```

---

## SCENARIO-07-08: Partner Release — save version and release date

**Purpose**: Verify that entering version and release date and saving persists
correctly.

### Steps

1. Navigate to `#/settings` > Partner Release
2. Note current Version value
3. Change Version to "2.1.0"
4. Set Release Date to today's date
5. Enter Changelog notes
6. Click "Save Settings"
7. Refresh and verify saved data

---

## SCENARIO-07-09: Others settings tab — Shopify App URL configuration

**Purpose**: Verify the Others tab contains the Shopify App URL field.

### Steps

1. Navigate to `#/settings` > Others
2. Verify field

### Expected Results

- Field label: "Shopify App URL"
- Sub-text: "The URL for your Shopify connector app"
- URL input field (text or url type)
- "Save Settings" button

### Selectors

```js
// Navigate to Others tab
await page.locator('button:has-text("Others")').click();

// Shopify App URL input
const shopifyUrl = page
  .locator(
    'input[type="url"], input[placeholder*="shopify"], input[placeholder*="https"]'
  )
  .first();

// Save
await page.locator('button:has-text("Save Settings")').click();
```

---

## SCENARIO-07-10: Save Settings shows success notification for all tabs

**Purpose**: Verify that clicking "Save Settings" shows a success notification.

### Steps

1. Navigate to each Settings tab
2. Click "Save Settings" without changes
3. Verify toast/notification appears

### Expected Results

- A success toast notification appears (e.g., "Settings saved successfully" or
  similar)
- Toast auto-dismisses after a few seconds
- No error messages shown on valid save
