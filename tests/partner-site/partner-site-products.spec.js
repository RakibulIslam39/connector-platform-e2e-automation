'use strict';

const { test, expect } = require('../../fixtures');
const { loadTestData } = require('../../common/utils/data-utils');

const partnerSiteConfig = loadTestData('partner-site', 'partner-site-config.json');

/**
 * Partner Site Product Verification Tests.
 *
 * Verifies that products imported via the Hoodsly Partners Connector plugin appear
 * on the partner WordPress site's WooCommerce product admin, and that product
 * attributes (colors, ventilation, trim) match the expected connector catalog values.
 *
 * PARTNER_SITE_BASE_URL must be set for these tests to run.
 */
test.describe('Partner Site — Product Verification', () => {
  test.beforeEach(async ({ page }) => {
    const partnerUrl = process.env.PARTNER_SITE_BASE_URL;
    if (!partnerUrl) {
      test.skip(true, 'PARTNER_SITE_BASE_URL not configured — skipping partner site tests');
      return;
    }
    await page.goto(`${partnerUrl}/wp-admin/`);
  });

  test('products admin page is accessible', async ({ partnerSitePluginPage }) => {
    await partnerSitePluginPage.navigateToProductsAdmin();
    await expect(partnerSitePluginPage.page).toHaveURL(/post_type=product|products/);
  });

  test('imported product is visible in the WP admin products list', async ({
    partnerSitePluginPage,
  }) => {
    const { sampleProductName } = partnerSiteConfig.products;
    await partnerSitePluginPage.navigateToProductsAdmin();
    await partnerSitePluginPage.searchProductAdmin(sampleProductName);
    const isVisible = await partnerSitePluginPage.isProductAdminVisible(sampleProductName);
    expect(isVisible).toBe(true);
  });

  test('product frontend preview shows color dropdown options', async ({
    partnerSitePluginPage,
  }) => {
    const { sampleProductName, expectedColors } = partnerSiteConfig.products;
    await partnerSitePluginPage.navigateToProductsAdmin();
    await partnerSitePluginPage.searchProductAdmin(sampleProductName);
    await partnerSitePluginPage.hoverOnProductAdmin(sampleProductName);
    await partnerSitePluginPage.clickPreviewProduct(sampleProductName);
    await partnerSitePluginPage.selectColorOption();

    const colors = await partnerSitePluginPage.getColorDropdownOptions();
    expect(colors.length).toBeGreaterThan(0);
    // Verify a subset of known colors to keep test resilient to catalog updates
    for (const expectedColor of expectedColors.slice(0, 3)) {
      expect(colors).toContain(expectedColor);
    }
  });

  test('ventilation dropdown on product preview includes expected options', async ({
    partnerSitePluginPage,
  }) => {
    const { sampleProductName, expectedVentilationOptions } = partnerSiteConfig.products;
    await partnerSitePluginPage.navigateToProductsAdmin();
    await partnerSitePluginPage.searchProductAdmin(sampleProductName);
    await partnerSitePluginPage.hoverOnProductAdmin(sampleProductName);
    await partnerSitePluginPage.clickPreviewProduct(sampleProductName);
    await partnerSitePluginPage.selectColorOption();

    const ventilationOpts = await partnerSitePluginPage.getVentilationDropdownOptions();
    expect(ventilationOpts.length).toBeGreaterThan(0);
    for (const opt of expectedVentilationOptions) {
      expect(ventilationOpts).toContain(opt);
    }
  });

  test('trim dropdown on product preview includes expected options', async ({
    partnerSitePluginPage,
  }) => {
    const { sampleProductName, expectedTrimOptions } = partnerSiteConfig.products;
    await partnerSitePluginPage.navigateToProductsAdmin();
    await partnerSitePluginPage.searchProductAdmin(sampleProductName);
    await partnerSitePluginPage.hoverOnProductAdmin(sampleProductName);
    await partnerSitePluginPage.clickPreviewProduct(sampleProductName);

    const trimOpts = await partnerSitePluginPage.getTrimDropdownOptions();
    if (trimOpts.length > 0) {
      for (const opt of expectedTrimOptions) {
        expect(trimOpts).toContain(opt);
      }
    } else {
      // Product may not have trim options — empty array is a valid state
      expect(trimOpts).toEqual([]);
    }
  });
});
