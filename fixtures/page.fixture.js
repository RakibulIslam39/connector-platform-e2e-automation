'use strict';

const { test: base } = require('@playwright/test');

// ── Page objects ─────────────────────────────────────────────────────────────
const { LoginPage } = require('../pages/auth/login.page');
const { ConnectorHubDashboardPage } = require('../pages/connector/connector-hub-dashboard.page');
const { PartnerCreationPage } = require('../pages/connector/partner-creation.page');
const { PartnerFormPage } = require('../pages/connector/partner-form.page');
const { PartnerCleanupPage } = require('../pages/connector/partner-cleanup.page');
const { ProductManagementPage } = require('../pages/connector/product-management.page');
const { ProductCreationPage } = require('../pages/connector/product-creation.page');
const { AttributeMappingPage } = require('../pages/connector/attribute-mapping.page');
const { ColorCatalogPage } = require('../pages/connector/color-catalog.page');
const { SkuManagementPage } = require('../pages/connector/sku-management.page');
const { PlatformSettingsPage } = require('../pages/connector/platform-settings.page');
const { HubDashboardPage } = require('../pages/hoodsly-hub/hub-dashboard.page');
const { OrderManagementPage } = require('../pages/hoodsly-hub/order-management.page');
const { OrderPlacementPage } = require('../pages/hoodsly-hub/order-placement.page');
const { DamageClaimPage } = require('../pages/hoodsly-hub/damage-claim.page');
const { WrhOrdersPage } = require('../pages/wrh-hub/wrh-orders.page');
const { WiksOrdersPage } = require('../pages/wiks-hub/wiks-orders.page');
const { PartnerSitePluginPage } = require('../pages/partner-site/partner-site-plugin.page');
const { PartnerSiteOrdersPage } = require('../pages/partner-site/partner-site-orders.page');
const { ConnectorSettingsPage } = require('../pages/partner-site/connector-settings.page');

/**
 * Page fixture — the single source of truth for page-object injection.
 * Every test receives fully-constructed POM instances bound to the test's page
 * context. New page objects should be registered here (not in fixtures/index.js).
 */
const pageFixture = base.extend({
  // ── Auth / Connector Hub ───────────────────────────────────────────────────
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  connectorHubDashboardPage: async ({ page }, use) => use(new ConnectorHubDashboardPage(page)),
  partnerCreationPage: async ({ page }, use) => use(new PartnerCreationPage(page)),
  partnerFormPage: async ({ page }, use) => use(new PartnerFormPage(page)),
  partnerCleanupPage: async ({ page }, use) => use(new PartnerCleanupPage(page)),
  productManagementPage: async ({ page }, use) => use(new ProductManagementPage(page)),
  productCreationPage: async ({ page }, use) => use(new ProductCreationPage(page)),
  attributeMappingPage: async ({ page }, use) => use(new AttributeMappingPage(page)),
  colorCatalogPage: async ({ page }, use) => use(new ColorCatalogPage(page)),
  skuManagementPage: async ({ page }, use) => use(new SkuManagementPage(page)),
  platformSettingsPage: async ({ page }, use) => use(new PlatformSettingsPage(page)),

  // ── Hubs ────────────────────────────────────────────────────────────────────
  hubDashboardPage: async ({ page }, use) => use(new HubDashboardPage(page)),
  orderManagementPage: async ({ page }, use) => use(new OrderManagementPage(page)),
  orderPlacementPage: async ({ page }, use) => use(new OrderPlacementPage(page)),
  damageClaimPage: async ({ page }, use) => use(new DamageClaimPage(page)),
  wrhOrdersPage: async ({ page }, use) => use(new WrhOrdersPage(page)),
  wiksOrdersPage: async ({ page }, use) => use(new WiksOrdersPage(page)),

  // ── Partner Site (WordPress plugin) ─────────────────────────────────────────
  partnerSitePluginPage: async ({ page }, use) => use(new PartnerSitePluginPage(page)),
  partnerSiteOrdersPage: async ({ page }, use) => use(new PartnerSiteOrdersPage(page)),

  /**
   * Connector settings on the Partner Site. Runs in its own browser context
   * pointed at PARTNER_SITE_BASE_URL so it stays isolated from the Connector Hub
   * admin session stored in auth-state/admin.json.
   */
  connectorSettingsPage: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: process.env.PARTNER_SITE_BASE_URL });
    const partnerPage = await context.newPage();
    await use(new ConnectorSettingsPage(partnerPage));
    await context.close();
  },
});

module.exports = { pageFixture };
