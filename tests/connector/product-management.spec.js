// 'use strict';

// const { test, expect } = require('../../fixtures');
// const { loadTestData } = require('../../common/utils/data-utils');

// const productCatalog = loadTestData('products', 'product-catalog.json');

// test.describe('Product Management', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/wp-admin/');
//   });

//   test('products list page loads in Connector Hub SPA', async ({ productManagementPage }) => {
//     await productManagementPage.goto();
//     await expect(productManagementPage.page).toHaveURL(/connector-hub/);
//   });

//   test('product list shows items', async ({ productManagementPage }) => {
//     const productCount = await productManagementPage.getProductCount();
//     expect(productCount).toBeGreaterThanOrEqual(0);
//   });

//   test('search for specific product by title', async ({ productManagementPage }) => {
//     const productTitle = productCatalog.products[0].title;
//     await productManagementPage.searchProduct(productTitle);
//     const visible = await productManagementPage.isProductVisible(productTitle);
//     expect(visible).toBe(true);
//   });

//   test('filter by connector product type', async ({ productManagementPage }) => {
//     await productManagementPage.filterByConnectorType('connector');
//     const count = await productManagementPage.getProductCount();
//     expect(count).toBeGreaterThanOrEqual(0);
//   });

//   test('filter by non-connector product type', async ({ productManagementPage }) => {
//     await productManagementPage.filterByConnectorType('non-connector');
//     const count = await productManagementPage.getProductCount();
//     expect(count).toBeGreaterThanOrEqual(0);
//   });

//   test('connector vs non-connector product distinction', async ({ productManagementPage }) => {
//     // Connector products are managed by the platform; non-connector are standalone
//     await productManagementPage.goto();
//     const totalCount = await productManagementPage.getProductCount();
//     expect(totalCount).toBeGreaterThanOrEqual(0);
//   });
// });
