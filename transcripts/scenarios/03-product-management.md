# Module 03 — Product Management

**URL**:
`https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/admin.php?page=connector-hub#/products`  
**Prerequisite**:
WordPress admin authenticated  
**Live Data** (verified 2026-06-02): 44 Products in 3 categories (Wood Hoods,
Quick Shipping, Floating Shelves)

---

## SCENARIO-03-01: Products list loads with correct table and filters

**Purpose**: Verify the products list page renders all UI elements correctly.

### Steps

1. Navigate to `#/products`
2. Wait for list to load

### Expected Results

- Page heading: "Products"
- Sub-heading: "Manage your products and their attributes"
- "Add Product" button (top right)
- Search input: placeholder "Search products..."
- Filter 1: Partner dropdown — "All Partners" + 17 partner names
- Filter 2: Status dropdown — "All Status", "Active", "Draft", "Inactive",
  "Trash"
- Table columns: PRODUCT (name + SKU badge), CATEGORY, STATUS, ACTIONS
- Pagination: "Showing 1–20 of 44 products" with pages 1, 2, 3

### Partner Filter Options (17 partners)

```
All Partners
TestRakibulQA
RakibulQAPartner
ManualQAPartner
Palash Staging Site
Delowar-Public-App-Testing
Ali Local Magento
TicTacTo 007
delowar-staging-test
The range hoods
Delowar Development Store
Automation_Partner
Alamin
Magento Staging
badrul-local-app
Demo Partner
Demo Partner B
Demo Partner C
```

---

## SCENARIO-03-02: Search products by name filters results

**Purpose**: Verify search input filters product list by name.

### Steps

1. Navigate to `#/products`
2. Type "Curved" in search input
3. Verify only products matching "Curved" appear

### Expected Results

- Products with "Curved" in name should appear (e.g., Double Curved, Curved
  Slim, Curved Quick Ship, Curved Shaker White Quick Ship, Curved With Strapping
  Quick Ship, etc.)
- Clearing search: full list of 44 restores

### Selectors

```js
await page.locator('input[placeholder="Search products..."]').fill('Curved');
```

---

## SCENARIO-03-03: Partner filter shows products belonging to a specific partner

**Purpose**: Verify filtering by partner shows only that partner's products.

### Steps

1. Navigate to `#/products`
2. Select "TestRakibulQA" from the partner dropdown
3. Verify filtered results

### Expected Results

- Only products assigned to TestRakibulQA are shown
- Live data: TestRakibulQA has 3 products (Double Curved VEN-DBC, Angled
  VEN-LCX, Curved VEN-CCX)
- Pagination should reflect filtered count

---

## SCENARIO-03-04: Status filter works for product status

**Purpose**: Verify filtering products by status.

### Steps

1. Navigate to `#/products`
2. Select "Active" from status dropdown
3. Verify only Active products show
4. Select "Draft" — verify draft products (if any)
5. Select "Trash" — verify trash products (if any)

### Expected Results

- Most products are "Active"
- Status badge colors: Active=green, Draft=gray/yellow, Inactive=red

---

## SCENARIO-03-05: Products list pagination works (3 pages of 20 products each)

**Purpose**: Verify pagination controls navigate correctly.

### Steps

1. Navigate to `#/products`
2. Verify 20 products on page 1
3. Click "2" page button
4. Verify next 20 products load
5. Click "3" page button
6. Verify remaining 4 products load
7. Click "Previous" to go back

### Expected Results

- Page 1: 20 products (Showing 1–20 of 44)
- Page 2: 20 products (Showing 21–40 of 44)
- Page 3: 4 products (Showing 41–44 of 44)
- Previous/Next buttons work

---

## SCENARIO-03-06: Product row shows correct data and action buttons

**Purpose**: Verify each product row has correct columns and actions.

### Per Row Structure

- Product name (bold) + SKU badge (e.g., "VEN-DBC" in gray pill)
- Category name (e.g., "Wood Hoods", "Quick Shipping", "Floating Shelves")
- Status badge (Active/Draft/Inactive) with color
- ACTIONS: Edit (blue hover pen icon), Delete (red hover trash icon)

### SKU Format

All products follow `VEN-XXX` pattern:

- `VEN-DBC` = Double Curved
- `VEN-LCX` = Angled
- `VEN-CCX` = Curved
- `VEN-QSPCCX` = Curved Quick Ship
- etc.

---

## SCENARIO-03-07: "Add Product" button navigates to product creation form

**Purpose**: Verify Add Product button opens creation form.

### Steps

1. Navigate to `#/products`
2. Click "Add Product" button
3. Verify navigation

### Expected Results

- URL: `#/products?action=add`
- Heading: "Add New Product"
- "Back to Products" link
- 3 tabs visible: Basic Info, Attributes, Partners
- Cancel + "Create Product" buttons (top AND bottom)

---

## SCENARIO-03-08: Add Product — Basic Info tab has all required fields

**Purpose**: Verify all fields in the Basic Info tab of Add Product form.

### Steps

1. Navigate to `#/products?action=add`
2. Verify all fields are present

### Form Fields

| Field          | Type            | Required | Selector                                   | Notes                          |
| -------------- | --------------- | -------- | ------------------------------------------ | ------------------------------ |
| Product Title  | text            | Yes      | `input[placeholder="Enter product title"]` | Free text                      |
| Product SKU    | text            | Yes      | `input[placeholder="e.g., VEN-001"]`       | Unique identifier              |
| Status         | select (native) | No       | `select` (1st)                             | Draft/Active/Inactive          |
| Description    | rich text       | No       | TinyMCE editor                             | "Add media" + Visual/Code tabs |
| Dimensions     | rich text       | No       | TinyMCE editor                             | Second rich text editor        |
| Category       | select (native) | No       | `select` (last — value=9 for Wood Hoods)   | 3 options                      |
| Product Images | file            | No       | "Add Images" button                        | Opens WP media picker          |

### Category Options

```js
// Category select options
// '' = Select a category
// 9 = Wood Hoods (or relevant ID for Wood Hoods)
// value for Floating Shelves
// value for Quick Shipping
```

### Buttons (Dual)

- Top: "Cancel" (link to `#/products`) + "Create Product"
- Bottom: "Cancel" (link to `#/products`) + "Create Product"

### Image Handling

- New product: "Add Images" button
- Existing product with images: "Add More Images" button

---

## SCENARIO-03-09: Add Product — Attributes tab shows all 58 attribute types

**Purpose**: Verify the Attributes tab lists all attribute types for selection.

### Steps

1. Navigate to `#/products?action=add`
2. Click "Attributes" tab
3. Verify all attribute types are listed

### Expected Results

- Heading: "Select which attributes apply to this product. These will be
  available for all partners."
- 58 attribute types listed, each showing "X selected" count (all 0 for new
  product)
- Each is an expandable accordion section
- All 4 Partner-page attributes are also listed: Partner Colors, Partner
  Ventilations, Partner Trims, Partner Sizes

### All 58 Attribute Types (in display order)

```
1.  Color Options
2.  Color
3.  Color Match Selection
4.  Size
5.  Ventilation Options 30
6.  Ventilation Options 36
7.  Ventilation Options 42
8.  Ventilation Options 48
9.  Ventilation Options 54
10. Ventilation Options 60
11. Broan 30 Options
12. Hauslane 30 Options
13. Hauslane 36 Options
14. Tradewinds 30 Options
15. Zline 30 Options
16. Vent A Hood 30 Options
17. Broan 36 Options
18. Tradewinds 36 Options
19. Zline 36 Options
20. Vent A Hood 36 Options
21. Tradewinds 42 Options
22. Zline 42 Options
23. Vent A Hood 42 Options
24. Tradewinds 48 Options
25. Zline 48 Options
26. Vent A Hood 48 Options
27. Tradewinds 54 Options
28. Zline 54 Options
29. Vent A Hood 54 Options
30. Tradewinds 60 Options
31. Zline 60 Options
32. Vent A Hood 60 Options
33. Non Duct Kit Broan
34. Non Duct Kit Hauslane
35. Non Duct Kit Tradewinds
36. Non Duct Kit Zline
37. Add Recirculating Vent
38. Increase Depth To 193125
39. Increase Depth To 225
40. Increase Depth
41. Trim Options
42. How Would You Like Your Trim
43. Crown Molding
44. Reduce Height
45. Extend Your Chimney
46. Add Solid Bottom
47. Non Duct Kit
48. Remove Strapping
49. Select Width
50. Select Depth
51. Select Thickness
52. Do You Plan On Painting Or Staining This Hood
53. Sherwin Williams Color Code (slug: sherwin-williams_color_code)
54. Sherwin Williams Color Code (slug: sherwin_williams_color_code)
55. Partner Colors
56. Partner Ventilations
57. Partner Trims
58. Partner Sizes
```

---

## SCENARIO-03-10: Edit Product — Attributes tab shows selected attribute values for a real product

**Purpose**: Verify an existing product's attribute selections load correctly.

### Steps

1. Navigate to `#/products`
2. Click edit on "Double Curved" (VEN-DBC, id=5082)
3. Click "Attributes" tab
4. Verify selected counts

### Expected Results for Double Curved (VEN-DBC)

```
Color Options: 2 selected
Color Match Selection: 2 selected
Size: 15 selected
Ventilation Options 36: 6 selected
Ventilation Options 42: 4 selected
Ventilation Options 48: 4 selected
Ventilation Options 54: 4 selected
Ventilation Options 60: 4 selected
Hauslane 36 Options: 1 selected
Broan 36 Options: 2 selected
Tradewinds 36 Options: 3 selected
Zline 36 Options: 1 selected
Vent A Hood 36 Options: 3 selected
... (and many more)
```

---

## SCENARIO-03-11: Edit Product — Partners tab shows per-partner pricing configuration

**Purpose**: Verify the Partners tab allows per-partner custom title, SKU, and
attribute price overrides.

### Steps

1. Navigate to product edit form (e.g., Double Curved id=5082)
2. Click "Partners" tab
3. Expand a partner section (e.g., TestRakibulQA)
4. Verify the pricing override table

### Expected Results

- Heading: "Select which partners can access this product. You can set custom
  titles, SKUs, and price overrides per partner."
- One section per partner who has access to this product
- Each partner section has:
  - "Custom Title" input field
  - "Custom SKU" input field
  - "Price Overrides" section with table:
    - Columns: ATTRIBUTE | BASE PRICE | PARTNER PRICE
    - All product's attribute values listed with their base prices
    - PARTNER PRICE: editable number input for per-partner override

### Price Override Examples (TestRakibulQA for Double Curved)

```
Our Color Options:  $0 base  | [partner price input]
Yes:                $450 base | [partner price input]
390 CFM (IN-R230SS-36): $750 base | [partner price input]
300 CFM (PM300SS): $300 base | [partner price input]
...
```

---

## SCENARIO-03-12: Edit Product — Basic Info shows pre-filled data for existing product

**Purpose**: Verify existing product data pre-fills the edit form correctly.

### Steps

1. Navigate to product edit (Double Curved, id=5082)
2. Click "Basic Info" tab
3. Verify all fields

### Expected Results (Double Curved)

| Field         | Value                                                  |
| ------------- | ------------------------------------------------------ |
| Product Title | "Double Curved"                                        |
| Product SKU   | "VEN-DBC"                                              |
| Status        | "active"                                               |
| Category      | "Wood Hoods" (value=9)                                 |
| Images        | "Add More Images" button visible (has existing images) |
| Description   | Rich text content about the product                    |

---

## SCENARIO-03-13: Product categories shown in list match Settings > Products > Categories

**Purpose**: Verify product categories in the list match the configured
categories.

### Steps

1. Navigate to `#/products` and note categories in list
2. Navigate to `#/settings` > Products tab > Categories sub-tab
3. Compare

### Expected Results

- Both show same 3 categories: Wood Hoods, Floating Shelves, Quick Shipping
- Product list category column shows correct category for each product
