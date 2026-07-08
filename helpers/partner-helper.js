'use strict';

const { generatePartnerData } = require('../common/utils/data-utils');
const logger = require('../common/utils/logger');

/**
 * Partner setup and configuration helpers.
 * These simplify multi-step partner onboarding in tests.
 */

/**
 * Partner type definitions and their configuration requirements.
 */
const PARTNER_TYPES = {
  B2B: 'b2b',
  B2C: 'b2c',
};

const PLATFORM_TYPES = {
  WORDPRESS: 'wordpress',
  SHOPIFY: 'shopify',
  MAGENTO: 'magento',
};

const COLOR_STYLES = {
  SELECT: 'select',
  SWATCH: 'swatch',
};

/**
 * Builds default partner configuration data for a given partner type.
 * Useful for quickly generating valid test partner data.
 * @param {'b2b'|'b2c'} type
 * @param {object} overrides
 */
function buildPartnerConfig(type = 'b2b', overrides = {}) {
  const base = generatePartnerData({ type });
  return {
    ...base,
    colorStyle: type === 'b2c' ? COLOR_STYLES.SWATCH : COLOR_STYLES.SELECT,
    ventilationEnabled: true,
    trimsEnabled: true,
    sizesEnabled: true,
    productsEnabled: true,
    ...overrides,
  };
}

/**
 * Validates that a partner name matches exactly between Connector Platform and Hub.
 * Name mismatches (spaces, underscores) cause status sync failures.
 * @param {string} connectorName - Name in Connector Platform
 * @param {string} hubSourceName - Name in Hub API Settings
 * @returns {{ valid: boolean, message: string }}
 */
function validatePartnerNameSync(connectorName, hubSourceName) {
  if (connectorName === hubSourceName) {
    return { valid: true, message: 'Partner names match' };
  }

  const spaceDiff = connectorName.replace(/_/g, ' ') === hubSourceName.replace(/_/g, ' ');
  const underscoreDiff = connectorName.replace(/ /g, '_') === hubSourceName.replace(/ /g, '_');

  let message;
  if (spaceDiff || underscoreDiff) {
    message = `Partner name mismatch: space/underscore difference. Connector: "${connectorName}", Hub: "${hubSourceName}"`;
  } else {
    message = `Partner name mismatch. Connector: "${connectorName}", Hub: "${hubSourceName}"`;
  }

  logger.warn(`[partner-helper] ${message}`);
  return { valid: false, message };
}

/**
 * Validates the structure of a partner API key.
 * @param {string} apiKey
 * @returns {boolean}
 */
function validateApiKeyFormat(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return false;
  }
  // API keys are typically long alphanumeric strings
  return apiKey.length >= 32 && /^[A-Za-z0-9]+$/.test(apiKey);
}

/**
 * Generates a valid SKU prefix from a partner name.
 * Convention: first 3 uppercase letters of the partner name.
 * @param {string} partnerName
 * @returns {string}
 */
function generateSkuPrefix(partnerName) {
  return partnerName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase();
}

module.exports = {
  PARTNER_TYPES,
  PLATFORM_TYPES,
  COLOR_STYLES,
  buildPartnerConfig,
  validatePartnerNameSync,
  validateApiKeyFormat,
  generateSkuPrefix,
};
