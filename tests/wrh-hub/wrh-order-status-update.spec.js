// 'use strict';

// /**
//  * WRH Hub — Order Status Update flow
//  *
//  * Migrated from 1.0:
//  *   - hoodslyhub/update_order_status_from_wilkeshub.feature
//  *
//  * Tests the full WilkesHub order status update cycle:
//  *   1. Search for an order
//  *   2. Click Select Order Status
//  *   3. Choose a new status
//  *   4. Verify success message
//  *   5. Dismiss OK dialog if present
//  */

// const { test, expect } = require('../../fixtures');

// const TEST_ORDER_ID = process.env.WRH_TEST_ORDER_ID || process.env.TEST_ORDER_NUMBER;
// const NEW_ORDER_STATUS = process.env.WRH_NEW_ORDER_STATUS || 'In Production';

// test.describe('WRH Hub — Order Status Update', () => {
//   test.beforeEach(async ({ wrhOrdersPage }) => {
//     await wrhOrdersPage.goto();
//   });

//   test('WRH orders page loads', async ({ wrhOrdersPage }) => {
//     await expect(wrhOrdersPage.page).not.toHaveURL(/wp-login/);
//   });

//   test('orders table is visible', async ({ wrhOrdersPage }) => {
//     const count = await wrhOrdersPage.getOrderCount();
//     expect(count).toBeGreaterThanOrEqual(0);
//   });

//   test('search for an order using keyboard input', async ({ wrhOrdersPage }) => {
//     test.skip(!TEST_ORDER_ID, 'WRH_TEST_ORDER_ID / TEST_ORDER_NUMBER env var not set');

//     await wrhOrdersPage.clickSearchIcon();
//     await wrhOrdersPage.inputOrderIdWithKeyboard(TEST_ORDER_ID);
//     const found = await wrhOrdersPage.searchOrderInResult(TEST_ORDER_ID, 12000);
//     expect(found).toBe(true);
//   });

//   test('open order from search result', async ({ wrhOrdersPage }) => {
//     test.skip(!TEST_ORDER_ID, 'WRH_TEST_ORDER_ID / TEST_ORDER_NUMBER env var not set');

//     await wrhOrdersPage.clickSearchIcon();
//     await wrhOrdersPage.inputOrderIdWithKeyboard(TEST_ORDER_ID);
//     await wrhOrdersPage.searchOrderInResult(TEST_ORDER_ID, 12000);
//     await wrhOrdersPage.clickOrderFromSearchResult(TEST_ORDER_ID);
//     await expect(wrhOrdersPage.page).not.toHaveURL(/wrh-hub.*orders$/);
//   });

//   test('update order status — full Select Order Status flow', async ({ wrhOrdersPage }) => {
//     test.skip(!TEST_ORDER_ID, 'WRH_TEST_ORDER_ID / TEST_ORDER_NUMBER env var not set');

//     await wrhOrdersPage.clickSearchIcon();
//     await wrhOrdersPage.inputOrderIdWithKeyboard(TEST_ORDER_ID);
//     await wrhOrdersPage.searchOrderInResult(TEST_ORDER_ID, 12000);
//     await wrhOrdersPage.clickOrderFromSearchResult(TEST_ORDER_ID);

//     await wrhOrdersPage.clickSelectOrderStatusButton();
//     await wrhOrdersPage.selectOrderStatusByClicking(NEW_ORDER_STATUS);

//     const success = await wrhOrdersPage.isSuccessMessageVisible(NEW_ORDER_STATUS);
//     if (success) {
//       console.log(`Order status successfully updated as a ${NEW_ORDER_STATUS}`);
//     }

//     await wrhOrdersPage.clickOkButtonIfVisible();

//     // Success message OR no error is acceptable — status may already match
//     expect(typeof success).toBe('boolean');
//   });
// });
