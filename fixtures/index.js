'use strict';

const { test: base, expect } = require('@playwright/test');
const { pageFixture } = require('./page.fixture');
const { apiFixture } = require('./api.fixture');
const { authFixture } = require('./auth.fixture');

/**
 * Merged test fixture — combines page objects, API services, and auth helpers.
 * Import { test, expect } from this file in all spec files.
 *
 * @example
 * const { test, expect } = require('../../fixtures');
 * test('partner creation', async ({ partnerCreationPage, connectorApi }) => { ... });
 */
const test = base
  .extend(pageFixture._fixtures || {})
  .extend(apiFixture._fixtures || {});

// Workaround: extend each fixture manually since Playwright doesn't support
// chaining .extend() directly from exported extend results.
// Use the merged fixture approach below:
const mergedTest = base.extend({
  // ── Page fixtures ──────────────────────────────────────────────────────────
  loginPage: async ({ page }, use) => {
    const { LoginPage } = require('../pages/auth/login.page');
    await use(new LoginPage(page));
  },
  connectorDashboardPage: async ({ page }, use) => {
    const { ConnectorDashboardPage } = require('../pages/connector/connector-dashboard.page');
    await use(new ConnectorDashboardPage(page));
  },
  connectorHubDashboardPage: async ({ page }, use) => {
    const { ConnectorHubDashboardPage } = require('../pages/connector/connector-hub-dashboard.page');
    await use(new ConnectorHubDashboardPage(page));
  },
  partnerCreationPage: async ({ page }, use) => {
    const { PartnerCreationPage } = require('../pages/connector/partner-creation.page');
    await use(new PartnerCreationPage(page));
  },
  productManagementPage: async ({ page }, use) => {
    const { ProductManagementPage } = require('../pages/connector/product-management.page');
    await use(new ProductManagementPage(page));
  },
  attributeMappingPage: async ({ page }, use) => {
    const { AttributeMappingPage } = require('../pages/connector/attribute-mapping.page');
    await use(new AttributeMappingPage(page));
  },
  colorCatalogPage: async ({ page }, use) => {
    const { ColorCatalogPage } = require('../pages/connector/color-catalog.page');
    await use(new ColorCatalogPage(page));
  },
  skuManagementPage: async ({ page }, use) => {
    const { SkuManagementPage } = require('../pages/connector/sku-management.page');
    await use(new SkuManagementPage(page));
  },
  hubDashboardPage: async ({ page }, use) => {
    const { HubDashboardPage } = require('../pages/hoodsly-hub/hub-dashboard.page');
    await use(new HubDashboardPage(page));
  },
  orderManagementPage: async ({ page }, use) => {
    const { OrderManagementPage } = require('../pages/hoodsly-hub/order-management.page');
    await use(new OrderManagementPage(page));
  },
  orderPlacementPage: async ({ page }, use) => {
    const { OrderPlacementPage } = require('../pages/hoodsly-hub/order-placement.page');
    await use(new OrderPlacementPage(page));
  },
  damageClaimPage: async ({ page }, use) => {
    const { DamageClaimPage } = require('../pages/hoodsly-hub/damage-claim.page');
    await use(new DamageClaimPage(page));
  },
  wrhOrdersPage: async ({ page }, use) => {
    const { WrhOrdersPage } = require('../pages/wrh-hub/wrh-orders.page');
    await use(new WrhOrdersPage(page));
  },
  wiksOrdersPage: async ({ page }, use) => {
    const { WiksOrdersPage } = require('../pages/wiks-hub/wiks-orders.page');
    await use(new WiksOrdersPage(page));
  },
  platformSettingsPage: async ({ page }, use) => {
    const { PlatformSettingsPage } = require('../pages/connector/platform-settings.page');
    await use(new PlatformSettingsPage(page));
  },
  partnerSitePluginPage: async ({ page }, use) => {
    const { PartnerSitePluginPage } = require('../pages/partner-site/partner-site-plugin.page');
    await use(new PartnerSitePluginPage(page));
  },
  partnerSiteOrdersPage: async ({ page }, use) => {
    const { PartnerSiteOrdersPage } = require('../pages/partner-site/partner-site-orders.page');
    await use(new PartnerSiteOrdersPage(page));
  },

  // ── Partner Creation V2 page fixtures ────────────────────────────────────
  partnerFormPage: async ({ page }, use) => {
    const { PartnerFormPage } = require('../pages/connector/partner-form.page');
    await use(new PartnerFormPage(page));
  },
  partnerCleanupPage: async ({ page }, use) => {
    const { PartnerCleanupPage } = require('../pages/connector/partner-cleanup.page');
    await use(new PartnerCleanupPage(page));
  },
  connectorSettingsPage: async ({ browser }, use) => {
    // Uses a fresh browser context pointed at PARTNER_SITE_BASE_URL so it is
    // isolated from the main Connector Hub session stored in admin.json.
    const context = await browser.newContext({
      baseURL: process.env.PARTNER_SITE_BASE_URL,
    });
    const partnerPage = await context.newPage();
    const { ConnectorSettingsPage } = require('../pages/partner-site/connector-settings.page');
    await use(new ConnectorSettingsPage(partnerPage));
    await context.close();
  },

  // ── Auth fixtures ──────────────────────────────────────────────────────────
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const guestPage = await context.newPage();
    await use(guestPage);
    await context.close();
  },

  // ── API fixtures ───────────────────────────────────────────────────────────
  connectorApi: async ({ request }, use) => {
    const { ConnectorApiService } = require('../common/api/connector-api');
    await use(new ConnectorApiService(request));
  },
  hubApi: async ({ request }, use) => {
    const { HubApiService } = require('../common/api/hub-api');
    await use(new HubApiService(request));
  },
  wrhApi: async ({ request }, use) => {
    const { HubApiService } = require('../common/api/hub-api');
    await use(new HubApiService(request, process.env.WRH_HUB_BASE_URL));
  },
  wiksApi: async ({ request }, use) => {
    const { HubApiService } = require('../common/api/hub-api');
    await use(new HubApiService(request, process.env.WIKS_HUB_BASE_URL));
  },
});

module.exports = { test: mergedTest, expect };
