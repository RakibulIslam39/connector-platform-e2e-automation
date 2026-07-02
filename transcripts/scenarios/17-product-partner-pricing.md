# Module 17 — Product Partner Pricing & Custom Configuration

**URL**: `#/products?action=edit&id=[product_id]` → Partners tab  
**Prerequisite**: WordPress admin authenticated; product with partners assigned exists  
**Live Data** (verified 2026-06-02): Double Curved (VEN-DBC, id=5082) has TestRakibulQA partner with full price data

---

## Overview

The Partners tab within the Product edit form allows per-partner customization:
- **Custom Title**: Override the product's display name for a specific partner
- **Custom SKU**: Override the product's SKU for a specific partner's catalog
- **Price Overrides**: Override the base price of any attribute value for a specific partner

This is a critical feature for B2B pricing differentiation (different prices for different resellers).

---

## SCENARIO-17-01: Partners tab shows partner sections with custom fields

**Purpose**: Verify the Partners tab in product edit form shows expandable partner sections.

### Steps
1. Navigate to `#/products?action=edit&id=5082` (Double Curved)
2. Click "Partners" tab
3. Verify all partner sections

### Expected Results
- Tab description: "Select which partners can access this product. You can set custom titles, SKUs, and price overrides per partner."
- One section per assigned partner
- For partners NOT assigned: add/selection mechanism
- Each section has:
  - Partner name as header
  - "Custom Title" text input
  - "Custom SKU" text input
  - "Price Overrides" toggle/section label
  - ATTRIBUTE | BASE PRICE | PARTNER PRICE table

### Selectors
```js
// Partners tab button
await page.locator('button:has-text("Partners")').click();
```

---

## SCENARIO-17-02: Custom Title — override product title for a specific partner

**Purpose**: Verify that a custom title can be set for a partner's product listing.

### Steps
1. Navigate to product edit > Partners tab
2. Find "TestRakibulQA" section
3. Locate "Custom Title" input field
4. Enter a custom title (e.g., "Double Curved Hood (Custom)")
5. Click "Update Product"
6. Verify the custom title is saved

### Expected Results
- Custom Title input accepts free text
- On save: the custom title is sent to the partner site in place of the default product title
- In Sync Log Technical Details: `custom_title` field shows the entered value

### Selectors
```js
// Custom title input within partner section
// (partnerSection is the section div for a specific partner)
const customTitle = partnerSection.locator('input').first(); // or by label proximity
await customTitle.fill('Double Curved Hood - Partner Edition');
```

---

## SCENARIO-17-03: Custom SKU — set partner-specific product SKU

**Purpose**: Verify that a custom SKU can be set for a partner's product listing.

### Steps
1. Navigate to product edit > Partners tab
2. Find "Custom SKU" input within a partner section
3. Enter a custom SKU (e.g., "PARTNER-VEN-DBC-001")
4. Save and verify

### Expected Results
- Custom SKU is stored for this partner-product combination
- Overrides the default "VEN-DBC" SKU in the partner's catalog

---

## SCENARIO-17-04: Price Overrides table shows all product attributes with base prices

**Purpose**: Verify the price override table shows all attribute values configured for the product.

### Steps
1. Navigate to product edit (Double Curved id=5082) > Partners tab
2. Expand/scroll to "Price Overrides" for TestRakibulQA
3. Verify the attribute table

### Expected Results
- Table columns: ATTRIBUTE | BASE PRICE | PARTNER PRICE
- Every attribute value assigned to this product is listed
- Base prices are the values from the Attribute Values configuration
- Partner Price column: editable number input (empty = uses base price)

### Live Price Override Data (Double Curved / TestRakibulQA)
| Attribute | Base Price |
|---|---|
| Our Color Options | $0 |
| Yes (Color Match) | $450 |
| None | $0 |
| 390 CFM (IN-R230SS-36) | $750 |
| 300 CFM (PM300SS) | $300 |
| 700 CFM (698-34) | $860 |
| 300 CFM - 19 1/4 Depth | $1,175 |
| 390 CFM (HL4423RC) | $935 |
| 700 CFM (698-40) | $980 |
| ... (many more ventilation options) | varies |
| Add Non-Duct Kit (HARKPM21) | $100 |
| Add Non-Duct Kit (CFI010) | $25 |
| Yes (Recirculating Vent) | $130 |
| Increase Interior Depth 19.3125" | $260 |
| Increase Interior Depth 20.5" | $260 |
| Increase Interior Depth 22.5" | $390 |
| Classic Trim | $0 |
| Block Trim | $0 |
| Flat Trim | $0 |
| No Crown Molding | $0 |
| Remove 1" (Reduce Height) | $165 |
| Remove 2" (Reduce Height) | $165 |
| Remove 3" (Reduce Height) | $165 |
| Remove 4" (Reduce Height) | $165 |
| 6" Extension (Chimney) | $230 |
| 12" Extension (Chimney) | $285 |
| 24" Extension (Chimney) | $325 |
| Yes (Solid Bottom) | $260 |

---

## SCENARIO-17-05: Setting a partner price override saves and is applied during sync

**Purpose**: Verify that entering a partner price override saves and is reflected in sync payload.

### Steps
1. Navigate to product edit > Partners tab
2. Find price override table for TestRakibulQA
3. Find "Yes (Color Match Selection)" with base price $450
4. Enter partner price: "500" in the Partner Price input
5. Click "Update Product"
6. Trigger a sync for this partner
7. Check Sync Log Details > Technical Details for the price value

### Expected Results
- Partner price "$500" saved for "Yes" attribute value
- On sync: the payload sends $500 instead of $450 for this partner
- Other partners still receive $450 base price

---

## SCENARIO-17-06: Removing a price override reverts to base price

**Purpose**: Verify clearing a partner price override reverts to base price.

### Steps
1. Follow SCENARIO-17-05 to set a price override
2. Return to partner price override table
3. Clear the partner price input (set to empty)
4. Save
5. Verify the partner price column is empty (means use base price)

### Expected Results
- Empty partner price = use base price from Attribute Values
- No override stored

---

## SCENARIO-17-07: Multiple partners can have different price overrides for same attribute

**Purpose**: Verify price override isolation between partners.

### Steps
1. Navigate to product edit > Partners tab
2. Set price for Attribute A to $500 for Partner 1
3. Verify Partner 2 still shows base price for Attribute A
4. Set price for Attribute A to $600 for Partner 2
5. Verify Partner 1 still shows $500

### Expected Results
- Price overrides are per-partner, per-product, per-attribute-value
- Changes to one partner's price don't affect another partner's price

---

## SCENARIO-17-08: Product Partners tab — adding a partner to a product

**Purpose**: Verify the flow to add a partner to a product's available partners.

### Steps
1. Navigate to product edit > Partners tab
2. Look for an "Add Partner" mechanism or unassigned partners
3. Select/enable a partner for this product
4. Save

### Expected Results
- New partner section appears in Partners tab
- Partner can now configure custom title, SKU, and prices
- Product appears in that partner's product list on partner site

---

## Related: Partner's Products Tab vs Product's Partners Tab

**Two-way relationship management**:

| From Partner Edit > Products tab | From Product Edit > Partners tab |
|---|---|
| Shows products assigned to this partner | Shows partners assigned to this product |
| "Add Products" button → selects from 41 available products | Shows per-partner config section |
| Custom Title editable per product | Custom Title + Custom SKU + Price Overrides |
| Both result in the same partner-product relationship |
