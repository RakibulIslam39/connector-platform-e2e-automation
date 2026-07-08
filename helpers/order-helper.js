'use strict';

const logger = require('../common/utils/logger');

/**
 * Order flow helpers — utilities for navigating and verifying the
 * Partner → HoodslyHub → WRH/Wiks order flow.
 */

/**
 * Maps WooCommerce order statuses to their Hub-side equivalents.
 */
const STATUS_MAP = {
  pending: 'pending',
  processing: 'production',
  'wc-production': 'production',
  'wc-finishing': 'finishing',
  completed: 'shipped',
  'wc-shipped': 'shipped',
  cancelled: 'cancelled',
  'on-hold': 'hold',
};

/**
 * Maps Hub order statuses back to partner site statuses for sync validation.
 */
const HUB_TO_PARTNER_STATUS = {
  production: 'wc-production',
  finishing: 'wc-finishing',
  shipped: 'completed',
  hold: 'on-hold',
  cancelled: 'cancelled',
};

/**
 * Determines the fulfillment shop for an order based on product category.
 * - Standard hoods → WRHHub or WiksHub
 * - Floating Shelves → WiksHub (via UPS, not RL)
 * - Quick Ship (qsp) → WRHHub with One-In-One-Out inventory
 */
function determineTargetShop(productCategory, productType = '') {
  if (productType.toLowerCase().includes('qsp') || productType.toLowerCase().includes('quick')) {
    return 'wrh';
  }
  if (
    productCategory.toLowerCase().includes('floating') ||
    productCategory.toLowerCase().includes('shelf')
  ) {
    return 'wiks';
  }
  return 'wrh';
}

/**
 * Validates that an order has the required fields for BOL generation.
 * RL Courier requires valid US phone and accurate email.
 * @param {object} orderData
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateForBOL(orderData) {
  const errors = [];

  const usPhoneRegex = /^\+?1?\s*\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
  if (!orderData.phone || !usPhoneRegex.test(orderData.phone)) {
    errors.push('Invalid or missing US phone number (required for BOL generation)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!orderData.email || !emailRegex.test(orderData.email)) {
    errors.push('Invalid or missing email address (required for BOL generation)');
  }

  if (!orderData.shipperName || orderData.shipperName.trim() === '') {
    errors.push('Missing shipper name (required for BOL generation)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculates the expected order hold release time.
 * @param {Date} orderCreatedAt
 * @param {number} holdHours - configured hold period in hours (default 24)
 * @returns {Date}
 */
function calculateHoldReleaseTime(orderCreatedAt, holdHours = 24) {
  const releaseTime = new Date(orderCreatedAt.getTime() + holdHours * 60 * 60 * 1000);
  logger.debug(`[order-helper] Hold release time: ${releaseTime.toISOString()}`);
  return releaseTime;
}

/**
 * Parses a partner order ID from HoodslyHub's unique ID format.
 * Hub generates unique IDs; multi-item orders use suffix: baseId-1, baseId-2, etc.
 * @param {string} hubOrderId
 */
function parseHubOrderId(hubOrderId) {
  const parts = hubOrderId.split('-');
  const hasSuffix = parts.length > 1 && !isNaN(Number(parts[parts.length - 1]));
  return {
    baseId: hasSuffix ? parts.slice(0, -1).join('-') : hubOrderId,
    suffix: hasSuffix ? parseInt(parts[parts.length - 1], 10) : null,
    isMultiItem: hasSuffix,
  };
}

module.exports = {
  STATUS_MAP,
  HUB_TO_PARTNER_STATUS,
  determineTargetShop,
  validateForBOL,
  calculateHoldReleaseTime,
  parseHubOrderId,
};
