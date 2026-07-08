'use strict';

const { BasePage } = require('../base.page');
const { HUB_PATHS } = require('../../constants/urls');
const { HUB_SELECTORS } = require('../../constants/selectors');
const { waitForWpNotice } = require('../../common/utils/wait-utils');
const logger = require('../../common/utils/logger');

class OrderManagementPage extends BasePage {
  constructor(page) {
    super(page);
    this.ordersTable = page.locator('.wp-list-table');
    this.orderRows = page.locator('.wp-list-table tbody tr');
    this.orderStatusFilter = page.locator('[name="post_status"]');
    this.orderSearchInput = page.locator('input[name="s"]');
    this.holdOrderBtn = page.locator(HUB_SELECTORS.HOLD_ORDER_BTN);
    this.instantReleaseBtn = page.locator(HUB_SELECTORS.INSTANT_RELEASE_BTN);
    this.estShipDateInput = page.locator(HUB_SELECTORS.EST_SHIP_DATE_INPUT);
    this.reasonNoteTextarea = page.locator(HUB_SELECTORS.REASON_NOTE_TEXTAREA);
    this.bolGenerateBtn = page.locator(HUB_SELECTORS.BOL_GENERATE_BTN);

    // Hoodsly Connector section locators
    this.hoodslyConnectorLink = page.getByText('Hoodsly Connector');
    this.manualPlacementTab = page.locator('#manual-placement-tab');
    this.searchButton = page.locator('button.btn-search');
    this.orderIdField = page.getByLabel('Type Order ID Below');
    this.orderResultLinks = page.locator('div.order-meta a.order-id');
    this.noOrderResultMessage = page.getByText('There is no order ID to your query.');

    // Shop assignment locators
    this.shopWks = page.getByText('Shop: WKS');
    this.shopWrh = page.getByText('Shop: WRH');
    this.shopNa = page.getByText('Shop: N/A');
    this.reassignShopLink = page.locator('a.hub_reassign_shop:visible');
    this.shopSelectDropdown = page.locator('#reassign_shop_field:visible');
    this.reassignSubmitButton = page.locator("//input[@value='Reassign Shop']");

    // Order status button (matches any known status label)
    this.orderStatusButton = page.locator('button').filter({
      hasText:
        /In Production|Pre-Assembly|Assembly|Sanding|Finishing|Ready To Ship|Shipped|Completed|Canceled|Add Features/i,
    });
  }

  async goto() {
    await this.navigate(HUB_PATHS.ORDERS);
  }

  /**
   * Opens an order by ID.
   */
  async openOrderById(orderId) {
    logger.info(`[OrderManagementPage] Opening order: ${orderId}`);
    await this.goto();
    const orderLink = this.page
      .locator(`a:has-text("#${orderId}"), a[href*="post=${orderId}"]`)
      .first();
    await orderLink.click();
    await this.waitForPageLoad();
  }

  /**
   * Gets the current status of an order displayed on the order detail page.
   */
  async getOrderStatus() {
    return await this.page
      .locator('.order-status, #order_status')
      .textContent()
      .catch(() => 'unknown');
  }

  /**
   * Updates the order status from the order edit page.
   */
  async updateOrderStatus(newStatus) {
    logger.info(`[OrderManagementPage] Updating order status to: ${newStatus}`);
    await this.page.locator('#order_status').selectOption(newStatus);
    await this.page.locator('[name="save"]').click();
    await this.waitForPageLoad();
    return await waitForWpNotice(this.page, 'success').catch(() => null);
  }

  /**
   * Puts an order on hold.
   */
  async holdOrder() {
    logger.info('[OrderManagementPage] Holding order');
    await this.holdOrderBtn.click();
    return await waitForWpNotice(this.page, 'success').catch(() => null);
  }

  /**
   * Instantly releases a held order to the Hub.
   */
  async instantRelease() {
    logger.info('[OrderManagementPage] Instant releasing order');
    await this.instantReleaseBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
    return await waitForWpNotice(this.page, 'success').catch(() => null);
  }

  /**
   * Sets the estimated ship date for an order.
   */
  async setEstimatedShipDate(date, reasonNote = '') {
    logger.info(`[OrderManagementPage] Setting est. ship date: ${date}`);
    await this.estShipDateInput.fill(date);
    if (reasonNote) {
      await this.reasonNoteTextarea.fill(reasonNote);
    }
    await this.page.locator('[name="save_ship_date"], #submit').click();
  }

  /**
   * Generates a BOL (Bill of Lading) for an order.
   */
  async generateBOL() {
    logger.info('[OrderManagementPage] Generating BOL');
    await this.bolGenerateBtn.click();
    await this.waitForPageLoad();
  }

  /**
   * Filters orders by status in the list view.
   */
  async filterByStatus(status) {
    await this.goto();
    await this.orderStatusFilter.selectOption(status);
    await this.page.locator('[name="filter_action"]').click();
    await this.waitForPageLoad();
  }

  /**
   * Searches for an order by order ID or customer name.
   */
  async searchOrder(searchTerm) {
    await this.goto();
    await this.orderSearchInput.fill(searchTerm);
    await this.page.keyboard.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Gets the count of orders matching current filter.
   */
  async getOrderCount() {
    await this.goto();
    return await this.orderRows.count();
  }

  // ─── Hoodsly Connector section ────────────────────────────────────────────────

  /**
   * Normalises an order number — strips everything before the last dash.
   * e.g. "CON6428-3012" → "3012"
   */
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
   * Clicks the "Hoodsly Connector" navigation link inside HoodslyHub.
   */
  async clickHoodslyConnector() {
    logger.info('[OrderManagementPage] Clicking Hoodsly Connector link');
    await this.hoodslyConnectorLink.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.hoodslyConnectorLink.first().click();
  }

  /**
   * Clicks the search button in the Hoodsly Connector section.
   */
  async clickSearchButton() {
    await this.searchButton.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.searchButton.first().click();
  }

  /**
   * Opens the Connector order search context (connector link + search button).
   * Safe to call multiple times — handles page reload fallback.
   */
  async openConnectorSearch() {
    logger.info('[OrderManagementPage] Opening connector search');
    try {
      await this.clickHoodslyConnector();
    } catch {
      try {
        await this.page.goBack({ waitUntil: 'domcontentloaded' });
        await this.clickHoodslyConnector();
      } catch {
        // ignore
      }
    }
    await this.clickSearchButton();
    await this.orderIdField.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Inputs an order number into the order ID search field.
   */
  async inputOrderNumber(orderNumber) {
    const field = this.orderIdField.first();
    await field.waitFor({ state: 'visible', timeout: 15000 });
    await field.fill(String(orderNumber).trim());
  }

  /**
   * Returns true if the no-result message is visible.
   */
  async isNoOrderResultMessageVisible(timeout = 2000) {
    try {
      await this.noOrderResultMessage.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Waits until an order result link is visible in the search results.
   * Checks both the full order number and the numeric suffix (e.g. CON6428-3012 → 3012).
   */
  async _waitForOrderInSearchResult(orderNumber, timeout = 10000) {
    const full = String(orderNumber).trim();
    const split = OrderManagementPage._splitOrderNumber(full);
    const candidates = [
      this.orderResultLinks.filter({ hasText: full }).first(),
      this.orderResultLinks.filter({ hasText: split }).first(),
    ];
    for (const locator of candidates) {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  /**
   * Searches for an order number and returns true/false based on whether results appear.
   * Uses Enter on the field as the primary action, falls back to clicking the Search button.
   */
  async searchOrderNumberWithState(orderNumber) {
    const field = this.orderIdField.first();
    const orderText = String(orderNumber).trim();

    if (!orderText) {
      throw new Error('orderNumber cannot be empty');
    }

    await field.waitFor({ state: 'visible', timeout: 15000 });
    if ((await field.inputValue()).trim() !== orderText) {
      await field.fill(orderText);
    }

    await field.press('Enter');
    if (await this._waitForOrderInSearchResult(orderText, 8000)) {
      return true;
    }
    if (await this.isNoOrderResultMessageVisible(1500)) {
      return false;
    }

    // Fallback: click search button
    await this.clickSearchButton();
    if (await this._waitForOrderInSearchResult(orderText, 10000)) {
      return true;
    }
    if (await this.isNoOrderResultMessageVisible(3000)) {
      return false;
    }
    return false;
  }

  /**
   * Searches for an order; throws if not found.
   */
  async searchOrderNumber(orderNumber) {
    if (!(await this.searchOrderNumberWithState(orderNumber))) {
      throw new Error(`No search result found for order '${orderNumber}'.`);
    }
    logger.info(`[OrderManagementPage] Found order in search: ${orderNumber}`);
  }

  /**
   * Clicks on an order number link in the search results.
   */
  async clickOrderNumber(orderNumber) {
    const full = String(orderNumber).trim();
    const split = OrderManagementPage._splitOrderNumber(full);
    const candidates = [
      this.orderResultLinks.filter({ hasText: full }).first(),
      this.orderResultLinks.filter({ hasText: split }).first(),
    ];

    for (const locator of candidates) {
      try {
        await locator.waitFor({ state: 'visible', timeout: 10000 });
        await locator.click({ timeout: 10000 });
        await this.page.waitForLoadState('domcontentloaded');
        logger.info(`[OrderManagementPage] Opened order: ${orderNumber}`);
        return;
      } catch {
        continue;
      }
    }

    throw new Error(`No clickable order link found for order '${full}'.`);
  }

  /**
   * Extracts the "Generated SKU" value from an order detail page.
   */
  async getGeneratedSkuValue() {
    const skuLine = this.page.getByText(/Generated SKU\s*:/i).first();
    await skuLine.waitFor({ state: 'visible', timeout: 15000 });
    const lineText = (await skuLine.innerText()).trim();

    const match = lineText.match(/Generated SKU\s*:\s*(.+)/i);
    if (match && match[1].trim()) {
      return match[1].trim();
    }

    const bodyText = await this.page.innerText('body');
    const bodyMatch = bodyText.match(/Generated SKU\s*:\s*(.+)/i);
    if (bodyMatch && bodyMatch[1].trim()) {
      return bodyMatch[1].trim().split('\n')[0].trim();
    }

    throw new Error('Could not extract Generated SKU value from order details page.');
  }

  /**
   * Returns true if "BOL:View File" link is visible on the order details page.
   */
  async isBolGenerated(timeout = 8000) {
    const locators = [
      this.page.locator(':text("BOL:View File")').first(),
      this.page.getByText('BOL:View File').first(),
      this.page.getByText(/\bBOL\s*:\s*View\s*File\b/i).first(),
    ];
    for (const locator of locators) {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        return true;
      } catch {
        continue;
      }
    }
    return false;
  }

  /**
   * Extracts the R+L Tracking Number from an order detail page.
   */
  async getRlTrackingNumber(timeout = 10000) {
    const locators = [
      this.page.getByText(/R\+L Tracking Number\s*:\s*\d+\s*Copy/i).first(),
      this.page.locator('li:has-text("R+L Tracking Number:")').first(),
      this.page.locator(':text("R+L Tracking Number:")').first(),
    ];

    for (const locator of locators) {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        const text = ((await locator.innerText()) || '').trim();
        const match = text.match(/R\+L Tracking Number\s*:\s*(\d+)/i);
        if (match) {
          return match[1].trim();
        }
      } catch {
        continue;
      }
    }

    const bodyText = await this.page.innerText('body');
    const bodyMatch = bodyText.match(/R\+L Tracking Number\s*:\s*(\d+)/i);
    if (bodyMatch) {
      return bodyMatch[1].trim();
    }

    throw new Error('Could not extract R+L Tracking Number from order details page.');
  }

  /**
   * Returns true if the order appears in the search result list.
   */
  async isOrderVisibleInSearch(orderNumber, timeout = 8000) {
    const full = String(orderNumber).trim();
    const split = OrderManagementPage._splitOrderNumber(full);
    const locators = [
      this.orderResultLinks.filter({ hasText: full }).first(),
      this.orderResultLinks.filter({ hasText: split }).first(),
      this.page.locator('a.order-id').filter({ hasText: full }).first(),
      this.page.locator('a.order-id').filter({ hasText: split }).first(),
      this.page.locator('table tr').filter({ hasText: full }).first(),
      this.page.locator('table tr').filter({ hasText: split }).first(),
    ];

    for (const locator of locators) {
      try {
        await locator.waitFor({ state: 'visible', timeout });
        return true;
      } catch {
        continue;
      }
    }

    if (await this.isNoOrderResultMessageVisible(1500)) {
      return false;
    }
    return false;
  }

  // ─── Shop assignment (on order detail page) ───────────────────────────────────

  /**
   * Returns the current shop assignment state: { assigned: boolean, shopText: string }.
   */
  async getShopAssignmentState() {
    try {
      await this.shopNa.first().waitFor({ state: 'visible', timeout: 2500 });
      if (await this.shopNa.first().isVisible()) {
        return { assigned: false, shopText: 'Shop: N/A' };
      }
    } catch {
      // not N/A
    }

    for (const locator of [this.shopWks.first(), this.shopWrh.first()]) {
      try {
        await locator.waitFor({ state: 'visible', timeout: 2500 });
        if (await locator.isVisible()) {
          return { assigned: true, shopText: (await locator.innerText()).trim() };
        }
      } catch {
        continue;
      }
    }

    const bodyText = await this.page.innerText('body');
    const match = bodyText.match(/Shop:\s*([A-Za-z0-9/_ -]+)/);
    if (match) {
      const shopText = `Shop: ${match[1].trim()}`;
      return {
        assigned: shopText.toUpperCase() !== 'SHOP: N/A',
        shopText,
      };
    }

    return { assigned: false, shopText: '' };
  }

  /**
   * Clicks the "Reassign Shop" link on the order detail page.
   */
  async clickReassignShopLink() {
    const candidates = [
      this.reassignShopLink.first(),
      this.page.getByRole('link', { name: 'Reassign Shop' }).first(),
    ];
    for (const locator of candidates) {
      try {
        await locator.waitFor({ state: 'visible', timeout: 5000 });
        await locator.click();
        logger.info('[OrderManagementPage] Clicked Reassign Shop link');
        return;
      } catch {
        continue;
      }
    }
    throw new Error('Reassign Shop link is not visible/clickable.');
  }

  /**
   * Selects a shop from the reassignment dropdown.
   * @param {string} shopName - e.g. 'WRH', 'Wilkes'
   */
  async selectShop(shopName) {
    const dropdown = this.page.locator('#reassign_shop_field');
    await dropdown.waitFor({ state: 'visible', timeout: 10000 });
    await dropdown.selectOption({ value: String(shopName).trim() });
    logger.info(`[OrderManagementPage] Selected shop: ${shopName}`);
  }

  /**
   * Clicks the "Reassign Shop" submit button.
   */
  async clickReassignSubmitButton() {
    await this.reassignSubmitButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await this.reassignSubmitButton.first().click();
    await this.page.waitForLoadState('domcontentloaded');
    logger.info('[OrderManagementPage] Submitted shop reassignment');
  }

  /**
   * Reads the current order status from the status button.
   */
  async getOrderStatusText(timeout = 10000) {
    await this.orderStatusButton.first().waitFor({ state: 'visible', timeout });
    const text = (await this.orderStatusButton.first().innerText()).trim().replace(/\s+/g, ' ');
    const ALLOWED = [
      'In Production',
      'Pre-Assembly',
      'Assembly',
      'Sanding',
      'Finishing',
      'Ready To Ship',
      'Shipped',
      'Completed',
      'Canceled',
      'Add Features',
    ];
    for (const status of ALLOWED) {
      if (text.toLowerCase() === status.toLowerCase()) {
        return status;
      }
      if (new RegExp(`\\b${status}\\b`, 'i').test(text)) {
        return status;
      }
    }
    return text;
  }

  /**
   * Waits for a specific shop to be shown as assigned after reassignment.
   */
  async waitForShopAssignment(shopName, timeout = 12000) {
    const expected = String(shopName).trim();
    if (!expected) {
      return;
    }
    const locator = this.page.getByText(`Shop: ${expected}`).first();
    try {
      await locator.waitFor({ state: 'visible', timeout });
    } catch {
      await this.shopNa
        .first()
        .waitFor({ state: 'hidden', timeout })
        .catch(() => null);
    }
  }

  /**
   * Returns whether the "You can't reassign the same shop" message is visible.
   */
  async isSameShopReassignMessageVisible(timeout = 3000) {
    try {
      await this.page
        .getByText("You can't reassign the same shop")
        .first()
        .waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns whether the reassignment failure message is visible.
   */
  async isReassignFailureMessageVisible(timeout = 3000) {
    try {
      await this.page
        .getByText('Feature possess failed. Something went wrong.')
        .first()
        .waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { OrderManagementPage };
