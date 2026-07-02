# API Testing Skill Reference
> Using Playwright's built-in APIRequestContext

---

## Basic API Test Structure
```javascript
const { test, expect } = require('../../fixtures');

test.describe('@api Products API', () => {
  test('@smoke GET products returns 200', async ({ request }) => {
    const response = await request.get(
      `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/products`,
      {
        headers: {
          'api-signature': process.env.CONNECTOR_API_SIGNATURE,
          'Content-Type': 'application/json',
        }
      }
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
```

## Using ConnectorApiService
```javascript
test('@regression products have required fields', async ({ connectorApi }) => {
  const products = await connectorApi.getProducts();
  for (const product of products) {
    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
  }
});
```

## Response Validation Patterns
```javascript
// Status code
expect(response.status()).toBe(200);
expect(response.ok()).toBe(true);

// Headers
expect(response.headers()['content-type']).toContain('application/json');

// Body structure
const body = await response.json();
expect(body).toHaveProperty('data');
expect(body.data).toHaveLength(10);

// Array items
expect(body).toContainEqual(expect.objectContaining({ id: 1 }));

// Response time
const start = Date.now();
const response = await request.get(url);
expect(Date.now() - start).toBeLessThan(5000);
```

## Connector Platform API Endpoints
```javascript
const BASE = process.env.CONNECTOR_API_BASE_URL;
const HEADERS = { 'api-signature': process.env.CONNECTOR_API_SIGNATURE };

// Products
GET  ${BASE}/wp-json/connector-platform/v1/products
GET  ${BASE}/wp-json/connector-platform/v1/products/{id}

// Attributes Mapping
GET  ${BASE}/wp-json/connector-platform/v1/attributes-mapping

// Partners
GET  ${BASE}/wp-json/connector-platform/v1/partners
```

## API Project Config (playwright.config.js)
```javascript
{
  name: 'api',
  testMatch: /tests\/api\/.*/,
  use: {
    baseURL: process.env.CONNECTOR_API_BASE_URL,
    extraHTTPHeaders: {
      'api-signature': process.env.CONNECTOR_API_SIGNATURE,
    }
  }
}
```

## Intercepting API calls in UI tests
```javascript
// Wait for an API call during UI interaction
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/orders')),
  page.locator('[name="save"]').click(),
]);
const data = await response.json();
expect(data.status).toBe('success');
```

## Error Handling
```javascript
try {
  const products = await connectorApi.getProducts();
  return products;
} catch (err) {
  if (err.status === 401) {
    throw new Error('API authentication failed — check api-signature');
  }
  throw err;
}
```
