'use strict';

const { BasePage } = require('../base.page');
const { PARTNER_SITE_SELECTORS } = require('../../constants/selectors');
const logger = require('../../common/utils/logger');

/**
 * PartnerSiteOrdersPage — WooCommerce order list and order detail interactions
 * on the partner WordPress site.
 *
 * Handles:
 *  - Navigating to the WooCommerce orders list via the admin menu
 *  - Searching for an order by number
 *  - Opening an order detail page
 *  - Extracting the RL Carrier tracking number (used for BOL verification)
 *  - Reading the current WooCommerce order status
 *
 * Tests using this page must navigate to PARTNER_SITE_BASE_URL/wp-admin/ in beforeEach.
 */
class PartnerSiteOrdersPage extends BasePage {
  constructor(page) {
    super(page);
    this.woocommerceMenuLink = page
      .locator('div')
      .filter({ hasText: /^WooCommerce$/ })
      .first();
    this.ordersMenuLink = page
      .locator(PARTNER_SITE_SELECTORS.WC_ORDERS_MENU)
      .filter({ hasText: /Orders/ })
      .first();
    this.orderSearchInput = page.locator(PARTNER_SITE_SELECTORS.ORDER_SEARCH_INPUT).first();
    this.orderStatusSelect = page.locator(PARTNER_SITE_SELECTORS.ORDER_STATUS_SELECT).first();
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async navigateToOrders() {
    await this.woocommerceMenuLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.woocommerceMenuLink.click();
    await this.page.waitForLoadState('domcontentloaded');
    await this.ordersMenuLink.click();
    await this.waitForPageLoad();
    logger.info('[PartnerSiteOrdersPage] Navigated to WooCommerce Orders');
  }

  // ─── Order search ─────────────────────────────────────────────────────────

  async searchOrder(orderNumber) {
    const normalized = String(orderNumber).trim();
    await this.orderSearchInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.orderSearchInput.fill(normalized);
    await this.orderSearchInput.press('Enter');
    await this.waitForPageLoad();
    logger.info(`[PartnerSiteOrdersPage] Searched for order: ${normalized}`);
  }

  /**
   * Clicks on the order row to open the order detail page.
   * WooCommerce shows orders as "#XXXX CustomerName" — tries multiple selector patterns.
   */
  async openOrderByNumber(orderNumber) {
    const normalized = String(orderNumber).trim();
    const candidates = [
      this.page.getByText(`#${normalized}`, { exact: false }).first(),
      this.page.locator(`strong:has-text("#${normalized}")`).first(),
      this.page.locator(`a:has-text("#${normalized}")`).first(),
    ];
    for (const locator of candidates) {
      try {
        await locator.waitFor({ state: 'visible', timeout: 8000 });
        await locator.click();
        await this.waitForPageLoad();
        logger.info(`[PartnerSiteOrdersPage] Opened order #${normalized}`);
        return;
      } catch {
        continue;
      }
    }
    throw new Error(`Order row not found for order number: ${orderNumber}`);
  }

  // ─── Order detail ─────────────────────────────────────────────────────────

  /**
   * Extracts the RL Carrier tracking number from the order detail page.
   * Tries the "Tracking Number:" label and surrounding DOM; falls back to full page text.
   */
  async getTrackingNumber() {
    const trackingRegex = /Tracking Number:\s*([A-Za-z0-9-]+)/i;
    const candidates = [
      this.page.getByText('Tracking Number:').first(),
      this.page.locator(':text-is("Tracking Number:")').first(),
    ];

    for (const label of candidates) {
      try {
        await label.waitFor({ state: 'visible', timeout: 8000 });
        const labelText = ((await label.textContent()) || '').trim();
        const match = trackingRegex.exec(labelText);
        if (match) {
          return match[1].trim();
        }

        const parentText = ((await label.locator('xpath=..').textContent()) || '').trim();
        const parentMatch = trackingRegex.exec(parentText);
        if (parentMatch) {
          return parentMatch[1].trim();
        }

        const nextText = (
          (await label.locator('xpath=following-sibling::*[1]').textContent()) || ''
        ).trim();
        if (nextText) {
          return nextText.replace(':', '').trim();
        }
      } catch {
        continue;
      }
    }

    const pageText = await this.page.locator('body').innerText();
    const pageMatch = trackingRegex.exec(pageText);
    if (pageMatch) {
      return pageMatch[1].trim();
    }

    throw new Error('Could not extract Tracking Number from partner site order detail page.');
  }

  /**
   * Reads the current WooCommerce order status from the order detail page.
   */
  async getOrderStatus() {
    await this.orderStatusSelect.waitFor({ state: 'visible', timeout: 10000 });
    const status = ((await this.orderStatusSelect.textContent()) || '').trim();
    if (!status) {
      throw new Error('Order status is empty on partner site order detail page.');
    }
    logger.info(`[PartnerSiteOrdersPage] Order status: ${status}`);
    return status;
  }
}

module.exports = { PartnerSiteOrdersPage };
