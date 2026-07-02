# Module 08 — REST API Endpoints

> **Base URL:** `https://hoodslypartnersconnector3.kinsta.cloud`
> **Auth:** `api-signature` header + `website` header
> **Spec Files:** `tests/api/products-api.spec.js`, `tests/api/attributes-mapping-api.spec.js`
> **Status:** Partially automated ✅ — extend with new endpoints

---

## Feature Overview

The Connector Platform exposes REST API endpoints used by partner site plugins to sync product data and manage orders. Auth requires two headers:
- `api-signature: 0N611zTpYJ4DyZ907geVnf7jKaM3RXaufixLs819t0Ofx4grhsV9HTUXdKiyTYHe`
- `website: {partner_site_base_url}`

**Known Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wp-json/connector-platform/v1/products` | GET | All products available to the partner |
| `/wp-json/connector-platform/v1/attributes-mapping` | GET | Attribute → SKU mapping data |
| `/wp-json/connector-platform/v1/partners` | GET | Partner list |
| `/wp-json/connector-platform/v1/partner-colors` | GET | Colors per partner |
| `/wp-json/connector-platform/v1/sku` | GET | SKU management data |
| `/wp-json/connector-platform/v1/sync-status` | GET | Sync health/status |

---

## Scenarios

### SCENARIO-08-01: Products API returns 200 with valid structure ✅ DONE
**Priority:** High
**Spec:** `tests/api/products-api.spec.js`
**Assertions covered:**
- HTTP 200 response
- Body has `{ success: true, partner_type, data: [...] }`
- `data` is a non-empty array
- Each product has `id`, `sku`, `title`, `category` fields
- Response time < 10 seconds

---

### SCENARIO-08-02: Attributes Mapping API returns 200 with valid structure ✅ DONE
**Priority:** High
**Spec:** `tests/api/attributes-mapping-api.spec.js`
**Assertions covered:**
- HTTP 200 response
- Body has `Size` group with value/sku entries
- Body has `PartnerColors` group
- Response time acceptable

---

### SCENARIO-08-03: Partners API endpoint is accessible
**Priority:** High
**Steps:**
1. GET `/wp-json/connector-platform/v1/partners` with auth headers
2. Verify HTTP 200
3. Verify response body structure (array or object with partner data)
4. Verify at least one partner exists

**Expected Result:** Partners API returns valid data

---

### SCENARIO-08-04: Partner Colors API returns data
**Priority:** Medium
**Steps:**
1. GET `/wp-json/connector-platform/v1/partner-colors` with auth headers
2. Verify HTTP 200
3. Verify response contains color entries grouped by partner/brand
4. Verify each color has a `sku` field

**Expected Result:** Partner Colors API returns the full color catalog

---

### SCENARIO-08-05: API returns 401 without auth headers
**Priority:** High (negative test)
**Steps:**
1. GET `/wp-json/connector-platform/v1/products` with NO headers
2. Verify HTTP 401 or 403
3. Verify response body contains an error message

**Expected Result:** Unauthorized access is rejected

---

### SCENARIO-08-06: API returns 401 with wrong api-signature
**Priority:** Medium (negative test)
**Steps:**
1. GET products endpoint with `api-signature: invalid-key`
2. Verify HTTP 401

**Expected Result:** Invalid signature is rejected

---

### SCENARIO-08-07: SKU API endpoint structure
**Priority:** Medium
**Steps:**
1. GET `/wp-json/connector-platform/v1/sku` with auth headers
2. Verify HTTP 200 or 404 (if not implemented)
3. If 200: verify response structure

**Expected Result:** SKU endpoint returns data or documented 404

---

### SCENARIO-08-08: Sync Status API returns health information
**Priority:** Low
**Steps:**
1. GET `/wp-json/connector-platform/v1/sync-status` with auth headers
2. Verify response indicates sync health (last sync time, status)

**Expected Result:** Sync status is visible via API

---

## Running API Tests

```bash
# Run all API tests (no browser login needed):
npm run test:api

# Run with detailed output:
npx cross-env ENV=staging SKIP_AUTH=true playwright test tests/api/ --reporter=list

# Inspect raw API responses:
node scripts/inspect-api.js

# View captured response files:
ls reports/api-responses/
```

## Authentication Setup

Both headers are required for every request:
```javascript
const headers = {
  'api-signature': process.env.CONNECTOR_API_SIGNATURE,
  'website': process.env.BASE_URL,
};
```

The `website` header tells the API which partner site is making the request — this affects what products and colors are returned.
