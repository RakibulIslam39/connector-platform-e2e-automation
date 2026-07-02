'use strict';

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const { waitForWpNotice } = require('../../common/utils/wait-utils');
const logger = require('../../common/utils/logger');

class ColorCatalogPage extends BasePage {
  constructor(page) {
    super(page);
    this.colorsList = page.locator('.color-catalog-list, .wp-list-table');
    this.addColorBtn = page.locator('[data-action="add-color"]');
    this.colorNameInput = page.locator('[name="color_name"]');
    this.colorHexInput = page.locator('[name="color_hex"]');
    this.colorSwatchUpload = page.locator('[name="color_swatch"]');
    this.partnerColorNameInput = page.locator('[name="partner_color_name"]');
    this.partnerColorPriceInput = page.locator('[name="partner_color_price"]');
    this.saveColorBtn = page.locator('[name="save_color"], #submit');
    this.colorStyleToggle = page.locator('[name="catalog_color_style"]');
  }

  async goto() {
    await this.navigate(CONNECTOR_PATHS.COLOR_CATALOG);
  }

  /**
   * Adds a new global color to the catalog.
   * @param {object} colorData - { name, hex, swatchPath? }
   */
  async addGlobalColor(colorData) {
    logger.info(`[ColorCatalogPage] Adding color: ${colorData.name}`);
    await this.goto();
    await this.addColorBtn.click();
    await this.colorNameInput.fill(colorData.name);
    await this.colorHexInput.fill(colorData.hex);

    if (colorData.swatchPath) {
      await this.colorSwatchUpload.setInputFiles(colorData.swatchPath);
    }

    await this.saveColorBtn.click();
    return await waitForWpNotice(this.page, 'success');
  }

  /**
   * Configures partner-specific color name and pricing.
   * @param {string} globalColorName
   * @param {string} partnerName
   * @param {object} overrides - { partnerColorName, partnerPrice }
   */
  async setPartnerColorOverride(globalColorName, partnerName, overrides) {
    await this.goto();
    const colorRow = this.colorsList.locator('tr').filter({ hasText: globalColorName });
    await colorRow.locator('[data-action="configure-partner"]').click();
    await this.waitForPageLoad();

    if (overrides.partnerColorName) {
      await this.partnerColorNameInput.fill(overrides.partnerColorName);
    }
    if (overrides.partnerPrice) {
      await this.partnerColorPriceInput.fill(String(overrides.partnerPrice));
    }

    await this.saveColorBtn.click();
    logger.info(`[ColorCatalogPage] Partner color override set for ${globalColorName} / ${partnerName}`);
    return await waitForWpNotice(this.page, 'success');
  }

  /**
   * Changes the color display style for a partner (Select vs Swatch).
   * @param {'select'|'swatch'} style
   */
  async setColorStyle(style) {
    await this.colorStyleToggle.selectOption(style);
    await this.saveColorBtn.click();
    logger.info(`[ColorCatalogPage] Color style set to: ${style}`);
  }

  async getColorCount() {
    await this.goto();
    return await this.colorsList.locator('tbody tr').count();
  }
}

module.exports = { ColorCatalogPage };
