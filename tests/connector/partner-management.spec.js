// 'use strict';

// /**
//  * Partner Management — product & color assignment, SKU prefix update
//  *
//  * Migrated from 1.0:
//  *   - connectorPlatform/partner_page.feature (Add/Remove products, Add/Remove colors, Update SKU Prefix)
//  *   - connectorPlatform/products.feature (Add/Remove partner from product, Update description)
//  *
//  * NOTE: All operations target the Connector Hub SPA (#/partners, #/products)
//  * NOT the native WordPress CPT editor.
//  */

// const { test, expect } = require('../../fixtures');
// const { loadTestData } = require('../../common/utils/data-utils');

// const profiles = loadTestData('partners', 'partner-profiles.json');
// const { partnerManagement: pm, productManagement: prod } = profiles;

// test.describe('Partner Management — product & color assignment', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/wp-admin/');
//   });

//   // ─── Partner list ──────────────────────────────────────────────────────────

//   test('partners list page loads in Connector Hub SPA', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.gotoPartnersList();
//     await expect(partnerCreationPage.page).toHaveURL(/connector-hub/);
//   });

//   test('search for existing partner returns results', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.gotoPartnersList();
//     await partnerCreationPage.searchPartner(pm.searchPartner);
//     const found = await partnerCreationPage.isPartnerFound();
//     expect(found).toBe(true);
//   });

//   test('existing partner is visible after search', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.gotoPartnersList();
//     await partnerCreationPage.searchPartner(pm.existingPartner);
//     const visible = await partnerCreationPage.isPartnerVisible(pm.existingPartner);
//     expect(visible).toBe(true);
//   });

//   // ─── Product assignment (Products tab) ────────────────────────────────────

//   test('add products to a partner via Products tab', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.selectProducts(pm.addProducts);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });

//   test('remove products from a partner via Products tab', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.deselectProducts(pm.removeProducts);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });

//   // ─── Color assignment (Attributes tab) ────────────────────────────────────

//   test('add colors to a partner via Attributes tab', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.selectColors(pm.addColors);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });

//   test('remove colors from a partner via Attributes tab', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.removeColors(pm.removeColors);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });

//   // ─── SKU Prefix ────────────────────────────────────────────────────────────

//   test('update partner SKU prefix and save', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.updateSkuPrefix(pm.skuPrefix);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });

//   // ─── Ventilations / Trims (Attributes tab) ────────────────────────────────

//   test('select ventilation options for a partner', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.selectVentilations(pm.ventilations || ['390 CFM (IN-R230SS-36)']);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });

//   test('select trim options for a partner', async ({ partnerCreationPage }) => {
//     await partnerCreationPage.editPartner(pm.existingPartner);
//     await partnerCreationPage.selectTrims(pm.trims || ['Classic Trim']);
//     await partnerCreationPage.clickUpdate();
//     const saved = await partnerCreationPage.isPartnerSaved();
//     expect(saved).toBe(true);
//   });
// });

// test.describe('Product Management — partner assignment & description', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/wp-admin/');
//   });

//   test('products list page loads in Connector Hub SPA', async ({ productManagementPage }) => {
//     await productManagementPage.goto();
//     await expect(productManagementPage.page).toHaveURL(/connector-hub/);
//   });

//   test('search for specific product — result visible', async ({ productManagementPage }) => {
//     await productManagementPage.searchProduct(prod.existingProduct);
//     const visible = await productManagementPage.isProductVisible(prod.existingProduct);
//     expect(visible).toBe(true);
//   });

//   test('open product edit page via Edit link', async ({ productManagementPage }) => {
//     await productManagementPage.searchProduct(prod.existingProduct);
//     await productManagementPage.clickEditForProduct(prod.existingProduct);
//     const isEdit = await productManagementPage.isEditProductVisible();
//     expect(isEdit).toBe(true);
//   });

//   test('assign partner to product using Partners tab checkbox', async ({
//     productManagementPage,
//   }) => {
//     await productManagementPage.assignPartnerToProduct(prod.existingProduct, prod.addPartner);
//     await productManagementPage.goto();
//     const visible = await productManagementPage.isProductVisible(prod.existingProduct);
//     expect(visible).toBe(true);
//   });

//   test('remove partner from product using Partners tab checkbox', async ({
//     productManagementPage,
//   }) => {
//     await productManagementPage.removePartnerFromProduct(prod.existingProduct, prod.removePartner);
//     await productManagementPage.goto();
//     const visible = await productManagementPage.isProductVisible(prod.existingProduct);
//     expect(visible).toBe(true);
//   });
// });
