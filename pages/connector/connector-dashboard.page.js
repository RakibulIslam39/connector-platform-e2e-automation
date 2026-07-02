'use strict';

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class ConnectorDashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.dashboardHeading = page.locator('h1, h2').filter({ hasText: /connector/i }).first();
    this.partnersMenuLink = page.locator('a[href*="connector-partners"]');
    this.productsMenuLink = page.locator('a[href*="connector-products"]');
    this.attributeMappingMenuLink = page.locator('a[href*="connector-attribute-mapping"]');
    this.settingsMenuLink = page.locator('a[href*="connector-settings"]');
    this.syncStatusBadge = page.locator('.sync-status-badge');
  }

  async goto() {
    await this.navigate(CONNECTOR_PATHS.DASHBOARD);
  }

  async navigateToPartners() {
    logger.info('[ConnectorDashboard] Navigating to Partners');
    await this.navigate(CONNECTOR_PATHS.PARTNERS);
  }

  async navigateToProducts() {
    logger.info('[ConnectorDashboard] Navigating to Products');
    await this.navigate(CONNECTOR_PATHS.PRODUCTS);
  }

  async navigateToAttributeMapping() {
    logger.info('[ConnectorDashboard] Navigating to Attribute Mapping');
    await this.navigate(CONNECTOR_PATHS.ATTRIBUTE_MAPPING);
  }

  async navigateToSkuManagement() {
    logger.info('[ConnectorDashboard] Navigating to SKU Management');
    await this.navigate(CONNECTOR_PATHS.SKU_MANAGEMENT);
  }

  async navigateToColorCatalog() {
    logger.info('[ConnectorDashboard] Navigating to Color Catalog');
    await this.navigate(CONNECTOR_PATHS.COLOR_CATALOG);
  }

  async navigateToSettings() {
    logger.info('[ConnectorDashboard] Navigating to Settings');
    await this.navigate(CONNECTOR_PATHS.SETTINGS);
  }

  async isDashboardLoaded() {
    return await this.dashboardHeading.isVisible();
  }
}

module.exports = { ConnectorDashboardPage };
