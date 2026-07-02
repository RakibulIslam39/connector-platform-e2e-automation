'use strict';

/**
 * ProductManagementPage — Connector Hub SPA
 *
 * All product management lives inside the Connector Hub SPA at:
 *   /wp-admin/admin.php?page=connector-hub#/products
 *
 * The product edit form has three tabs:
 *   Basic Info | Attributes | Partners
 *
 * Partners are assigned/removed via checkboxes on the Partners tab.
 * Description is edited via an embedded TinyMCE editor in the Basic Info tab.
 */

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class ProductManagementPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Product list ─────────────────────────────────────────────────────────
    this.productSearchInput = page.locator('input[placeholder="Search products..."]');
    this.addProductBtn = page.getByRole('link', { name: 'Add Product' });

    // ── Edit form — tab navigation ────────────────────────────────────────────
    this.basicInfoTab = page.getByRole('button', { name: 'Basic Info' });
    this.attributesTab = page.getByRole('button', { name: 'Attributes' });
    this.partnersTab = page.getByRole('button', { name: 'Partners' });

    // ── Edit form — Basic Info tab ────────────────────────────────────────────
    this.productTitleInput = page.locator('input[placeholder="Enter product title"]');
    this.productSkuInput = page.locator('input[placeholder="e.g., VEN-001"]');
    this.updateProductBtn = page.getByRole('button', { name: 'Update Product' });
    this.cancelLink = page.getByRole('link', { name: 'Cancel' });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  async goto() {
    await this.navigate(CONNECTOR_PATHS.PRODUCTS);
    await this.productSearchInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  // ─── Product list helpers ──────────────────────────────────────────────────────

  /**
   * Navigates to the product list and filters by name/SKU.
   * The SPA does real-time filtering.
   */
  async searchProduct(productName) {
    await this.goto();
    await this.productSearchInput.fill(productName);
    await this.page.waitForTimeout(800);
    logger.info(`[ProductManagementPage] Searching for product: ${productName}`);
  }

  _productRow(productName) {
    return this.page.locator('table tbody tr').filter({ hasText: productName }).first();
  }

  async isProductVisible(productName, timeout = 10000) {
    try {
      await this._productRow(productName).waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clicks the "Edit" link in the matching product row.
   */
  async clickEditForProduct(productName) {
    const row = this._productRow(productName);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.getByRole('link', { name: 'Edit' }).click();
    await this.productTitleInput.waitFor({ state: 'visible', timeout: 20000 });
    logger.info(`[ProductManagementPage] Opened edit form for: ${productName}`);
  }

  /** Backward-compat alias — hover is not needed in the SPA. */
  async hoverProduct() {}

  /** Backward-compat alias. */
  async clickEditButton(productName) {
    await this.clickEditForProduct(productName);
  }

  /**
   * Searches for a product and opens its edit form.
   */
  async editProduct(productName) {
    await this.searchProduct(productName);
    await this.clickEditForProduct(productName);
  }

  async isEditProductVisible(timeout = 10000) {
    try {
      await this.page
        .getByRole('heading', { name: 'Edit Product' })
        .waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async getProductCount() {
    await this.goto();
    return await this.page.locator('table tbody tr').count();
  }

  // ─── Product form — save ───────────────────────────────────────────────────────

  async clickUpdateButton() {
    await this.updateProductBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.updateProductBtn.scrollIntoViewIfNeeded();
    await this.updateProductBtn.click();
    await this.page.waitForTimeout(1000);
    logger.info('[ProductManagementPage] Clicked Update Product');
  }

  // ─── Product form — Basic Info tab: description ───────────────────────────────

  /**
   * Updates a product's description.
   * Attempts three strategies in order:
   *   1. TinyMCE visual editor — click into iframe body and type
   *   2. Code view textarea — switch to Code tab, fill textarea
   *   3. JS fallback — set TinyMCE editor content programmatically
   */
  async updateProductDescription(productName, descriptionText) {
    await this.editProduct(productName);
    await this.basicInfoTab.click();

    let updated = false;

    // Strategy 1 — TinyMCE visual editor iframe
    try {
      const visualBtn = this.page.getByRole('button', { name: 'Visual' }).first();
      if (await visualBtn.isVisible({ timeout: 2000 })) {
        await visualBtn.click();
      }
      const editorFrame = this.page.frameLocator(
        'iframe[id*="mce"], iframe[title*="Rich Text Area"], .mce-edit-area iframe'
      ).first();
      const body = editorFrame.locator('body');
      await body.waitFor({ state: 'visible', timeout: 5000 });
      await body.click();
      await this.page.keyboard.press('Control+A');
      await this.page.keyboard.type(descriptionText, { delay: 15 });
      updated = true;
    } catch {
      // continue to next strategy
    }

    // Strategy 2 — Code textarea
    if (!updated) {
      try {
        const codeBtn = this.page.getByRole('button', { name: 'Code' }).first();
        if (await codeBtn.isVisible({ timeout: 2000 })) {
          await codeBtn.click();
        }
        const textarea = this.page.locator('textarea.wp-editor-area').first();
        await textarea.waitFor({ state: 'visible', timeout: 3000 });
        await textarea.fill(descriptionText);
        updated = true;
      } catch {
        // continue to JS fallback
      }
    }

    // Strategy 3 — JS / TinyMCE API
    if (!updated) {
      await this.page.evaluate((value) => {
        if (window.tinymce) {
          const editors = tinymce.editors;
          if (editors && editors.length > 0) {
            editors[0].setContent(value);
          }
        }
        // Also try the first visible textarea
        const textareas = document.querySelectorAll('textarea');
        if (textareas.length > 0) {
          textareas[0].value = value;
          textareas[0].dispatchEvent(new Event('input', { bubbles: true }));
          textareas[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, descriptionText);
    }

    await this.clickUpdateButton();
    logger.info(`[ProductManagementPage] Updated description for "${productName}"`);
  }

  // ─── Product form — Partners tab ──────────────────────────────────────────────

  async _openPartnersTab() {
    await this.partnersTab.click();
    await this.page.waitForTimeout(600);
  }

  /**
   * Assigns a partner to the product by checking its checkbox on the Partners tab.
   */
  async assignPartnerToProduct(productName, partnerName) {
    await this.editProduct(productName);
    await this._openPartnersTab();

    const partnerEl = this.page
      .locator('label, div, li, tr')
      .filter({ hasText: partnerName })
      .first();
    await partnerEl.waitFor({ state: 'visible', timeout: 10000 });
    const checkbox = partnerEl.locator('input[type="checkbox"]').first();
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }

    await this.clickUpdateButton();
    logger.info(`[ProductManagementPage] Assigned partner "${partnerName}" to "${productName}"`);
  }

  /**
   * Removes a partner assignment from a product by unchecking its checkbox.
   */
  async removePartnerFromProduct(productName, partnerName) {
    await this.editProduct(productName);
    await this._openPartnersTab();

    const partnerEl = this.page
      .locator('label, div, li, tr')
      .filter({ hasText: partnerName })
      .first();
    await partnerEl.waitFor({ state: 'visible', timeout: 10000 });
    const checkbox = partnerEl.locator('input[type="checkbox"]').first();
    if (await checkbox.isChecked()) {
      await checkbox.uncheck();
    }

    await this.clickUpdateButton();
    logger.info(`[ProductManagementPage] Removed partner "${partnerName}" from "${productName}"`);
  }

  // ─── Filters ──────────────────────────────────────────────────────────────────

  async filterByPartner(partnerName) {
    await this.goto();
    const select = this.page
      .locator('select')
      .filter({ has: this.page.getByRole('option', { name: 'All Partners' }) })
      .first();
    await select.selectOption({ label: partnerName });
    await this.page.waitForTimeout(800);
  }

  async filterByStatus(status) {
    await this.goto();
    const select = this.page
      .locator('select')
      .filter({ has: this.page.getByRole('option', { name: 'All Status' }) })
      .first();
    await select.selectOption({ label: status });
    await this.page.waitForTimeout(800);
  }

  /**
   * Stub — connector type filter was in the old WP admin list, not in SPA.
   */
  async filterByConnectorType() {
    logger.info('[ProductManagementPage] filterByConnectorType: not available in SPA');
  }

  /**
   * Stub — sync status badge is not in the SPA products table.
   */
  async getProductSyncStatus(productName) {
    logger.info(`[ProductManagementPage] getProductSyncStatus: not available in SPA for "${productName}"`);
    return 'unknown';
  }
}

module.exports = { ProductManagementPage };
