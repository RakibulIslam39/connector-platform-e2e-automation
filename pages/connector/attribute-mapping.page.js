'use strict';

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const { waitForWpNotice } = require('../../common/utils/wait-utils');
const logger = require('../../common/utils/logger');

class AttributeMappingPage extends BasePage {
  constructor(page) {
    super(page);
    this.mappingTable = page.locator('.attribute-mapping-table, .wp-list-table');
    this.addMappingBtn = page.locator('[data-action="add-mapping"]');
    this.saveMappingsBtn = page.locator('[name="save_mappings"], #submit');
    this.attributeSelect = page.locator('[name="product_attribute"]');
    this.shortSkuInput = page.locator('[name="short_sku_value"]');
  }

  async goto() {
    await this.navigate(CONNECTOR_PATHS.ATTRIBUTE_MAPPING);
  }

  /**
   * Adds a new attribute mapping entry.
   * @param {string} attribute - WooCommerce product attribute name
   * @param {string} shortSku - Short SKU code to map to
   */
  async addMapping(attribute, shortSku) {
    logger.info(`[AttributeMappingPage] Adding mapping: ${attribute} → ${shortSku}`);
    await this.goto();

    if (await this.addMappingBtn.isVisible()) {
      await this.addMappingBtn.click();
    }

    const lastRow = this.mappingTable.locator('tbody tr').last();
    const attrInput = lastRow.locator('[name*="attribute"], [name*="product_attribute"]');
    const skuInput = lastRow.locator('[name*="short_sku"], [name*="sku_value"]');

    if (await attrInput.isVisible()) {
      await attrInput.fill(attribute);
    }
    if (await skuInput.isVisible()) {
      await skuInput.fill(shortSku);
    }

    await this.saveMappingsBtn.click();
    return await waitForWpNotice(this.page, 'success');
  }

  /**
   * Gets all current mappings as an array of { attribute, shortSku } objects.
   */
  async getAllMappings() {
    await this.goto();
    const rows = this.mappingTable.locator('tbody tr');
    const count = await rows.count();
    const mappings = [];

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const attribute = await row
        .locator('td:nth-child(1)')
        .textContent()
        .catch(() => '');
      const shortSku = await row
        .locator('td:nth-child(2)')
        .textContent()
        .catch(() => '');
      mappings.push({ attribute: attribute.trim(), shortSku: shortSku.trim() });
    }

    return mappings;
  }

  /**
   * Verifies a specific mapping exists in the table.
   */
  async verifyMappingExists(attribute, shortSku) {
    const mappings = await this.getAllMappings();
    return mappings.some(
      (m) =>
        m.attribute.toLowerCase() === attribute.toLowerCase() &&
        m.shortSku.toLowerCase() === shortSku.toLowerCase()
    );
  }

  /**
   * Deletes a mapping row by attribute name.
   */
  async deleteMapping(attribute) {
    await this.goto();
    const row = this.mappingTable.locator('tbody tr').filter({ hasText: attribute });
    await row.locator('[data-action="delete"], .delete').click();
    await this.waitForPageLoad();
    logger.info(`[AttributeMappingPage] Deleted mapping for: ${attribute}`);
  }
}

module.exports = { AttributeMappingPage };
