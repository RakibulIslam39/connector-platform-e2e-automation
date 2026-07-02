'use strict';

const { WOOCOMMERCE_SELECTORS } = require('../../constants/selectors');
const { PARTNER_SITE_PATHS } = require('../../constants/urls');
const logger = require('../utils/logger');
const { waitForCheckoutProcessing } = require('../utils/wait-utils');

/**
 * Reusable WooCommerce storefront and admin actions.
 */

/**
 * Adds a product to the cart by product slug.
 * @param {import('@playwright/test').Page} page
 * @param {string} productSlug
 */
async function addToCart(page, productSlug) {
  await page.goto(`/product/${productSlug}`);
  await page.locator(WOOCOMMERCE_SELECTORS.ADD_TO_CART).click();
  logger.info(`[woo-actions] Added to cart: ${productSlug}`);
}

/**
 * Adds a product with specific variation attributes to the cart.
 * @param {import('@playwright/test').Page} page
 * @param {string} productSlug
 * @param {object} attributes - { attributeName: attributeValue }
 */
async function addVariationToCart(page, productSlug, attributes = {}) {
  await page.goto(`/product/${productSlug}`);

  for (const [attrName, attrValue] of Object.entries(attributes)) {
    const selectLocator = page.locator(`select[name="attribute_${attrName.toLowerCase()}"]`);
    if (await selectLocator.isVisible()) {
      await selectLocator.selectOption(attrValue);
    }
  }

  await page.locator(WOOCOMMERCE_SELECTORS.ADD_TO_CART).click();
  logger.info(`[woo-actions] Added variation to cart: ${productSlug}`, attributes);
}

/**
 * Fills out the WooCommerce checkout form with provided billing details.
 * @param {import('@playwright/test').Page} page
 * @param {object} billingData
 */
async function fillCheckoutForm(page, billingData) {
  logger.info('[woo-actions] Filling checkout form');

  await page.goto(PARTNER_SITE_PATHS.CHECKOUT);
  await page.waitForLoadState('domcontentloaded');

  const {
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    country = 'US',
  } = billingData;

  await page.locator(WOOCOMMERCE_SELECTORS.BILLING_FIRST_NAME).fill(firstName);
  await page.locator(WOOCOMMERCE_SELECTORS.BILLING_LAST_NAME).fill(lastName);
  await page.locator(WOOCOMMERCE_SELECTORS.BILLING_EMAIL).fill(email);
  await page.locator(WOOCOMMERCE_SELECTORS.BILLING_PHONE).fill(phone);
  await page.locator('#billing_address_1').fill(address);
  await page.locator('#billing_city').fill(city);
  await page.locator('#billing_state').selectOption(state);
  await page.locator('#billing_postcode').fill(zip);
  await page.locator('#billing_country').selectOption(country);
}

/**
 * Places an order on the WooCommerce checkout page.
 * Returns the order ID from the confirmation page.
 * @param {import('@playwright/test').Page} page
 */
async function placeOrder(page) {
  logger.info('[woo-actions] Placing order');
  await page.locator(WOOCOMMERCE_SELECTORS.PLACE_ORDER_BTN).click();
  await waitForCheckoutProcessing(page);

  await page.waitForURL(/order-received|checkout\/order-received/, { timeout: 60000 });

  const orderId = await page
    .locator(WOOCOMMERCE_SELECTORS.ORDER_ID)
    .textContent()
    .catch(() => null);
  logger.info(`[woo-actions] Order placed: ${orderId}`);
  return orderId;
}

/**
 * Performs a complete checkout flow: navigate to checkout, fill form, place order.
 * @param {import('@playwright/test').Page} page
 * @param {object} billingData
 */
async function completeCheckout(page, billingData) {
  await fillCheckoutForm(page, billingData);
  return await placeOrder(page);
}

/**
 * Gets current cart item count from the cart badge.
 * @param {import('@playwright/test').Page} page
 */
async function getCartCount(page) {
  const text = await page.locator(WOOCOMMERCE_SELECTORS.CART_COUNT).textContent().catch(() => '0');
  return parseInt(text.replace(/\D/g, ''), 10);
}

/**
 * Empties the cart by visiting the cart page and removing all items.
 * @param {import('@playwright/test').Page} page
 */
async function emptyCart(page) {
  await page.goto(PARTNER_SITE_PATHS.CART);
  const removeLinks = page.locator('.remove[data-product_id]');
  const count = await removeLinks.count();
  for (let i = 0; i < count; i++) {
    await removeLinks.first().click();
    await page.waitForLoadState('domcontentloaded');
  }
  logger.info('[woo-actions] Cart emptied');
}

/**
 * Gets order details from My Account → Orders.
 * @param {import('@playwright/test').Page} page
 * @param {string} orderId
 */
async function getOrderFromMyAccount(page, orderId) {
  await page.goto(PARTNER_SITE_PATHS.ORDER_TRACKING);
  const orderRow = page.locator(`a[href*="${orderId}"]`).first();
  await orderRow.click();
  await page.waitForLoadState('domcontentloaded');
  return await page.locator('.woocommerce-order-details').textContent();
}

module.exports = {
  addToCart,
  addVariationToCart,
  fillCheckoutForm,
  placeOrder,
  completeCheckout,
  getCartCount,
  emptyCart,
  getOrderFromMyAccount,
};
