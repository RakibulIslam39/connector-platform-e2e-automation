# API Reference — Connector Platform 2.0

## Authentication

All API requests require the `api-signature` header:

```
api-signature: 0N611zTpYJ4DyZ907geVnf7jKaM3RXaufixLs819t0Ofx4grhsV9HTUXdKiyTYHe
```

## Base URL

```
https://hoodslypartnersconnector3.kinsta.cloud
```

## Endpoints

### GET /wp-json/connector-platform/v1/products

Returns all products managed by the Connector Platform.

**Response:** Array of product objects

```json
[
  {
    "id": 123,
    "name": "Wall Mount Range Hood",
    "sku": "WM-001",
    "type": "connector",
    "price": "1299.00",
    "attributes": { ... }
  }
]
```

### GET /wp-json/connector-platform/v1/attributes-mapping

Returns the attribute-to-short-SKU mapping configuration.

**Response:** Array or object of mappings

```json
[
  {
    "attribute": "size",
    "value": "30 inch",
    "shortCode": "30"
  },
  {
    "attribute": "ventilation",
    "value": "ducted",
    "shortCode": "DUC"
  }
]
```

## Using in Tests

```javascript
// Via fixture (recommended)
test('test', async ({ connectorApi }) => {
  const products = await connectorApi.getProducts();
  const mappings = await connectorApi.getAttributesMapping();
});

// Via raw request (for API-specific tests)
test('test', async ({ request }) => {
  const response = await request.get(
    `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/products`,
    { headers: { 'api-signature': process.env.CONNECTOR_API_SIGNATURE } }
  );
});
```

## Partner Site Under Test

```
https://rakbulqapart.s6-tastewp.com
```

WordPress + WooCommerce site with Hoodsly Partners Connector plugin installed.
