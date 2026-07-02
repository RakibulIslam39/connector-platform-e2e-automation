'use strict';

/**
 * Optional environment variables with descriptions.
 * These are not validated at startup but are expected to be set for specific test suites.
 */
const OPTIONAL_VARS = [
  { key: 'WP_ADMIN_DISPLAY_NAME', description: 'WordPress admin display name — asserted in login validation tests' },
  { key: 'WP_PARTNER_USER', description: 'WordPress partner username' },
  { key: 'WP_PARTNER_PASS', description: 'WordPress partner password' },
  { key: 'HUB_ADMIN_USER', description: 'HoodslyHub admin username' },
  { key: 'HUB_ADMIN_PASS', description: 'HoodslyHub admin password' },
  { key: 'PARTNER_SITE_BASE_URL', description: 'Partner WordPress site base URL — required for partner-site test suite' },
  { key: 'TEST_ORDER_NUMBER', description: 'WooCommerce/HoodslyHub order number for SKU/BOL/status verification tests' },
  { key: 'EXPECTED_ORDER_STATUS', description: 'Expected WooCommerce order status for cross-system status sync assertions' },
  { key: 'ORDER_WITH_BOL', description: 'HoodslyHub order number known to have a generated BOL + R+L tracking number' },
  { key: 'ORDER_FOR_SHOP_ASSIGN', description: 'HoodslyHub order number to use in shop assignment / reassignment tests' },
  { key: 'TARGET_SHOP_NAME', description: 'Shop name to assign in shop reassignment tests (e.g. Wilkes, WRH)' },
  { key: 'WRH_TEST_ORDER_ID', description: 'Order ID to use in WRH Hub order status update tests' },
  { key: 'WRH_NEW_ORDER_STATUS', description: 'New order status to set in WRH Hub status update tests (e.g. In Production)' },
];

/**
 * Required environment variables and their descriptions.
 * The framework will fail fast at startup if any are missing.
 */
const REQUIRED_VARS = [
  { key: 'BASE_URL', description: 'Partner site under test base URL' },
  { key: 'CONNECTOR_API_BASE_URL', description: 'Connector Platform API base URL' },
  { key: 'CONNECTOR_API_SIGNATURE', description: 'Connector Platform API signature header' },
  { key: 'HUB_BASE_URL', description: 'HoodslyHub base URL' },
  { key: 'WP_ADMIN_USER', description: 'WordPress admin username' },
  { key: 'WP_ADMIN_PASS', description: 'WordPress admin password' },
];

/**
 * Validates that all required environment variables are set.
 * Throws a descriptive error listing all missing vars.
 */
function validateEnv() {
  const missing = REQUIRED_VARS.filter(({ key }) => !process.env[key]);

  if (missing.length > 0) {
    const lines = missing.map(({ key, description }) => `  - ${key}: ${description}`);
    throw new Error(
      `[env.schema] Missing required environment variables:\n${lines.join('\n')}\n\n` +
        `Please copy .env.example to environments/.env.${process.env.ENV || 'local'} and fill in the values.`
    );
  }
}

module.exports = { validateEnv, REQUIRED_VARS, OPTIONAL_VARS };
