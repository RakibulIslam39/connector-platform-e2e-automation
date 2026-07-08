'use strict';

const { ApiClient } = require('./api-client');
const { HUB_API } = require('../../constants/api-endpoints');
const logger = require('../utils/logger');

/**
 * HoodslyHub API service.
 * Provides typed methods for all HoodslyHub API endpoints.
 */
class HubApiService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} hubBaseUrl - Optional override for hub base URL
   */
  constructor(request, hubBaseUrl) {
    const baseUrl = hubBaseUrl || process.env.HUB_BASE_URL || HUB_API.BASE;
    super(request, baseUrl, {
      'Content-Type': 'application/json',
    });
  }

  // ─── Orders ──────────────────────────────────────────────────────────────────

  /**
   * Fetches all orders from the Hub.
   */
  async getOrders(params = {}) {
    logger.info('[HubAPI] Fetching orders');
    const { body } = await this.get(HUB_API.ORDERS, { params });
    return body;
  }

  /**
   * Fetches a specific order by ID.
   */
  async getOrderById(orderId) {
    logger.info(`[HubAPI] Fetching order: ${orderId}`);
    const { body } = await this.get(`${HUB_API.ORDERS}/${orderId}`);
    return body;
  }

  /**
   * Updates the status of an order.
   */
  async updateOrderStatus(orderId, status, note = '') {
    logger.info(`[HubAPI] Updating order ${orderId} status to: ${status}`);
    const { body } = await this.put(`${HUB_API.ORDER_STATUS}/${orderId}`, { status, note });
    return body;
  }

  /**
   * Checks current order status.
   */
  async getOrderStatus(orderId) {
    const order = await this.getOrderById(orderId);
    return order.status;
  }

  // ─── Partners ────────────────────────────────────────────────────────────────

  /**
   * Fetches partners configured in the Hub.
   */
  async getPartners() {
    logger.info('[HubAPI] Fetching Hub partners');
    const { body } = await this.get(HUB_API.PARTNERS);
    return body;
  }

  // ─── Shipping ────────────────────────────────────────────────────────────────

  /**
   * Fetches shipping information for an order.
   */
  async getShippingInfo(orderId) {
    logger.info(`[HubAPI] Fetching shipping info for order: ${orderId}`);
    const { body } = await this.get(`${HUB_API.SHIPPING}/${orderId}`);
    return body;
  }

  /**
   * Fetches tracking information for an order.
   */
  async getTracking(orderId) {
    logger.info(`[HubAPI] Fetching tracking for order: ${orderId}`);
    const { body } = await this.get(`${HUB_API.TRACKING}/${orderId}`);
    return body;
  }

  // ─── Order status polling ────────────────────────────────────────────────────

  /**
   * Polls until an order reaches the expected status.
   * @param {string} orderId
   * @param {string} expectedStatus
   * @param {number} timeout - in ms
   * @param {number} interval - polling interval in ms
   */
  async waitForOrderStatus(orderId, expectedStatus, timeout = 120000, interval = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const status = await this.getOrderStatus(orderId);
      logger.debug(`[HubAPI] Order ${orderId} current status: ${status}`);
      if (status === expectedStatus) {
        return status;
      }
      await new Promise((r) => setTimeout(r, interval));
    }
    throw new Error(
      `Order ${orderId} did not reach status "${expectedStatus}" within ${timeout}ms`
    );
  }
}

module.exports = { HubApiService };
