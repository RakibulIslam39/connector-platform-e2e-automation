'use strict';

const { test, expect } = require('../../fixtures');
const { buildPartnerConfig, validatePartnerNameSync } = require('../../helpers/partner-helper');
const { loadTestData } = require('../../common/utils/data-utils');

const partnerProfiles = loadTestData('partners', 'partner-profiles.json');

test.describe('Partner Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Auth state is loaded via storageState in playwright.config.js
    await page.goto('/wp-admin/');
  });

  test('connector platform dashboard loads', async ({ connectorDashboardPage }) => {
    await connectorDashboardPage.goto();
    expect(await connectorDashboardPage.isDashboardLoaded()).toBe(true);
  });

  test('partners list page loads', async ({ partnerCreationPage }) => {
    await partnerCreationPage.gotoPartnersList();
    await expect(partnerCreationPage.page).toHaveURL(/connector-hub/);
  });

  test('create B2B partner with select color style', async ({ partnerCreationPage }) => {
    const partnerData = buildPartnerConfig('b2b', {
      name: `AutoB2B-${Date.now()}`,
      skuPrefix: 'ABB',
      platformType: 'wordpress',
      websiteUrl: process.env.BASE_URL,
      colorStyle: 'select',
    });

    const notice = await partnerCreationPage.createPartner(partnerData);
    expect(notice).toBeTruthy();

    const exists = await partnerCreationPage.findPartner(partnerData.name);
    expect(exists).toBe(true);
  });

  test('create B2C partner with swatch color style', async ({ partnerCreationPage }) => {
    const partnerData = buildPartnerConfig('b2c', {
      name: `AutoB2C-${Date.now()}`,
      skuPrefix: 'ABC',
      platformType: 'wordpress',
      websiteUrl: process.env.BASE_URL,
      colorStyle: 'swatch',
    });

    const notice = await partnerCreationPage.createPartner(partnerData);
    expect(notice).toBeTruthy();
  });

  test('partner name sync validation — spaces vs underscores mismatch fails', () => {
    // Business rule: Partner name in Connector Platform must EXACTLY match Hub API Settings
    // Spaces vs underscores cause status sync failures
    const result = validatePartnerNameSync('Test Partner', 'Test_Partner');
    expect(result.valid).toBe(false);
    expect(result.message).toContain('space/underscore difference');

    const validResult = validatePartnerNameSync('TestPartner', 'TestPartner');
    expect(validResult.valid).toBe(true);
  });

  test('configure partner ventilation and discount', async ({ partnerCreationPage }) => {
    const partnerData = buildPartnerConfig('b2b', {
      name: `AutoVent-${Date.now()}`,
      skuPrefix: 'AVT',
      platformType: 'wordpress',
      websiteUrl: process.env.BASE_URL,
      colorStyle: 'select',
    });

    await partnerCreationPage.createPartner(partnerData);
    await partnerCreationPage.editPartner(partnerData.name);
    await partnerCreationPage.configureDiscount(20, 10);
    await partnerCreationPage.configureVentilation({ enabled: true });
  });

  test('partner count increases after creation', async ({ partnerCreationPage }) => {
    const beforeCount = await partnerCreationPage.getPartnerCount();

    const partnerData = buildPartnerConfig('b2b', {
      name: `AutoCount-${Date.now()}`,
      skuPrefix: 'ACT',
      platformType: 'wordpress',
      websiteUrl: process.env.BASE_URL,
      colorStyle: 'select',
    });

    await partnerCreationPage.createPartner(partnerData);
    const afterCount = await partnerCreationPage.getPartnerCount();
    expect(afterCount).toBeGreaterThan(beforeCount);
  });
});
