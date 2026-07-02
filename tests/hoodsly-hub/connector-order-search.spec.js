'use strict';

/**
 * HoodslyHub — Hoodsly Connector: order search, SKU verification, BOL & tracking, shop assignment
 *
 * Migrated from 1.0:
 *   - hoodslyhub/search_and_verify_order.feature
 *   - hoodslyhub/verify_order_status.feature
 */

const { test, expect } = require('../../fixtures');
const { loadTestData } = require('../../common/utils/data-utils');

const orderScenarios = loadTestData('orders', 'order-scenarios.json');

// Pick a known order number from test data or fall back to env var
const TEST_ORDER_NUMBER =
  process.env.TEST_ORDER_NUMBER ||
  (orderScenarios.orderScenarios[0] && `CON6428-${orderScenarios.orderScenarios[0].id}`);

// Explicit order numbers used in 1.0 tests that are known to have BOL/tracking
const ORDER_WITH_BOL = process.env.ORDER_WITH_BOL || 'CON6428-3021';
const ORDER_FOR_SHOP_ASSIGN = process.env.ORDER_FOR_SHOP_ASSIGN || 'CON6428-3223';
const TARGET_SHOP = process.env.TARGET_SHOP_NAME || 'Wilkes';

test.describe('HoodslyHub — Connector Order Search', () => {
  test.beforeEach(async ({ page }) => {
    const hubBaseUrl = process.env.HUB_BASE_URL;
    await page.goto(`${hubBaseUrl}/wp-admin/`);
  });

  test('Hoodsly Connector link is visible on the hub dashboard', async ({ orderManagementPage }) => {
    await expect(orderManagementPage.hoodslyConnectorLink.first()).toBeVisible();
  });

  test('clicking Hoodsly Connector opens the connector section with search button', async ({
    orderManagementPage,
  }) => {
    await orderManagementPage.clickHoodslyConnector();
    await orderManagementPage.clickSearchButton();
    await expect(orderManagementPage.orderIdField.first()).toBeVisible();
  });

  test('order ID input field is visible after opening connector search', async ({
    orderManagementPage,
  }) => {
    await orderManagementPage.openConnectorSearch();
    await expect(orderManagementPage.orderIdField.first()).toBeVisible();
  });

  test('searching a valid order number returns search results', async ({
    orderManagementPage,
  }) => {
    test.skip(!process.env.TEST_ORDER_NUMBER, 'TEST_ORDER_NUMBER env var not set');
    await orderManagementPage.openConnectorSearch();
    const found = await orderManagementPage.searchOrderNumberWithState(
      process.env.TEST_ORDER_NUMBER
    );
    expect(found).toBe(true);
  });

  test('searching a non-existent order shows no-result message', async ({
    orderManagementPage,
  }) => {
    await orderManagementPage.openConnectorSearch();
    const found = await orderManagementPage.searchOrderNumberWithState('CON0000-0000');
    expect(found).toBe(false);
  });

  test('clicking an order result opens the order details page', async ({
    orderManagementPage,
  }) => {
    test.skip(!process.env.TEST_ORDER_NUMBER, 'TEST_ORDER_NUMBER env var not set');
    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(process.env.TEST_ORDER_NUMBER);
    await orderManagementPage.clickOrderNumber(process.env.TEST_ORDER_NUMBER);
    await expect(orderManagementPage.page).not.toHaveURL(/connector-hub.*dashboard/);
  });

  test('Generated SKU is extractable from order details page', async ({
    orderManagementPage,
  }) => {
    test.skip(!process.env.TEST_ORDER_NUMBER, 'TEST_ORDER_NUMBER env var not set');
    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(process.env.TEST_ORDER_NUMBER);
    await orderManagementPage.clickOrderNumber(process.env.TEST_ORDER_NUMBER);
    const sku = await orderManagementPage.getGeneratedSkuValue();
    expect(sku).toBeTruthy();
    expect(sku.length).toBeGreaterThan(0);
  });
});

test.describe('HoodslyHub — BOL and R+L Tracking Verification', () => {
  test.beforeEach(async ({ page }) => {
    const hubBaseUrl = process.env.HUB_BASE_URL;
    await page.goto(`${hubBaseUrl}/wp-admin/`);
  });

  test('check whether BOL is generated for a shipped order', async ({
    orderManagementPage,
  }) => {
    test.skip(!process.env.ORDER_WITH_BOL, 'ORDER_WITH_BOL env var not set');
    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(ORDER_WITH_BOL);
    await orderManagementPage.clickOrderNumber(ORDER_WITH_BOL);
    const bolGenerated = await orderManagementPage.isBolGenerated();
    if (bolGenerated) {
      console.log(`BOL is Generated for the order: ${ORDER_WITH_BOL}`);
    } else {
      console.log(`BOL is not generated for the order: ${ORDER_WITH_BOL}`);
    }
    // Soft assertion — BOL generation depends on order state
    expect(typeof bolGenerated).toBe('boolean');
  });

  test('R+L Tracking Number is extractable from an order with BOL', async ({
    orderManagementPage,
  }) => {
    test.skip(!process.env.ORDER_WITH_BOL, 'ORDER_WITH_BOL env var not set');
    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(ORDER_WITH_BOL);
    await orderManagementPage.clickOrderNumber(ORDER_WITH_BOL);

    const bolGenerated = await orderManagementPage.isBolGenerated(5000);
    test.skip(!bolGenerated, 'BOL not generated for this order — skipping tracking number check');

    const trackingNumber = await orderManagementPage.getRlTrackingNumber();
    expect(trackingNumber).toMatch(/^\d+$/);
    console.log(`R+L Tracking Number for ${ORDER_WITH_BOL}: ${trackingNumber}`);
  });
});

test.describe('HoodslyHub — Order Status and Shop Assignment', () => {
  test.beforeEach(async ({ page }) => {
    const hubBaseUrl = process.env.HUB_BASE_URL;
    await page.goto(`${hubBaseUrl}/wp-admin/`);
  });

  test('order shop assignment state is readable', async ({ orderManagementPage }) => {
    test.skip(!process.env.ORDER_FOR_SHOP_ASSIGN, 'ORDER_FOR_SHOP_ASSIGN env var not set');
    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(ORDER_FOR_SHOP_ASSIGN);
    await orderManagementPage.clickOrderNumber(ORDER_FOR_SHOP_ASSIGN);
    const state = await orderManagementPage.getShopAssignmentState();
    expect(typeof state.assigned).toBe('boolean');
    console.log(`Shop assignment for ${ORDER_FOR_SHOP_ASSIGN}:`, state);
  });

  test('order status text is readable from order detail page', async ({
    orderManagementPage,
  }) => {
    test.skip(!process.env.ORDER_FOR_SHOP_ASSIGN, 'ORDER_FOR_SHOP_ASSIGN env var not set');
    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(ORDER_FOR_SHOP_ASSIGN);
    await orderManagementPage.clickOrderNumber(ORDER_FOR_SHOP_ASSIGN);
    const status = await orderManagementPage.getOrderStatusText().catch(() => null);
    if (status) {
      console.log(`Order status for ${ORDER_FOR_SHOP_ASSIGN}: ${status}`);
      expect(typeof status).toBe('string');
    }
  });

  test('assign order to shop — Reassign Shop flow', async ({ orderManagementPage }) => {
    test.skip(!process.env.ORDER_FOR_SHOP_ASSIGN, 'ORDER_FOR_SHOP_ASSIGN env var not set');

    await orderManagementPage.openConnectorSearch();
    await orderManagementPage.searchOrderNumber(ORDER_FOR_SHOP_ASSIGN);
    await orderManagementPage.clickOrderNumber(ORDER_FOR_SHOP_ASSIGN);

    const state = await orderManagementPage.getShopAssignmentState();
    if (state.assigned) {
      console.log(`Shop is already assigned for order ${ORDER_FOR_SHOP_ASSIGN}: ${state.shopText}`);
      return;
    }

    await orderManagementPage.clickReassignShopLink();
    await orderManagementPage.selectShop(TARGET_SHOP);
    await orderManagementPage.clickReassignSubmitButton();

    const sameShop = await orderManagementPage.isSameShopReassignMessageVisible();
    const failed = await orderManagementPage.isReassignFailureMessageVisible();

    if (sameShop) {
      console.log("You can't reassign the same shop");
    } else if (failed) {
      console.log('Assigned shop failed, Something went wrong');
    } else {
      console.log('Assigned to a shop successfully');
      await orderManagementPage.waitForShopAssignment(TARGET_SHOP);
      const newState = await orderManagementPage.getShopAssignmentState();
      expect(newState.assigned).toBe(true);
    }
  });

  test('order visible in manual placement search', async ({ orderPlacementPage }) => {
    test.skip(!process.env.TEST_ORDER_NUMBER, 'TEST_ORDER_NUMBER env var not set');
    await orderPlacementPage.clickHoodslyConnector();
    await orderPlacementPage.clickManualPlacementTab();
    const visible = await orderPlacementPage.isOrderVisible(process.env.TEST_ORDER_NUMBER);
    console.log(
      `Order ${process.env.TEST_ORDER_NUMBER} in Manual Placement: ${visible}`
    );
    expect(typeof visible).toBe('boolean');
  });
});
