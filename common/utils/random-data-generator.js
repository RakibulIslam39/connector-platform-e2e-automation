'use strict';

/**
 * RandomDataGenerator — extended Faker-based generators for the partner creation suite.
 *
 * This module supplements (not replaces) common/utils/data-utils.js with generators
 * specifically needed for the partner creation, site configuration, and validation scenarios.
 */

const { faker } = require('@faker-js/faker');

// ─── Partner ──────────────────────────────────────────────────────────────────

/**
 * Generates a unique partner name with a QA prefix and timestamp suffix.
 * e.g. "QA Partner ABC123"
 */
function generatePartnerName() {
  return `QA Partner ${faker.string.alphanumeric(6).toUpperCase()}`;
}

/**
 * Generates a unique SKU prefix.
 * e.g. "QAB-"
 */
function generateSkuPrefix() {
  return `${faker.string.alpha({ length: 3, casing: 'upper' })}-`;
}

// ─── Products ─────────────────────────────────────────────────────────────────

/**
 * Generates a unique custom product title incorporating a timestamp.
 * e.g. "Ergonomic Granite Gloves 1719518400000"
 */
function generateCustomTitle() {
  return `${faker.commerce.productName()} ${Date.now()}`;
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

/**
 * Generates a custom price that is guaranteed to be >= minPrice.
 * Enforces the B2C rule: custom price must NOT be lower than current price.
 *
 * @param {number|string} minPrice - The current/minimum price (Current Price from the form)
 * @returns {number} A whole-number price value >= minPrice
 */
function generateCustomPrice(minPrice) {
  const base = parseFloat(String(minPrice).replace(/[^0-9.]/g, '')) || 0;
  if (base <= 0) {
    return parseInt(faker.commerce.price({ min: 10, max: 500, dec: 0 }), 10);
  }
  // Whole-number custom price (the field only accepts integers). Round UP so the
  // value never drops below the current price (B2C rule: custom >= current).
  const markup = base * (Math.random() * 0.5);
  return Math.ceil(base + markup);
}

/**
 * Parses a price string from the UI (handles "$", commas, etc.) to a float.
 * @param {string} priceText - e.g. "$1,234.56" or "1234.56"
 * @returns {number}
 */
function parsePriceText(priceText) {
  return parseFloat(String(priceText).replace(/[^0-9.]/g, '')) || 0;
}

// ─── FAQs & Shipping ──────────────────────────────────────────────────────────

/**
 * Generates a unique FAQ title.
 */
function generateFaqTitle() {
  return `FAQ: ${faker.lorem.words(4)} ${faker.string.alphanumeric(4).toUpperCase()}`;
}

/**
 * Generates a random FAQ answer body.
 */
function generateFaqAnswer() {
  return faker.lorem.paragraph(2);
}

/**
 * Generates a random shipping/returns policy title.
 */
function generatePolicyTitle() {
  return `Policy: ${faker.lorem.words(3)} ${faker.string.alphanumeric(4).toUpperCase()}`;
}

/**
 * Generates a random policy description body.
 */
function generatePolicyDescription() {
  return faker.lorem.paragraph(3);
}

// ─── Product Creation ─────────────────────────────────────────────────────────

/**
 * Generates a unique product title.
 * e.g. "Test Product Ergonomic Granite Gloves AB12"
 */
function generateProductTitle() {
  return `Test Product ${faker.commerce.productName()} ${faker.string.alphanumeric(4).toUpperCase()}`;
}

/**
 * Generates a unique product SKU.
 * e.g. "TEST-AB12CD"
 */
function generateProductSku() {
  return `TEST-${faker.string.alphanumeric(6).toUpperCase()}`;
}

/**
 * Picks a random product status from the supplied pool.
 * Defaults to a single known-good value so callers get deterministic,
 * proven-valid data unless they explicitly widen the pool.
 * @param {string[]} statusOptions
 */
function generateProductStatus(statusOptions = ['active']) {
  return faker.helpers.arrayElement(statusOptions);
}

/**
 * Builds a full randomized data set for the "Add Product" flow
 * (title, SKU, status, description, image to attach).
 * @param {object} overrides
 * @returns {{title: string, sku: string, status: string, description: string, imageName: string}}
 */
function generateProductDimensions() {
  const width = faker.number.int({ min: 30, max: 60 });
  const height = faker.number.int({ min: 36, max: 48 });
  return `Total Exterior Width ${width}"; Height ${height}"; Depth 20.25" (interior depth 18").`;
}

function generateProductCreationData(overrides = {}) {
  return {
    title: generateProductTitle(),
    sku: generateProductSku(),
    status: generateProductStatus(overrides.statusOptions),
    description: faker.commerce.productDescription(),
    dimensions: generateProductDimensions(),
    category: 'Wood Hoods',
    imageName: 'test image',
    ...overrides,
  };
}

/**
 * Builds an array of randomized product creation data sets.
 * Used to drive data-driven product creation tests while keeping
 * every generated record inspectable in one place.
 * @param {number} count
 * @param {object} overrides
 * @returns {Array<object>}
 */
function generateProductCreationDataSet(count = 1, overrides = {}) {
  return Array.from({ length: count }, () => generateProductCreationData(overrides));
}

/**
 * Random data for creating an Attribute Value (name, SKU, base/distro price).
 * Distro price is always < base price. Prices are whole numbers.
 * @param {object} [overrides]
 * @returns {{ name: string, sku: string, basePrice: number, distroPrice: number, status: string }}
 */
function generateAttributeValueData(overrides = {}) {
  const suffix = faker.string.alpha({ length: 4, casing: 'upper' });
  const basePrice = faker.number.int({ min: 20, max: 99 });
  const distroPrice = faker.number.int({ min: 1, max: basePrice - 1 });
  return {
    name: `Test Attribute Value ${suffix}`,
    sku: suffix,
    basePrice,
    distroPrice,
    status: 'Active',
    ...overrides,
  };
}

// ─── Array helpers ────────────────────────────────────────────────────────────

/**
 * Picks `count` random, unique items from `arr` without repeats.
 * Uses Fisher-Yates shuffle for uniform distribution.
 *
 * @param {Array} arr - Source array
 * @param {number} count - Number of items to pick
 * @returns {Array} Randomly selected subset
 */
function pickRandom(arr, count) {
  if (count >= arr.length) {
    return [...arr];
  }
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Picks random indices from a range [0, total) — useful for selecting items
 * from a dynamically loaded list by index.
 *
 * @param {number} total - Total number of available items
 * @param {number} count - Number of indices to pick
 * @returns {number[]} Sorted array of unique indices
 */
function pickRandomIndices(total, count) {
  const indices = Array.from({ length: total }, (_, i) => i);
  return pickRandom(indices, Math.min(count, total)).sort((a, b) => a - b);
}

module.exports = {
  generatePartnerName,
  generateSkuPrefix,
  generateCustomTitle,
  generateCustomPrice,
  parsePriceText,
  generateFaqTitle,
  generateFaqAnswer,
  generatePolicyTitle,
  generatePolicyDescription,
  generateProductTitle,
  generateProductSku,
  generateProductStatus,
  generateProductCreationData,
  generateProductCreationDataSet,
  generateAttributeValueData,
  pickRandom,
  pickRandomIndices,
};
