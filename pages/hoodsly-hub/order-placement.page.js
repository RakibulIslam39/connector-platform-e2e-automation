'use strict';

const { BasePage } = require('../base.page');
const { HUB_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class OrderPlacementPage extends BasePage {
  constructor(page) {
    super(page);
    this.manualPlacementForm = page.locator('#manual-placement-form, .manual-placement-form');
    this.manualPlacementTab = page.locator('#manual-placement-tab');
    this.orderIdInput = page.locator('[name="order_id"]');
    this.partnerSelect = page.locator('[name="partner_id"]');
    this.shopSelect = page.locator('[name="target_shop"]');
    this.placeOrderBtn = page.locator('[name="place_order"], [data-action="place-order"]');
    this.payloadDebugSection = page.locator('.payload-debug, .order-payload');
    this.responseDebugSection = page.locator('.response-debug, .order-response');
    this.orderTrackingSection = page.locator('.order-tracking, .tracking-info');

    // Connector search section locators (used in manual placement flow)
    this.hoodslyConnectorLink = page.getByText('Hoodsly Connector');
    this.searchButton = page.locator('button.btn-search');
    this.orderIdSearchField = page.getByLabel('Type Order ID Below');
    this.orderResultLinks = page.locator('div.order-meta a.order-id');
    this.noOrderResultMessage = page.getByText('There is no order ID to your query.');

    // Shop assignment locators
    this.shopWks = page.getByText('Shop: WKS');
    this.shopWrh = page.getByText('Shop: WRH');
    this.shopNa = page.getByText('Shop: N/A');
    this.reassignShopLink = page.locator('a.hub_reassign_shop:visible');
    this.shopSelectDropdown = page.locator('#reassign_shop_field:visible');
    this.reassignSubmitButton = page.locator("//input[@value='Reassign Shop']");

    // Order status button (matches any known status)
    this.orderStatusButton = page.locator('button').filter({
      hasText:
        /In Production|Pre-Assembly|Assembly|Sanding|Finishing|Ready To Ship|Shipped|Completed|Canceled|Add Features/i,
    });
  }

  async goto() {
    await this.navigate(HUB_PATHS.ORDER_PLACEMENT);
  }

  // ─── Normalisation ────────────────────────────────────────────────────────────

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

  // ─── Manual placement tab / search ───────────────────────────────────────────

  /**
   * Navigates to the Manual Placement tab inside the Hoodsly Connector page.
   */
  async clickManualPlacementTab() {
    logger.info('[OrderPlacementPage] Clicking Manual Placement tab');
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.manualPlacementTab.click();
  }

  /**
   * Places an order manually for a specific order ID to a target shop.
   */
  async placeOrderManually(orderId, targetShop) {
    logger.info(`[OrderPlacementPage] Manually placing order ${orderId} to shop: ${targetShop}`);
    await this.goto();

    await this.orderIdInput.fill(String(orderId));
    await this.shopSelect.selectOption(targetShop);
    await this.placeOrderBtn.click();
    await this.waitForPageLoad();

    logger.info(`[OrderPlacementPage] Order ${orderId} placed to ${targetShop}`);
  }

  /**
   * Gets the payload that was sent to the fulfillment shop.
   */
  async getOrderPayload() {
    if (await this.payloadDebugSection.isVisible()) {
      return await this.payloadDebugSection.textContent();
    }
    return null;
  }

  /**
   * Gets the API response from the fulfillment shop.
   */
  async getOrderResponse() {
    if (await this.responseDebugSection.isVisible()) {
      return await this.responseDebugSection.textContent();
    }
    return null;
  }

  /**
   * Gets tracking information displayed on the placement page.
   */
  async getTrackingInfo() {
    if (await this.orderTrackingSection.isVisible()) {
      return await this.orderTrackingSection.textContent();
    }
    return null;
  }

  /**
   * Assigns an order to a specific shop from the order row.
   */
  async assignOrderToShop(orderId, shop) {
    logger.info(`[OrderPlacementPage] Assigning order ${orderId} to ${shop}`);
    const shopSelect = this.page.locator(`[data-order-id="${orderId}"] select[name="shop"]`);
    if (await shopSelect.isVisible()) {
      await shopSelect.selectOption(shop);
    }
    await this.page.locator(`[data-order-id="${orderId}"] [data-action="assign"]`).click();
    await this.waitForPageLoad();
  }

  // ─── Order search inside connector section ────────────────────────────────────

  /**
   * Clicks the "Hoodsly Connector" link in the HoodslyHub sidebar.
   */
  async clickHoodslyConnector() {
    logger.info('[OrderPlacementPage] Clicking Hoodsly Connector link');
    await this.hoodslyConnectorLink.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.hoodslyConnectorLink.first().click();
  }

  /**
   * Clicks the search (magnifier) button in the connector section.
   */
  async clickSearchButton() {
    await this.searchButton.first().waitFor({ state: 'visible', timeout: 15000 });
    await this.searchButton.first().click();
  }

  async isNoOrderResultMessageVisible(timeout = 2000) {
    try {
      await this.noOrderResultMessage.first().waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async _waitForOrderInSearchResult(orderNumber, timeout = 10000) {
    const full = String(orderNumber).trim();
    const split = OrderPlacementPage._splitOrderNumber(full);
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
   * Searches for an order in the Manual Placement connector search and returns
   * whether the order appeared (true) or not (false).
   */
  async searchOrderNumberWithState(orderNumber) {
    const field = this.orderIdSearchField.first();
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
   * Returns true if a given order number is visible in the Manual Placement list.
   */
  async isOrderVisible(orderNumber, timeout = 8000) {
    const full = String(orderNumber).trim();
    const split = OrderPlacementPage._splitOrderNumber(full);
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

  // ─── Shop assignment ──────────────────────────────────────────────────────────

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
        logger.info('[OrderPlacementPage] Clicked Reassign Shop link');
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
    logger.info(`[OrderPlacementPage] Selected shop: ${shopName}`);
  }

  /**
   * Clicks the Reassign Shop submit button.
   */
  async clickReassignSubmitButton() {
    await this.reassignSubmitButton.first().waitFor({ state: 'visible', timeout: 10000 });
    await this.reassignSubmitButton.first().click();
    await this.page.waitForLoadState('domcontentloaded');
    logger.info('[OrderPlacementPage] Submitted shop reassignment');
  }

  /**
   * Reads the current order status from the status button on the order detail page.
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
   * Waits until a specific shop is shown as assigned.
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
   * Returns true if "You can't reassign the same shop" message is visible.
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
   * Returns true if the reassignment failure message is visible.
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

module.exports = { OrderPlacementPage };
