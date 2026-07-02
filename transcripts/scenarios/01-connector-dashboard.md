# Module 01 — Connector Hub Dashboard

**URL**: `https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub#/dashboard`  
**Prerequisite**: WordPress admin authenticated  
**Live Data** (verified 2026-06-02): 17 Partners | 44 Products | 58 Attribute Types | 300 Attributes  
**Platform Split**: WordPress=8 (47%), Magento=2 (12%), Shopify=7 (41%)

---

## SCENARIO-01-01: Dashboard loads and displays correct stat cards

**Purpose**: Verify dashboard renders all 4 stat cards with valid counts and correct headings.

### Steps
1. Navigate to `wp-admin/admin.php?page=connector-hub#/dashboard`
2. Wait for the SPA to load: `await page.waitForSelector('.cp-content-area, #wpbody-content')`
3. Extract inner text of `#wpbody-content`

### Expected Results
- Page heading contains "Dashboard"
- Sub-heading: "Overview of your connector platform"
- Four stat cards visible:
  - **TOTAL PARTNERS**: numeric count ≥ 1
  - **TOTAL PRODUCTS**: numeric count ≥ 1
  - **ATTRIBUTE TYPES**: numeric count ≥ 1
  - **TOTAL ATTRIBUTES**: numeric count ≥ 1
- Live verified counts: Partners=17, Products=44, Attribute Types=58, Attributes=300

### Selectors
```js
// Extract all stat card data
const stats = page.locator('#wpbody-content');
const text = await stats.innerText();
// Contains: 'TOTAL PARTNERS', 'TOTAL PRODUCTS', 'ATTRIBUTE TYPES', 'TOTAL ATTRIBUTES'
```

### Automation Notes
- SPA content loads dynamically; use `browser_evaluate` or `waitForFunction`
- Stat values may change as data grows — assert ≥ baseline, not exact match

---

## SCENARIO-01-02: Partners by Platform breakdown is displayed correctly

**Purpose**: Verify the pie/breakdown chart shows platform distribution.

### Steps
1. Navigate to Dashboard
2. Look for "Partners by Platform" section
3. Verify breakdown: WP=WordPress, M2=Magento, SH=Shopify

### Expected Results
- Section heading: "Partners by Platform" with "N total" sub-text
- Three rows showing platform icon abbreviations (WP, M2, SH)
- Each row: platform name, count, and percentage
- Total count equals sum of all platforms
- Live data: WordPress 8 (47%), Magento 2 (12%), Shopify 7 (41%)

### Selectors
```js
// Text-based extraction
const breakdownText = await page.evaluate(() =>
  document.querySelector('#wpbody-content').innerText
);
// Should include: 'WordPress', 'Magento', 'Shopify' with counts
```

---

## SCENARIO-01-03: Quick Actions links navigate to correct pages

**Purpose**: Verify all Quick Action buttons navigate to the correct modules.

### Steps
1. Navigate to Dashboard
2. Find the "QUICK ACTIONS" section
3. Click "Add Partner" → verify redirects to `#/partners?action=add`
4. Navigate back to Dashboard
5. Click "Add Product" → verify redirects to `#/products?action=add`
6. Navigate back to Dashboard
7. Under "Quick Navigation", click each link: Partners, Products, Attributes, Logs
8. Verify each navigates to the correct hash route

### Expected Results
| Action Button | Expected Route |
|---|---|
| Add Partner | `#/partners?action=add` |
| Add Product | `#/products?action=add` |
| Partners (nav) | `#/partners` |
| Products (nav) | `#/products` |
| Attributes (nav) | `#/attributes` |
| Logs (nav) | `#/logs` |

---

## SCENARIO-01-04: Settings quick access works from Dashboard

**Purpose**: Verify the Settings card in Quick Actions navigates correctly.

### Steps
1. Navigate to Dashboard
2. Find "Settings" in the Quick Actions / navigation area
3. Click "Manage platform settings" or "Settings" link
4. Verify navigation to `#/settings`

### Expected Results
- Settings page loads with 4 tabs: General, Products, Partner Release, Others

---

## SCENARIO-01-05: Top navigation menu is present and all links are functional

**Purpose**: Verify the left sidebar navigation of Connector Hub SPA is present and functional.

### Steps
1. Navigate to Dashboard
2. Verify sidebar shows: Dashboard, Partners, Products, Attributes, Settings, Logs
3. Click each nav item and verify the correct page loads

### Expected Results
| Nav Item | Route |
|---|---|
| Dashboard | `#/dashboard` |
| Partners | `#/partners` |
| Products | `#/products` |
| Attributes | `#/attributes` |
| Settings | `#/settings` |
| Logs | `#/logs` |

### Selectors
```js
// Left nav links
const navLinks = page.locator('#wpbody-content a[href*="#/"]');
```

---

## SCENARIO-01-06: Dashboard stat cards are clickable and link to their module

**Purpose**: Verify clicking on a stat card navigates to the related module.

### Steps
1. Navigate to Dashboard
2. Click on the TOTAL PARTNERS stat card
3. Verify navigation to Partners list `#/partners`
4. Go back; click TOTAL PRODUCTS
5. Verify navigation to Products list `#/products`

### Expected Results
- Clicking stat cards navigates to the corresponding module
- (If stat cards are not clickable, document as observation)

---

## SCENARIO-01-07: Dashboard Quick Navigation section has correct structure

**Purpose**: Verify Quick Navigation has all expected items.

### Steps
1. Navigate to Dashboard
2. Check "Quick Navigation" section

### Expected Results
- Contains links: Partners, Products, Attributes, Logs
- "Settings" section has sub-text "Manage platform settings"
