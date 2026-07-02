# Module 06 — Color Catalog

> **Page Object:** `pages/connector/color-catalog.page.js`
> **Data:** `json-data/color-catalog.json`
> **Spec File:** `tests/connector/color-catalog.spec.js` (to be created)
> **Status:** Pending

---

## Feature Overview

The Color Catalog manages the full list of color options available across all partner brands. Colors are partner-specific — each partner brand (USCD, Hoodsly, TA Cabinetry, Jarlin, Jim Bishop, Homemark, JSI) has its own named color options with associated SKU codes and finish types.

**Color Catalog from Live API (grouped by brand):**

| Brand | Sample Colors |
|-------|--------------|
| USCD | Shaker White, Shaker Antique White, Shaker Driftwood, etc. |
| Hoodsly | Raw / Unfinished, Primed / Paint Ready |
| TA Cabinetry | TA-specific finishes |
| Jarlin | Jarlin-specific finishes |
| Jim Bishop | JB-specific finishes |
| Homemark | HM-specific finishes |
| JSI | JSI-specific finishes |

**Color fields:** `name` (display label), `sku` (code appended to Master SKU), `finishType` (paint/stain/raw)

---

## Scenarios

### SCENARIO-06-01: Color Catalog page loads
**Priority:** High (smoke)
**Steps:**
1. Navigate to Color Catalog page (URL from Platform Settings or dedicated page)
2. Verify color list renders
3. Verify at least one color entry is visible

**Expected Result:** Color Catalog page loads with data

---

### SCENARIO-06-02: Color catalog contains expected brands
**Priority:** High
**Steps:**
1. Load color catalog
2. Verify brand groups are shown: USCD, Hoodsly (at minimum)
3. Verify each group has at least one color entry

**Expected Result:** Both core brands present

---

### SCENARIO-06-03: Color entry shows correct SKU code
**Priority:** High
**Steps:**
1. Find "Raw / Unfinished" color in catalog
2. Verify its SKU code = `RAW`
3. Find "Primed / Paint Ready"
4. Verify its SKU code = `PRMD`
5. Find "Shaker White" (USCD)
6. Verify its SKU code = `SWKW` or equivalent

**Expected Result:** Color SKU codes match live API data
**Test Data:** `json-data/color-catalog.json`

---

### SCENARIO-06-04: Add a new color to the catalog (UI)
**Priority:** Medium
**Pre-condition:** Admin access to color catalog
**Steps:**
1. Click "Add Color" button
2. Fill: Name = "Test Finish", Brand = "Hoodsly", SKU = "TST", Finish Type = "paint"
3. Save
4. Verify new color appears in list

**Expected Result:** New color is added successfully

---

### SCENARIO-06-05: Color options reflect in partner product order display (integration)
**Priority:** High
**Steps:**
1. Confirm a partner has "Shaker White:USCD" as an assigned color
2. Place a test order on partner site for a product
3. Verify "Shaker White" appears as a color option in the order form
4. Select it and verify the Master SKU includes the USCD color SKU code

**Expected Result:** Color catalog drives product color options on partner site

---

## MCP Codegen Notes

```bash
# Capture color catalog page selectors:
npx playwright codegen https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub
# Navigate to color catalog section (may be under settings or its own menu)
```

## Known Complexities
- Color SKU codes vary by partner brand — a color named "Shaker White" for USCD has a different code than a similar color for another brand
- Some colors are only available to specific partners — test with partner-scoped color config
