'use strict';

/**
 * Scenario 2: Connector Hub Dashboard Validation
 *
 * Validates all sections of the Connector Hub dashboard. All counts are
 * dynamic (they update when partners / products / attributes change), so the
 * tests assert that values are valid numbers rather than hardcoded figures.
 * Soft assertions are used throughout so every element is checked even if
 * one fails.
 */

const { test, expect } = require('../../fixtures');
const { LoginPage } = require('../../pages/auth/login.page');
const { WP_PATHS } = require('../../constants/urls');

test.describe('Scenario 2: Connector Hub Dashboard Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Auth is handled by the reusable globalSetup (LoginPage.loginAndSaveState).
    // Navigate to wp-admin as the known starting point before each test.
    await page.goto(`${process.env.BASE_URL}${WP_PATHS.ADMIN}`);
    await page.waitForLoadState('domcontentloaded');
  });

  test(
    'TC-DASH-001: should navigate to Dashboard via sidebar submenu and validate all sections',
    async ({ page, connectorHubDashboardPage }) => {
      // ── Step 1: Navigate via WP sidebar submenu ──────────────────────────
      await connectorHubDashboardPage.navigateViaSidebarMenu();

      // ── Step 2: Page heading & subtitle ──────────────────────────────────
      await expect.soft(connectorHubDashboardPage.pageHeading).toBeVisible();
      await expect.soft(connectorHubDashboardPage.pageHeading).toHaveText('Dashboard');
      await expect.soft(connectorHubDashboardPage.pageSubtitle).toBeVisible();

      // ── Step 3: Connector Hub in-app nav tabs ─────────────────────────────
      await expect.soft(connectorHubDashboardPage.dashboardTab).toBeVisible();
      await expect.soft(connectorHubDashboardPage.partnersTab).toBeVisible();
      await expect.soft(connectorHubDashboardPage.productsTab).toBeVisible();
      await expect.soft(connectorHubDashboardPage.attributesTab).toBeVisible();
      await expect.soft(connectorHubDashboardPage.settingsTab).toBeVisible();
      await expect.soft(connectorHubDashboardPage.logsTab).toBeVisible();

      // ── Step 4: Stat cards — labels visible ──────────────────────────────
      await expect.soft(connectorHubDashboardPage.totalPartnersCard).toBeVisible();
      await expect.soft(connectorHubDashboardPage.totalProductsCard).toBeVisible();
      await expect.soft(connectorHubDashboardPage.attributeTypesCard).toBeVisible();
      await expect.soft(connectorHubDashboardPage.totalAttributesCard).toBeVisible();

      // ── Step 5: Stat cards — dynamic counts are valid non-negative integers
      const totalPartners = await connectorHubDashboardPage.getTotalPartnersCount();
      const totalProducts = await connectorHubDashboardPage.getTotalProductsCount();
      const attributeTypes = await connectorHubDashboardPage.getAttributeTypesCount();
      const totalAttributes = await connectorHubDashboardPage.getTotalAttributesCount();

      expect.soft(Number.isInteger(totalPartners) && totalPartners >= 0).toBeTruthy();
      expect.soft(Number.isInteger(totalProducts) && totalProducts >= 0).toBeTruthy();
      expect.soft(Number.isInteger(attributeTypes) && attributeTypes >= 0).toBeTruthy();
      expect.soft(Number.isInteger(totalAttributes) && totalAttributes >= 0).toBeTruthy();

      // ── Step 6: Partners by Platform section ─────────────────────────────
      await expect.soft(connectorHubDashboardPage.partnersByPlatformHeading).toBeVisible();
      await expect.soft(connectorHubDashboardPage.partnersByPlatformTotal).toBeVisible();

      const platformsTotal = await connectorHubDashboardPage.getPartnersByPlatformTotal();
      expect.soft(Number.isInteger(platformsTotal) && platformsTotal >= 0).toBeTruthy();
      // Platform total must match Total Partners stat card
      expect.soft(platformsTotal).toBe(totalPartners);

      // ── Step 7: Platform breakdown — name, count, percentage ─────────────
      const platformData = await connectorHubDashboardPage.getPlatformData();

      for (const platform of platformData) {
        expect.soft(platform.count, `${platform.platform} count`).not.toBeNull();
        expect
          .soft(
            Number.isInteger(platform.count) && platform.count >= 0,
            `${platform.platform} count is non-negative integer`
          )
          .toBeTruthy();
        expect
          .soft(platform.percentage, `${platform.platform} percentage`)
          .toMatch(/^\d+%$/);
      }

      // Platform counts should sum to the overall total
      const platformCountSum = platformData.reduce((sum, p) => sum + (p.count ?? 0), 0);
      expect.soft(platformCountSum).toBe(totalPartners);

      // ── Step 8: Quick Actions ─────────────────────────────────────────────
      await expect.soft(connectorHubDashboardPage.addPartnerLink).toBeVisible();
      await expect.soft(connectorHubDashboardPage.addProductLink).toBeVisible();
      await expect
        .soft(connectorHubDashboardPage.addPartnerLink)
        .toHaveAttribute('href', '#/partners?action=add');
      await expect
        .soft(connectorHubDashboardPage.addProductLink)
        .toHaveAttribute('href', '#/products?action=add');

      // ── Step 9: Quick Navigation cards ───────────────────────────────────
      await expect.soft(connectorHubDashboardPage.quickNavigationHeading).toBeVisible();
      await expect.soft(connectorHubDashboardPage.quickNavPartnersCard).toBeVisible();
      await expect.soft(connectorHubDashboardPage.quickNavProductsCard).toBeVisible();
      await expect.soft(connectorHubDashboardPage.quickNavAttributesCard).toBeVisible();
      await expect.soft(connectorHubDashboardPage.quickNavLogsCard).toBeVisible();

      // ── Step 10: Settings row ─────────────────────────────────────────────
      await expect.soft(connectorHubDashboardPage.settingsRow).toBeVisible();
      await expect.soft(connectorHubDashboardPage.settingsRowSubtext).toBeVisible();
      await expect
        .soft(connectorHubDashboardPage.settingsRow)
        .toHaveAttribute('href', '#/settings');
    }
  );
});
