'use strict';

const { faker } = require('@faker-js/faker');

/**
 * Data generation and manipulation utilities.
 * Uses @faker-js/faker for dynamic test data.
 */

// ─── Partner Data ────────────────────────────────────────────────────────────

function generatePartnerData(overrides = {}) {
  return {
    name: `Test Partner ${faker.string.alphanumeric(6).toUpperCase()}`,
    type: faker.helpers.arrayElement(['b2b', 'b2c']),
    skuPrefix: faker.string.alpha({ length: 3, casing: 'upper' }),
    platformType: faker.helpers.arrayElement(['wordpress', 'shopify', 'magento']),
    websiteUrl: faker.internet.url(),
    email: faker.internet.email(),
    colorStyle: faker.helpers.arrayElement(['select', 'swatch']),
    ...overrides,
  };
}

// ─── Order Data ──────────────────────────────────────────────────────────────

function generateOrderData(overrides = {}) {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: faker.internet.email(),
    phone: generateUSPhone(),
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zip: faker.location.zipCode('#####'),
    country: 'US',
    ...overrides,
  };
}

// ─── Product Data ────────────────────────────────────────────────────────────

function generateProductData(overrides = {}) {
  return {
    name: `Test Hood ${faker.string.alphanumeric(4).toUpperCase()}`,
    sku: `TEST-${faker.string.alphanumeric(8).toUpperCase()}`,
    price: faker.commerce.price({ min: 100, max: 5000, dec: 2 }),
    ...overrides,
  };
}

// ─── Phone / Contact ─────────────────────────────────────────────────────────

/**
 * Generates a valid US phone number in +1XXXXXXXXXX format.
 * Required by RL Courier for BOL generation.
 */
function generateUSPhone() {
  const areaCode = faker.number.int({ min: 200, max: 999 });
  const exchange = faker.number.int({ min: 200, max: 999 });
  const subscriber = faker.number.int({ min: 1000, max: 9999 });
  return `+1${areaCode}${exchange}${subscriber}`;
}

// ─── String utilities ────────────────────────────────────────────────────────

function randomString(length = 8) {
  return faker.string.alphanumeric(length);
}

function randomInt(min = 1, max = 100) {
  return faker.number.int({ min, max });
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function uniqueId(prefix = 'test') {
  return `${prefix}-${Date.now()}-${faker.string.alphanumeric(4)}`;
}

// ─── JSON data loaders ───────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');

function loadJsonData(relativePath) {
  const fullPath = path.resolve(__dirname, '../../', relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`JSON data file not found: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
}

function loadTestData(category, fileName) {
  return loadJsonData(`test-data/${category}/${fileName}`);
}

function loadJsonConfig(fileName) {
  return loadJsonData(`json-data/${fileName}`);
}

// ─── Data transformers ───────────────────────────────────────────────────────

/**
 * Merges base data with environment-specific overrides.
 */
function mergeWithEnv(baseData, envKey) {
  const envOverrides = baseData.environments?.[process.env.ENV] || {};
  return { ...baseData, ...envOverrides, [envKey]: undefined };
}

module.exports = {
  generatePartnerData,
  generateOrderData,
  generateProductData,
  generateUSPhone,
  randomString,
  randomInt,
  timestamp,
  uniqueId,
  loadJsonData,
  loadTestData,
  loadJsonConfig,
  mergeWithEnv,
  faker,
};
