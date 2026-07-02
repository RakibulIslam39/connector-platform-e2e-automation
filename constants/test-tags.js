'use strict';

/**
 * Test tag constants used for filtering test runs.
 *
 * Usage in specs:
 *   test(`@smoke verify product listing loads`, async ({ page }) => { ... });
 *   test.describe(`@regression Partner Onboarding`, () => { ... });
 *
 * Run filtered:
 *   npx playwright test --grep @smoke
 *   npx playwright test --grep @regression
 *   npx playwright test --grep "@connector"
 */

const TAGS = {
  SMOKE: '@smoke',
  REGRESSION: '@regression',
  SANITY: '@sanity',
  API: '@api',
  CONNECTOR: '@connector',
  HUB: '@hub',
  WRH: '@wrh',
  WIKS: '@wiks',
  PARTNER: '@partner',
  ORDER: '@order',
  SKU: '@sku',
  PRODUCT: '@product',
  AUTH: '@auth',
  DAMAGE_CLAIM: '@damage-claim',
  COLOR: '@color',
  MAPPING: '@mapping',
  SHIPPING: '@shipping',
  WOOCOMMERCE: '@woocommerce',
  SLOW: '@slow',
  CRITICAL: '@critical',
};

module.exports = { TAGS };
