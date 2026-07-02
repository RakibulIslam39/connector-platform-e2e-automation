'use strict';

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class SkuManagementPage extends BasePage {
  constructor(page) {
    super(page);
    this.skuTable = page.locator('.sku-management-table, .wp-list-table');
    this.masterSkuInput = page.locator('[name="master_sku"]');
    this.skuPrefixInput = page.locator('[name="sku_prefix"]');
    this.reduceHeightToggle = page.locator('[name="reduce_height_enabled"]');
    this.reduceHeightValueInput = page.locator('[name="reduce_height_value"]');
    this.saveSkuBtn = page.locator('[name="save_sku"], #submit');
    this.generatedSkuPreview = page.locator('.sku-preview, .generated-sku');
  }

  async goto() {
    await this.navigate(CONNECTOR_PATHS.SKU_MANAGEMENT);
  }

  /**
   * Sets the master SKU for a product.
   */
  async setMasterSku(sku) {
    await this.masterSkuInput.fill(sku);
  }

  /**
   * Configures reduce height logic for height-based SKU generation.
   * @param {boolean} enabled
   * @param {number} value - reduction amount in inches
   */
  async configureReduceHeight(enabled, value = null) {
    if (enabled) {
      await this.reduceHeightToggle.check();
      if (value !== null) {
        await this.reduceHeightValueInput.fill(String(value));
      }
    } else {
      await this.reduceHeightToggle.uncheck();
    }
    logger.info(`[SkuManagementPage] Reduce height: enabled=${enabled}, value=${value}`);
  }

  /**
   * Gets the generated SKU preview for the current configuration.
   */
  async getGeneratedSkuPreview() {
    const previewText = await this.generatedSkuPreview.textContent().catch(() => '');
    return previewText.trim();
  }

  /**
   * Verifies that a generated SKU matches the expected format.
   */
  async verifySkuFormat(expectedPattern) {
    const sku = await this.getGeneratedSkuPreview();
    const regex = new RegExp(expectedPattern);
    if (!regex.test(sku)) {
      throw new Error(`SKU "${sku}" does not match expected pattern "${expectedPattern}"`);
    }
    logger.info(`[SkuManagementPage] SKU format verified: ${sku}`);
    return sku;
  }
}

module.exports = { SkuManagementPage };
