# Module 05 — SKU Generation

**Business Logic**: The Master SKU is a concatenation of product and attribute
codes used to identify orders in HoodslyHub.  
**Live Data** (verified 2026-06-02)

---

## SKU Structure

The Master SKU is assembled as:

```
[Product SKU]-[Size SKU]-[Color/Other attribute SKU codes]
```

### Example Master SKUs

| Product                 | Size           | Color              | Master SKU         |
| ----------------------- | -------------- | ------------------ | ------------------ |
| Double Curved (VEN-DBC) | 30"x30" (3030) | White (WHT)        | `VEN-DBC-3030-WHT` |
| Angled (VEN-LCX)        | 36"x36" (3636) | Black (BLK)        | `VEN-LCX-3636-BLK` |
| Curved (VEN-CCX)        | 36"x48" (3648) | Antique White (AW) | `VEN-CCX-3648-AW`  |

---

## SCENARIO-05-01: Size attribute SKU values are correctly mapped

**Purpose**: Verify Size attribute values have correct SKU codes in the
database.

### Steps

1. Navigate to `#/attributes` > Attribute Values
2. Filter by "Size" attribute type
3. Verify SKU column for each size

### Expected Size → SKU Mapping (34 values)

| Size Name              | SKU  |
| ---------------------- | ---- |
| 30" x 30"              | 3030 |
| 30" Width x 36" Height | 3036 |
| 31" x 36"              | 3136 |
| 30" x 36"              | 3036 |
| 30" Width x 48" Height | 3048 |
| 31" x 48"              | 3148 |
| 30" x 48"              | 3048 |
| 36" Width x 36" Height | 3636 |
| 37" x 36"              | 3736 |
| 36" x 30"              | 3630 |
| 36" Width x 48" Height | 3648 |
| 37" x 48"              | 3748 |
| 36" x 36"              | 3636 |
| 43" x 36"              | 4336 |
| 36" x 48"              | 3648 |
| 43" x 48"              | 4348 |
| 42" x 30"              | 4230 |
| 49" x 36"              | 4936 |
| 42" x 36"              | 4236 |
| ...                    | ...  |

---

## SCENARIO-05-02: Color attribute values have SKU codes for Master SKU generation

**Purpose**: Verify Partner Colors have SKU codes where applicable.

### Steps

1. Navigate to `#/attributes` > Attribute Values
2. Filter by "Partner Colors" type
3. Check which colors have SKU codes

### Expected Results

- Most Partner Colors have `—` (no SKU) as they're referenced by name, not SKU
  code
- Some color types (like Color Match Selection "Yes") may have a value-based SKU
- SKU assignment depends on the business rules for that attribute type

---

## SCENARIO-05-03: Attribute Values "Missing SKU" filter identifies gaps

**Purpose**: Verify 133 attribute values are flagged as missing SKU codes.

### Steps

1. Navigate to `#/attributes` > Attribute Values
2. Select "Missing SKU" from the second filter
3. Verify count = 133

### Expected Results

- 133 values show with "—" in SKU column
- These are mostly color and option attributes that don't contribute to master
  SKU
- Important for QA: any attribute used in SKU generation MUST have a SKU code

---

## SCENARIO-05-04: Master SKU is generated during order creation on partner site

**Purpose**: Verify that when an order is placed on the partner site, the Master
SKU is generated.

### Steps

1. Place a test order on the partner's WooCommerce/Shopify/Magento site
2. Select product with known attributes
3. Complete the order
4. Check the order in HoodslyHub
5. Verify the Master SKU in the order matches the formula

### Expected Results

- Master SKU format: `[Product SKU]-[Size Code]-[Other codes...]`
- Can be validated using the Logs > Partner Order Log with the order ID

---

## SCENARIO-05-05: Short SKU generation follows product SKU prefix pattern

**Purpose**: Verify Short SKU is a compact version of the master SKU.

### Steps

1. Navigate to a product's attributes
2. Observe SKU codes for each attribute type's values
3. Short SKU = product prefix + key attribute codes

### Short SKU Pattern

- Based on `VEN-` prefix for all Hoodsly products
- Attribute codes appended based on product configuration
- Example: `VEN-DBC` + size + trim option codes

---

## SCENARIO-05-06: SKU validation in HoodslyHub order management

**Purpose**: Verify that orders in HoodslyHub can be validated by their Master
SKU.

### Steps

1. Note a placed order's Master SKU from partner site
2. Navigate to HoodslyHub order management
3. Search or filter by Master SKU
4. Verify the correct product and attributes are shown

---

## SCENARIO-05-07: Attribute SKU codes can be updated and reflect in new orders

**Purpose**: Verify that updating an attribute value's SKU code affects new
order SKUs.

### Steps

1. Navigate to `#/attributes` > Attribute Values
2. Find a Size value (e.g., "36" x 36"")
3. Edit and change its SKU from "3636" to "3636A" (test value)
4. Place a new order with this size
5. Verify Master SKU now includes "3636A"
6. Revert the SKU back to "3636"

### Caution

- Changing SKU codes affects ALL future orders using this attribute value
- Existing orders retain their original SKUs
- Coordinate with business before changing live SKU codes

---

## SCENARIO-05-08: SKU Helper utility generates expected master SKU format

**Purpose**: Verify the `helpers/sku-helper.js` utility generates correct SKU
codes.

### Steps

1. Run the SKU helper with known inputs
2. Verify output matches expected Master SKU

### Using sku-helper.js

```js
const { generateMasterSku, generateShortSku } = require('./helpers/sku-helper');

// Generate master SKU for Double Curved, 36x36, White
const masterSku = generateMasterSku('VEN-DBC', { size: '3636', color: 'WHT' });
console.log(masterSku); // Expected: 'VEN-DBC-3636-WHT'
```
