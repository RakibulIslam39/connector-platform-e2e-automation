'use strict';

const { test, expect } = require('../../fixtures');
const { loadJsonConfig } = require('../../common/utils/data-utils');

const attributeMappingData = loadJsonConfig('attribute-mapping.json');

test.describe('Attribute Mapping', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wp-admin/');
  });

  test('attribute mapping page loads', async ({ attributeMappingPage }) => {
    await attributeMappingPage.goto();
    await expect(attributeMappingPage.page).toHaveURL(/connector-attribute-mapping/);
  });

  test('get all current attribute mappings', async ({ attributeMappingPage }) => {
    const mappings = await attributeMappingPage.getAllMappings();
    expect(Array.isArray(mappings)).toBe(true);
  });

  test('add new attribute mapping', async ({ attributeMappingPage }) => {
    const testAttribute = 'size';
    const testShortCode = `TEST-${Date.now()}`.substring(0, 10);

    await attributeMappingPage.addMapping(testAttribute, testShortCode);
    const exists = await attributeMappingPage.verifyMappingExists(testAttribute, testShortCode);
    expect(exists).toBe(true);
  });

  test('Size attribute mappings exist in config data', async ({ attributeMappingPage }) => {
    const mappings = await attributeMappingPage.getAllMappings();
    const sizeMappings = attributeMappingData.Size;

    expect(mappings.length).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(sizeMappings)).toBe(true);
    expect(sizeMappings.length).toBeGreaterThan(0);
  });

  test('PartnerColors mappings exist in config data', async ({ attributeMappingPage }) => {
    const partnerColors = attributeMappingData.PartnerColors;

    expect(Array.isArray(partnerColors)).toBe(true);
    expect(partnerColors.length).toBeGreaterThan(0);

    // Verify base finishes are always present
    const rawEntry = partnerColors.find((c) => c.sku === 'RAW');
    const prmEntry = partnerColors.find((c) => c.sku === 'PRM');
    expect(rawEntry).toBeDefined();
    expect(prmEntry).toBeDefined();
  });
});
