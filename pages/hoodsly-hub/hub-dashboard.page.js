'use strict';

const { BasePage } = require('../base.page');
const { HUB_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class HubDashboardPage extends BasePage {
  constructor(page) {
    super(page);
    this.adminBar = page.locator('#wpadminbar');
    this.ordersMenuLink = page.locator('a[href*="shop_order"]').first();
    this.manualPlacementLink = page.locator('a[href*="manual-placement"]').first();
    this.settingsLink = page.locator('a[href*="hoodslyhub-settings"]').first();
    this.warehouseLink = page.locator('a[href*="warehouse-orders"]').first();
    this.floatingShelvesLink = page.locator('a[href*="floating-shelves"]').first();
  }

  async goto() {
    const hubBaseUrl = process.env.HUB_BASE_URL;
    await this.page.goto(`${hubBaseUrl}${HUB_PATHS.DASHBOARD}`);
    await this.adminBar.waitFor({ state: 'visible', timeout: 15000 });
  }

  async navigateToOrders() {
    logger.info('[HubDashboard] Navigating to Orders');
    await this.navigate(HUB_PATHS.ORDERS);
  }

  async navigateToManualPlacement() {
    logger.info('[HubDashboard] Navigating to Manual Placement');
    await this.navigate(HUB_PATHS.ORDER_PLACEMENT);
  }

  async navigateToSettings() {
    logger.info('[HubDashboard] Navigating to Hub Settings');
    await this.navigate(HUB_PATHS.SETTINGS);
  }

  async navigateToWarehouse() {
    logger.info('[HubDashboard] Navigating to Warehouse');
    await this.navigate(HUB_PATHS.WAREHOUSE);
  }

  async navigateToFloatingShelves() {
    logger.info('[HubDashboard] Navigating to Floating Shelves');
    await this.navigate(HUB_PATHS.FLOATING_SHELVES);
  }

  async navigateToDamageClaims() {
    logger.info('[HubDashboard] Navigating to Damage Claims');
    await this.navigate(HUB_PATHS.DAMAGE_CLAIMS);
  }

  async isDashboardLoaded() {
    return await this.adminBar.isVisible();
  }
}

module.exports = { HubDashboardPage };
