'use strict';

const { BasePage } = require('../base.page');
const { WRH_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class WrhOrdersPage extends BasePage {
  constructor(page) {
    super(page);
    this.wrhBaseUrl = process.env.WRH_HUB_BASE_URL;
    this.ordersTable = page.locator('.wp-list-table');
    this.orderRows = page.locator('.wp-list-table tbody tr');
    this.orderStatusFilter = page.locator('[name="post_status"]');

    // Search input on orders list page
    this.searchInput = page.locator('input.search-input:visible');

    // Search icon / button
    this.searchButton = page.locator("//a[@class='icon-search']");

    // Order result items (reused across search results)
    this.orderResultItems = page.locator(
      'div.order-meta, div.order-meta a.order-id, a.order-id, table tr'
    );

    this.noOrderResultMessage = page.locator('text=There is no order ID to your query.');

    // Order status selection controls
    this.selectOrderStatusButton = page.getByText('Select Order Status');

    // OK / confirm dialog button
    this.okButton = page.locator('button:has-text("OK")');
  }

  async goto() {
    await this.page.goto(`${this.wrhBaseUrl}${WRH_PATHS.ORDERS}`);
    await this.waitForPageLoad();
  }

  // ─── Order list operations ────────────────────────────────────────────────────

  /**
   * Opens a specific order by ID from the WRH orders list.
   */
  async openOrder(orderId) {
    logger.info(`[WrhOrdersPage] Opening order: ${orderId}`);
    await this.goto();
    await this.page
      .locator(`a:has-text("#${orderId}"), a[href*="post=${orderId}"]`)
      .first()
      .click();
    await this.waitForPageLoad();
  }

  /**
   * Gets the status of an order in the WRH shop.
   */
  async getOrderStatus(orderId) {
    await this.goto();
    const row = this.orderRows.filter({ hasText: String(orderId) });
    return await row
      .locator('.order-status, .column-order_status')
      .textContent()
      .catch(() => 'not found');
  }

  /**
   * Updates order status in WRH shop using the edit form dropdown.
   */
  async updateOrderStatus(orderId, newStatus) {
    logger.info(`[WrhOrdersPage] Updating order ${orderId} to status: ${newStatus}`);
    await this.openOrder(orderId);
    await this.page.locator('#order_status').selectOption(newStatus);
    await this.page.locator('[name="save"]').click();
    await this.waitForPageLoad();
  }

  /**
   * Verifies an order appears in the WRH orders list.
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

  // ─── Order search with real keyboard events ───────────────────────────────────

  static _splitOrderNumber(orderNumber) {
    const text = String(orderNumber).trim();
    if (text.includes('-')) {
      const parts = text
        .split('-')
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length) {
        return parts[parts.length - 1];
      }
    }
    return text;
  }

  /**
   * Clicks the search icon button to open the search input.
   */
  async clickSearchIcon() {
    const locator = this.searchButton.first();
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click();
  }

  /**
   * Inputs an order ID into the search box using real keyboard events
   * so WRH Hub's auto-search debounce/listeners fire correctly.
   */
  async inputOrderIdWithKeyboard(orderId) {
    const normalized = String(orderId).trim();
    if (!normalized) {
      throw new Error('orderId cannot be empty');
    }
    const locator = this.searchInput.first();
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click();
    await locator.fill('');
    await this.page.keyboard.type(normalized, { delay: 40 });
    logger.info(`[WrhOrdersPage] Typed order ID: ${normalized}`);
  }

  _resultItemLocator(orderId) {
    const normalized = String(orderId).trim();
    const short = WrhOrdersPage._splitOrderNumber(normalized);
    const pattern = new RegExp(`(?:${normalized}|${short})`, 'i');
    return this.orderResultItems.filter({ hasText: pattern });
  }

  async _firstVisibleResultItem(orderId) {
    const matches = this._resultItemLocator(orderId);
    const count = await matches.count();
    for (let i = 0; i < count; i++) {
      const candidate = matches.nth(i);
      try {
        if (await candidate.isVisible()) {
          return candidate;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  async _isNoResultVisible() {
    try {
      return await this.noOrderResultMessage.first().isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Polls the search result until the order appears or the no-result message shows.
   * Returns true if found, false if not found or timed out.
   */
  async searchOrderInResult(orderId, timeoutMs = 12000) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const item = await this._firstVisibleResultItem(orderId);
      if (item !== null) {
        return true;
      }
      if (await this._isNoResultVisible()) {
        return false;
      }
      await this.page.waitForTimeout(250);
    }
    return false;
  }

  /**
   * Clicks the first visible order result item that matches the order ID.
   */
  async clickOrderFromSearchResult(orderId) {
    const result = await this._firstVisibleResultItem(orderId);
    if (result === null) {
      throw new Error(`Order '${orderId}' was not found in search result.`);
    }
    const link = result.locator('a.order-id, a').first();
    if ((await link.count()) > 0) {
      await link.waitFor({ state: 'visible', timeout: 10000 });
      await link.scrollIntoViewIfNeeded();
      await link.click({ timeout: 10000 });
    } else {
      await result.scrollIntoViewIfNeeded();
      await result.click({ timeout: 10000 });
    }
    await this.page.waitForLoadState('domcontentloaded');
    logger.info(`[WrhOrdersPage] Opened order from search result: ${orderId}`);
  }

  // ─── Order status update flow ─────────────────────────────────────────────────

  /**
   * Clicks the "Select Order Status" button on the order detail page.
   */
  async clickSelectOrderStatusButton() {
    await this.selectOrderStatusButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await this.selectOrderStatusButton.first().click();
    logger.info('[WrhOrdersPage] Clicked Select Order Status button');
  }

  /**
   * Selects an order status by clicking the matching dropdown item.
   * @param {string} orderStatus - Status label to click (e.g. 'In Production').
   */
  async selectOrderStatusByClicking(orderStatus) {
    const normalized = String(orderStatus).trim();
    if (!normalized) {
      throw new Error('orderStatus cannot be empty');
    }
    const selectedStatus = this.page
      .locator(
        `//a[@class='details_page_order_status_for_action dropdown-item'][normalize-space()='${normalized}']`
      )
      .first();
    await selectedStatus.waitFor({ state: 'visible', timeout: 10000 });
    await selectedStatus.click();
    logger.info(`[WrhOrdersPage] Selected order status: ${normalized}`);
  }

  /**
   * Returns true if the "Order status successfully updated" message is visible.
   * @param {string} orderStatus - The status just set.
   */
  async isSuccessMessageVisible(orderStatus, timeout = 5000) {
    const normalized = String(orderStatus).trim();
    const expected = `Order status successfully updated as a ${normalized}`;
    const locator = this.page.locator(`:text-is("${expected}")`).first();
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the OK button if it is visible (e.g. confirmation dialog after status update).
   * Returns true if the button was clicked.
   */
  async clickOkButtonIfVisible(timeout = 5000) {
    const locator = this.okButton.first();
    try {
      await locator.waitFor({ state: 'visible', timeout });
      await locator.click();
      logger.info('[WrhOrdersPage] Clicked OK button');
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { WrhOrdersPage };
