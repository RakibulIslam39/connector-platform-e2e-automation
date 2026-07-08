// 'use strict';

// const { test, expect } = require('../../fixtures');

// // Shared headers for raw request tests — must include both api-signature AND website
// const apiHeaders = () => ({
//   'api-signature': process.env.CONNECTOR_API_SIGNATURE,
//   website: process.env.BASE_URL,
// });

// test.describe('Connector Platform Attributes Mapping API', () => {
//   test('GET /attributes-mapping returns 200', async ({ request }) => {
//     const response = await request.get(
//       `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/attributes-mapping`,
//       { headers: apiHeaders() }
//     );
//     expect(response.status()).toBe(200);
//   });

//   test('attributes mapping response is valid', async ({ connectorApi }) => {
//     const mappings = await connectorApi.getAttributesMapping();
//     expect(Array.isArray(mappings) || typeof mappings === 'object').toBe(true);
//   });

//   test('mapping response has data entries', async ({ connectorApi }) => {
//     const mappings = await connectorApi.getAttributesMapping();
//     const mappingArray = Array.isArray(mappings) ? mappings : Object.values(mappings);

//     if (mappingArray.length === 0) {
//       test.skip();
//     }

//     const firstEntry = mappingArray[0];
//     expect(firstEntry).toBeDefined();
//   });

//   test('mapping response contains Size attribute group', async ({ connectorApi }) => {
//     const mappings = await connectorApi.getAttributesMapping();
//     // API returns { success: true, data: { Size: [...], PartnerColors: [...], ... } }
//     const data = mappings.data || mappings;
//     expect(data).toHaveProperty('Size');
//     expect(Array.isArray(data.Size)).toBe(true);
//     expect(data.Size.length).toBeGreaterThan(0);
//   });

//   test('mapping response contains PartnerColors attribute group', async ({ connectorApi }) => {
//     const mappings = await connectorApi.getAttributesMapping();
//     const data = mappings.data || mappings;
//     expect(data).toHaveProperty('Partner Colors');
//     expect(Array.isArray(data['Partner Colors'])).toBe(true);
//   });

//   test('attributes mapping response time is acceptable', async ({ request }) => {
//     const start = Date.now();
//     const response = await request.get(
//       `${process.env.CONNECTOR_API_BASE_URL}/wp-json/connector-platform/v1/attributes-mapping`,
//       { headers: apiHeaders() }
//     );
//     const duration = Date.now() - start;
//     expect(response.ok()).toBe(true);
//     expect(duration).toBeLessThan(10000);
//   });

//   test('Size mapping entries have value and sku fields', async ({ connectorApi }) => {
//     const mappings = await connectorApi.getAttributesMapping();
//     const data = mappings.data || mappings;
//     const sizeEntries = data['Size'] || [];
//     if (sizeEntries.length === 0) {
//       test.skip();
//     }

//     for (const entry of sizeEntries.slice(0, 5)) {
//       expect(entry).toHaveProperty('value');
//       expect(entry).toHaveProperty('sku');
//     }
//   });
// });
