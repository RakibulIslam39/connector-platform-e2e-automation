'use strict';

const logger = require('./logger');

/**
 * Smart wait utilities that go beyond simple timeouts.
 * All utilities accept a Playwright Page object.
 */

/**
 * Waits for a network response matching a URL pattern.
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp} urlPattern
 * @param {number} timeout
 */
async function waitForResponse(page, urlPattern, timeout = 30000) {
  return await page.waitForResponse(
    (response) => {
      const url = response.url();
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern);
      }
      return urlPattern.test(url);
    },
    { timeout }
  );
}

/**
 * Waits for an API response and returns the parsed JSON body.
 * @param {import('@playwright/test').Page} page
 * @param {string|RegExp} urlPattern
 */
async function waitForApiResponse(page, urlPattern) {
  const response = await waitForResponse(page, urlPattern);
  return await response.json();
}

/**
 * Waits for a WordPress admin notice (success/error/warning).
 * @param {import('@playwright/test').Page} page
 * @param {'success'|'error'|'warning'} type
 */
async function waitForWpNotice(page, type = 'success') {
  const selector = `.notice-${type}`;
  await page.locator(selector).waitFor({ state: 'visible', timeout: 15000 });
  return await page.locator(selector).textContent();
}

/**
 * Polls a condition function until it returns true or times out.
 * @param {Function} conditionFn - async function returning boolean
 * @param {number} timeout - total timeout in ms
 * @param {number} interval - polling interval in ms
 */
async function pollUntil(conditionFn, timeout = 30000, interval = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await sleep(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Simple sleep/delay.
 * Use sparingly — prefer explicit waits over arbitrary sleeps.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits for a page element to stabilize (stop moving/resizing).
 * Useful for animated elements.
 * @param {import('@playwright/test').Page} page
 * @param {string} selector
 */
async function waitForStable(page, selector) {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible' });
  await expect(locator).toBeStable();
}

/**
 * Waits for WordPress AJAX spinner to disappear.
 * @param {import('@playwright/test').Page} page
 */
async function waitForWpSpinner(page) {
  try {
    await page.locator('.spinner.is-active').waitFor({ state: 'hidden', timeout: 30000 });
  } catch {
    logger.debug('WP spinner did not appear or already gone');
  }
}

/**
 * Waits for WooCommerce checkout to complete processing.
 * @param {import('@playwright/test').Page} page
 */
async function waitForCheckoutProcessing(page) {
  try {
    await page.locator('.processing').waitFor({ state: 'hidden', timeout: 60000 });
  } catch {
    logger.debug('Checkout processing overlay not found');
  }
}

module.exports = {
  waitForResponse,
  waitForApiResponse,
  waitForWpNotice,
  pollUntil,
  sleep,
  waitForStable,
  waitForWpSpinner,
  waitForCheckoutProcessing,
};
