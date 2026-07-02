'use strict';

const { test: base } = require('@playwright/test');

// Page objects
const { LoginPage } = require('../pages/auth/login.page');
const { ConnectorDashboardPage } = require('../pages/connector/connector-dashboard.page');
const { PartnerCreationPage } = require('../pages/connector/partner-creation.page');
const { ProductManagementPage } = require('../pages/connector/product-management.page');
const { AttributeMappingPage } = require('../pages/connector/attribute-mapping.page');
const { ColorCatalogPage } = require('../pages/connector/color-catalog.page');
const { SkuManagementPage } = require('../pages/connector/sku-management.page');
const { HubDashboardPage } = require('../pages/hoodsly-hub/hub-dashboard.page');
const { OrderManagementPage } = require('../pages/hoodsly-hub/order-management.page');
const { OrderPlacementPage } = require('../pages/hoodsly-hub/order-placement.page');
const { DamageClaimPage } = require('../pages/hoodsly-hub/damage-claim.page');
const { WrhOrdersPage } = require('../pages/wrh-hub/wrh-orders.page');
const { WiksOrdersPage } = require('../pages/wiks-hub/wiks-orders.page');

/**
 * Page fixture — injects instantiated page objects into every test.
 * Tests receive fully-constructed POM instances bound to the test's page context.
 */
const pageFixture = base.extend({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  connectorDashboardPage: async ({ page }, use) => {
    await use(new ConnectorDashboardPage(page));
  },
  partnerCreationPage: async ({ page }, use) => {
    await use(new PartnerCreationPage(page));
  },
  productManagementPage: async ({ page }, use) => {
    await use(new ProductManagementPage(page));
  },
  attributeMappingPage: async ({ page }, use) => {
    await use(new AttributeMappingPage(page));
  },
  colorCatalogPage: async ({ page }, use) => {
    await use(new ColorCatalogPage(page));
  },
  skuManagementPage: async ({ page }, use) => {
    await use(new SkuManagementPage(page));
  },
  hubDashboardPage: async ({ page }, use) => {
    await use(new HubDashboardPage(page));
  },
  orderManagementPage: async ({ page }, use) => {
    await use(new OrderManagementPage(page));
  },
  orderPlacementPage: async ({ page }, use) => {
    await use(new OrderPlacementPage(page));
  },
  damageClaimPage: async ({ page }, use) => {
    await use(new DamageClaimPage(page));
  },
  wrhOrdersPage: async ({ page }, use) => {
    await use(new WrhOrdersPage(page));
  },
  wiksOrdersPage: async ({ page }, use) => {
    await use(new WiksOrdersPage(page));
  },
});

module.exports = { pageFixture };
