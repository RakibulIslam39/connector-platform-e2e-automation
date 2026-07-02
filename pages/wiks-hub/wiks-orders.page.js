'use strict';

const { BasePage } = require('../base.page');
const { WIKS_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class WiksOrdersPage extends BasePage {
  constructor(page) {
    super(page);
    this.wiksBaseUrl = process.env.WIKS_HUB_BASE_URL;
    this.ordersTable = page.locator('.wp-list-table');
    this.orderRows = page.locator('.wp-list-table tbody tr');
    this.orderStatusFilter = page.locator('[name="post_status"]');
  }

  async goto() {
    await this.page.goto(`${this.wiksBaseUrl}${WIKS_PATHS.ORDERS}`);
    await this.waitForPageLoad();
  }

  /**
   * Opens a specific order by ID.
   */
  async openOrder(orderId) {
    logger.info(`[WiksOrdersPage] Opening order: ${orderId}`);
    await this.goto();
    await this.page
      .locator(`a:has-text("#${orderId}"), a[href*="post=${orderId}"]`)
      .first()
      .click();
    await this.waitForPageLoad();
  }

  /**
   * Gets the status of an order in the Wiks shop.
   */
  async getOrderStatus(orderId) {
    await this.goto();
    const row = this.orderRows.filter({ hasText: String(orderId) });
    return await row.locator('.order-status, .column-order_status').textContent().catch(() => 'not found');
  }

  /**
   * Updates the order status in Wiks shop.
   */
  async updateOrderStatus(orderId, newStatus) {
    logger.info(`[WiksOrdersPage] Updating order ${orderId} to status: ${newStatus}`);
    await this.openOrder(orderId);
    await this.page.locator('#order_status').selectOption(newStatus);
    await this.page.locator('[name="save"]').click();
    await this.waitForPageLoad();
  }

  /**
   * Verifies an order exists in Wiks shop.
   */
  async verifyOrderExists(orderId) {
    await this.goto();
    const row = this.orderRows.filter({ hasText: String(orderId) });
    return await row.isVisible();
  }

  async getOrderCount() {
    await this.goto();
    return await this.orderRows.count();
  }
}

module.exports = { WiksOrdersPage };
