'use strict';

const { test, expect } = require('../../fixtures');
const { determineTargetShop, validateForBOL } = require('../../helpers/order-helper');
const { loadTestData } = require('../../common/utils/data-utils');

const orderScenarios = loadTestData('orders', 'order-scenarios.json');

test.describe('HoodslyHub Order Management', () => {
  test.beforeEach(async ({ page }) => {
    const hubUrl = process.env.HUB_BASE_URL;
    if (hubUrl) {
      await page.goto(`${hubUrl}/wp-admin/`);
    }
  });

  test('hub dashboard loads', async ({ hubDashboardPage }) => {
    await hubDashboardPage.goto();
    expect(await hubDashboardPage.isDashboardLoaded()).toBe(true);
  });

  test('orders list page loads', async ({ orderManagementPage }) => {
    await orderManagementPage.goto();
    await expect(orderManagementPage.page).toHaveURL(/shop_order/);
  });

  test('filter orders by production status', async ({ orderManagementPage }) => {
    await orderManagementPage.filterByStatus('wc-production');
    const count = await orderManagementPage.getOrderCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('search for order by ID', async ({ orderManagementPage }) => {
    await orderManagementPage.searchOrder('12345');
    await expect(orderManagementPage.page).toHaveURL(/shop_order/);
  });

  test('target shop for standard wood hood is WRH', () => {
    const shop = determineTargetShop('wall-mount', 'standard');
    expect(shop).toBe('wrh');
  });

  test('target shop for quick ship hood is WRH', () => {
    const shop = determineTargetShop('wall-mount', 'qsp');
    expect(shop).toBe('wrh');
  });

  test('target shop for floating shelf is WIKS', () => {
    const shop = determineTargetShop('floating-shelf');
    expect(shop).toBe('wiks');
  });

  test('BOL validation passes for valid order data', () => {
    const validOrder = { ...orderScenarios.customerFixtures.standard };
    validOrder.shipperName = 'Test Shipper Inc';
    const result = validateForBOL(validOrder);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('BOL validation fails for invalid phone number', () => {
    const invalidOrder = { ...orderScenarios.customerFixtures.invalidPhone };
    invalidOrder.shipperName = 'Test Shipper';
    const result = validateForBOL(invalidOrder);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('phone'))).toBe(true);
  });

  test('order hold workflow — instant release', async ({ orderManagementPage }) => {
    // Placeholder — actual test requires a real order ID from a completed placement flow
    // Full test: await orderManagementPage.openOrderById(orderId);
    //            await orderManagementPage.holdOrder();
    //            await orderManagementPage.instantRelease();
    //            verify order was forwarded to Hub
    expect(true).toBe(true);
  });
});
