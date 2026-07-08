// 'use strict';

// const { test, expect } = require('../../fixtures');

// // Shared headers for raw request tests — both api-signature AND website are required
// const apiHeaders = () => ({
//   'api-signature': process.env.CONNECTOR_API_SIGNATURE,
//   website: process.env.BASE_URL,
// });

// test.describe('Connector Platform Products API', () => {
//   test('products API is reachable and authenticated', async ({ connectorApi }) => {
//     const isHealthy = await connectorApi.healthCheck();
//     expect(isHealthy).toBe(true);
//   });

//   test('GET /products returns 200', async ({ request }) => {
//     const response = await request.get(
//       `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/products`,
//       { headers: apiHeaders() }
//     );
//     expect(response.status()).toBe(200);
//   });

//   test('products response has expected structure', async ({ connectorApi }) => {
//     // API returns: { success: true, partner_type: "b2c", data: [...] }
//     const body = await connectorApi.getProducts();
//     expect(body).toHaveProperty('success', true);
//     expect(body).toHaveProperty('data');
//     expect(Array.isArray(body.data)).toBe(true);
//   });

//   test('products data list is an array', async ({ connectorApi }) => {
//     const products = await connectorApi.getProductsList();
//     expect(Array.isArray(products)).toBe(true);
//   });

//   test('each product has required fields', async ({ connectorApi }) => {
//     const products = await connectorApi.getProductsList();
//     if (products.length === 0) {
//       test.skip();
//     }

//     const requiredFields = ['id', 'sku', 'title'];
//     for (const product of products.slice(0, 5)) {
//       for (const field of requiredFields) {
//         expect(product, `Product missing field: ${field}`).toHaveProperty(field);
//       }
//     }
//   });

//   test('products list is non-empty', async ({ connectorApi }) => {
//     const products = await connectorApi.getProductsList();
//     expect(Array.isArray(products)).toBe(true);
//     expect(products.length).toBeGreaterThan(0);
//   });

//   test('each product has a category field', async ({ connectorApi }) => {
//     const products = await connectorApi.getProductsList();
//     if (products.length === 0) {
//       test.skip();
//     }
//     const first = products[0];
//     expect(first).toHaveProperty('category');
//     expect(first.category).toHaveProperty('label');
//     expect(first.category).toHaveProperty('slug');
//   });

//   test('API returns data without authentication error', async ({ request }) => {
//     const response = await request.get(
//       `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/products`,
//       { headers: apiHeaders() }
//     );
//     expect(response.status()).not.toBe(401);
//     expect(response.status()).not.toBe(403);
//   });

//   test('products response time is acceptable', async ({ request }) => {
//     const start = Date.now();
//     const response = await request.get(
//       `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/products`,
//       { headers: apiHeaders() }
//     );
//     const duration = Date.now() - start;
//     expect(response.ok()).toBe(true);
//     expect(duration).toBeLessThan(10000);
//   });
// });
