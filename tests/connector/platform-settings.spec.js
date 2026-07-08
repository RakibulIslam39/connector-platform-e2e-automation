// 'use strict';

// const { test, expect } = require('../../fixtures');
// const { loadTestData } = require('../../common/utils/data-utils');

// const connectorSettings = loadTestData('connector', 'connector-settings.json');

// test.describe('Connector Platform Settings', () => {
//   test.beforeEach(async ({ page }) => {
//     await page.goto('/wp-admin/');
//   });

//   // ─── Product Info — FAQ Management ─────────────────────────────────────────

//   test.describe('Product Info — FAQ Management', () => {
//     test('Platform Settings section is accessible via navigation', async ({
//       platformSettingsPage,
//     }) => {
//       await platformSettingsPage.goto();
//       await expect(platformSettingsPage.page).toHaveURL(/platform-settings|connector-hub/);
//     });

//     test('Product Info tab loads and reveals Add Partner FAQ button', async ({
//       platformSettingsPage,
//     }) => {
//       await platformSettingsPage.navigateToProductInfoTab();
//       await expect(platformSettingsPage.addFaqBtn).toBeVisible();
//     });

//     test('clicking Add Partner FAQ opens the FAQ accordion panel', async ({
//       platformSettingsPage,
//     }) => {
//       await platformSettingsPage.navigateToProductInfoTab();
//       await platformSettingsPage.clickAddPartnerFaq();
//       await expect(platformSettingsPage.faqLabelHeader).toBeVisible();
//     });

//     test('add partner FAQ — fill partner, title, description and save', async ({
//       platformSettingsPage,
//     }) => {
//       const { partnerName, titleText, descriptionText } = connectorSettings.faqManagement;
//       const success = await platformSettingsPage.addPartnerFaq({
//         partnerName,
//         titleText,
//         descriptionText,
//       });
//       expect(success).toBe(true);
//     });
//   });

//   // ─── Partner Order Log ────────────────────────────────────────────────────

//   test.describe('Partner Order Log', () => {
//     test('Partner Order Log section loads order ID input field', async ({
//       platformSettingsPage,
//     }) => {
//       await platformSettingsPage.navigateToPartnerOrderLog();
//       await expect(platformSettingsPage.orderLogOrderIdInput).toBeVisible();
//     });

//     test('Fetch Order Data button is present on Partner Order Log page', async ({
//       platformSettingsPage,
//     }) => {
//       await platformSettingsPage.navigateToPartnerOrderLog();
//       await expect(platformSettingsPage.orderLogFetchBtn).toBeVisible();
//     });

//     test('search order in Partner Order Log returns payload or error message', async ({
//       platformSettingsPage,
//     }) => {
//       const { partnerName, orderId } = connectorSettings.partnerOrderLog;
//       const result = await platformSettingsPage.searchOrderLog({ partnerName, orderId });
//       // Either the order exists ('found') or not ('not-found') — both are valid states
//       expect(['found', 'not-found']).toContain(result);
//     });

//     test('fetching with a non-existent order ID shows error or empty result', async ({
//       platformSettingsPage,
//     }) => {
//       await platformSettingsPage.navigateToPartnerOrderLog();
//       await platformSettingsPage.enterOrderLogOrderId('NON-EXISTENT-ORDER-99999');
//       await platformSettingsPage.fetchOrderLogData();
//       const hasError = await platformSettingsPage.isOrderLogErrorVisible();
//       const hasPayload = await platformSettingsPage.isOrderLogPayloadVisible();
//       // At least one of error or payload must render after fetch
//       expect(hasError || hasPayload).toBe(true);
//     });
//   });
// });
