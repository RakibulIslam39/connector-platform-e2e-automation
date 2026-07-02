'use strict';

/**
 * PartnerCreationPage — Connector Hub SPA
 *
 * All partner management lives inside the Connector Hub Vue/React SPA at:
 *   /wp-admin/admin.php?page=connector-hub#/partners
 *
 * The edit form has four tabs:
 *   Basic Info | Products | Attributes | FAQs & Shipping
 *
 * Partner Colors / Ventilations / Trims / Sizes are managed in the Attributes tab
 * via accordion-style expandable sections (NOT ACF native multi-selects).
 *
 * Products are managed in the Products tab via an "Add Products" modal.
 */

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class PartnerCreationPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Partner list page ─────────────────────────────────────────────────────
    this.partnerSearchInput = page.locator('input[placeholder="Search partners..."]');

    // ── Edit/Create form — top-level elements ─────────────────────────────────
    this.partnerNameInput = page.locator('input[placeholder="Enter partner name"]');
    this.skuPrefixInput = page.locator('input[placeholder="e.g., HS-"]');
    this.websiteUrlInput = page.locator('input[placeholder="https://example.com"]');
    this.apiKeyInput = page.locator('input[placeholder="API key will be auto-generated"]');
    this.generateApiKeyBtn = page.getByRole('button', { name: 'Generate' });
    this.updatePartnerBtn = page.getByRole('button', { name: 'Update Partner' });
    this.cancelLink = page.getByRole('link', { name: 'Cancel' });

    // ── Tabs ──────────────────────────────────────────────────────────────────
    this.basicInfoTab = page.getByRole('button', { name: 'Basic Info' });
    this.productsTab = page.getByRole('button', { name: 'Products' });
    this.attributesTab = page.getByRole('button', { name: 'Attributes' });
    this.faqsShippingTab = page.getByRole('button', { name: 'FAQs & Shipping' });

    // ── Products tab ──────────────────────────────────────────────────────────
    this.addProductsBtn = page.getByRole('button', { name: 'Add Products' });
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  async gotoPartnersList() {
    await this.navigate(CONNECTOR_PATHS.PARTNERS);
    await this.partnerSearchInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  /** Alias kept for backward compatibility with specs. */
  async navigateToPartners() {
    await this.gotoPartnersList();
  }

  async gotoCreatePartner() {
    await this.navigate(CONNECTOR_PATHS.PARTNER_CREATE);
    await this.partnerNameInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  // ─── Partner list helpers ──────────────────────────────────────────────────────

  /**
   * Filters the SPA partner table by typing in the search box.
   * The SPA does real-time filtering — no form submit required.
   */
  async searchPartner(partnerName) {
    logger.info(`[PartnerCreationPage] Searching for partner: ${partnerName}`);
    await this.partnerSearchInput.fill(partnerName);
    await this.page.waitForTimeout(800);
  }

  /** Returns the table row locator matching the partner name. */
  _partnerRow(partnerName) {
    return this.page.locator('table tbody tr').filter({ hasText: partnerName }).first();
  }

  /** Checks if a named partner is currently visible in the table. */
  async isPartnerVisible(partnerName) {
    try {
      await this._partnerRow(partnerName).waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /** Backward-compat alias — equivalent to isPartnerVisible after a search. */
  async isPartnerFound() {
    return (await this.page.locator('table tbody tr').count()) > 0;
  }

  /** Searches for a partner and resolves true if found. */
  async findPartner(partnerName) {
    await this.gotoPartnersList();
    await this.searchPartner(partnerName);
    return this.isPartnerVisible(partnerName);
  }

  async getPartnerCount() {
    await this.gotoPartnersList();
    return await this.page.locator('table tbody tr').count();
  }

  /**
   * Clicks the Edit link inside the matching partner table row.
   */
  async clickEditForPartner(partnerName) {
    const row = this._partnerRow(partnerName);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.getByRole('link', { name: 'Edit' }).click();
    await this.partnerNameInput.waitFor({ state: 'visible', timeout: 20000 });
    logger.info(`[PartnerCreationPage] Opened edit form for: ${partnerName}`);
  }

  /**
   * Searches for a partner and opens the edit form.
   * Matches: editPartner(name) used in partner-creation.spec.js
   */
  async editPartner(partnerName) {
    await this.gotoPartnersList();
    await this.searchPartner(partnerName);
    await this.clickEditForPartner(partnerName);
  }

  /** Hover is not needed in the SPA but kept for backward compat (no-op). */
  async hoverOnPartner() {}

  /** Backward compat — delegates to clickEditForPartner based on current URL context. */
  async clickEditButton(partnerName) {
    await this.clickEditForPartner(partnerName);
  }

  /** Deletes first visible partner via Move to Trash. */
  async deleteAllPartners() {
    const trashBtns = this.page.getByRole('button', { name: 'Move to Trash' });
    const count = await trashBtns.count();
    for (let i = 0; i < count; i++) {
      await trashBtns.first().click();
      await this.page.waitForTimeout(500);
    }
    logger.info('[PartnerCreationPage] Moved all visible partners to trash');
  }

  // ─── Basic Info tab ────────────────────────────────────────────────────────────

  async _ensureBasicInfoTab() {
    await this.basicInfoTab.click();
    await this.partnerNameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  async fillPartnerName(name) {
    await this._ensureBasicInfoTab();
    await this.partnerNameInput.fill(name);
  }

  async updateSkuPrefix(skuPrefix) {
    await this._ensureBasicInfoTab();
    await this.skuPrefixInput.fill(skuPrefix);
    logger.info(`[PartnerCreationPage] Set SKU Prefix: ${skuPrefix}`);
  }

  async fillWebsiteUrl(url) {
    await this.websiteUrlInput.fill(url);
  }

  /**
   * Selects Platform Type from the combobox (WordPress / Magento / Shopify).
   */
  async selectPlatformType(platform) {
    const select = this.page
      .locator('select')
      .filter({ has: this.page.getByRole('option', { name: 'WordPress' }) })
      .first();
    await select.selectOption({ label: platform });
  }

  async selectColorStyleSelect() {
    await this.page.getByRole('radio', { name: 'Select' }).check();
  }

  async selectColorStyleSwatch() {
    await this.page.getByRole('radio', { name: 'Swatch' }).check();
  }

  async selectPartnerTypeB2B() {
    await this.page.getByRole('radio', { name: 'B2B' }).check();
  }

  async selectPartnerTypeB2C() {
    await this.page.getByRole('radio', { name: 'B2C' }).check();
  }

  /**
   * Selects the Status combobox (Draft / Active / Inactive).
   */
  async selectStatus(status) {
    const select = this.page
      .locator('select')
      .filter({ has: this.page.getByRole('option', { name: 'Draft' }) })
      .first();
    await select.selectOption({ label: status });
  }

  /**
   * Selects the Environment combobox (Staging / Production).
   */
  async selectEnvironment(env) {
    const select = this.page
      .locator('select')
      .filter({ has: this.page.getByRole('option', { name: 'Staging' }) })
      .first();
    await select.selectOption({ label: env });
  }

  async selectStagingEnvironment() {
    await this.selectEnvironment('Staging');
  }

  async selectProductionEnvironment() {
    await this.selectEnvironment('Production');
  }

  /**
   * Clicks Generate and returns the newly generated API key string.
   */
  async generateApiKey() {
    await this.generateApiKeyBtn.click();
    await this.page.waitForTimeout(600);
    const value = await this.apiKeyInput.inputValue();
    logger.info('[PartnerCreationPage] Generated API Key');
    return value;
  }

  // ─── Products tab ──────────────────────────────────────────────────────────────

  async _openProductsTab() {
    await this.productsTab.click();
    await this.addProductsBtn.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Adds products to the partner via the Products tab "Add Products" modal.
   * @param {string[]} productNames - product names/SKUs to add
   */
  async selectProducts(productNames) {
    logger.info('[PartnerCreationPage] Adding products:', productNames);
    await this._openProductsTab();
    for (const name of productNames) {
      await this._addProductViaModal(name.trim());
    }
  }

  async _addProductViaModal(productName) {
    await this.addProductsBtn.click();

    // Wait for modal/overlay to appear
    const searchInput = this.page
      .locator('input[placeholder*="Search"], input[placeholder*="search"]')
      .last();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    await searchInput.fill(productName);
    await this.page.waitForTimeout(800);

    // Select the matching product checkbox
    const productRow = this.page
      .locator('tr, li, [role="row"]')
      .filter({ hasText: productName })
      .first();
    await productRow.waitFor({ state: 'visible', timeout: 5000 });
    const checkbox = productRow.locator('input[type="checkbox"]').first();
    if (!(await checkbox.isChecked())) {
      await checkbox.check();
    }

    // Confirm modal
    const confirmBtn = this.page
      .getByRole('button', { name: /^(Add|Confirm|Save|Done)$/i })
      .last();
    if (await confirmBtn.isVisible().catch(() => false)) {
      await confirmBtn.click();
    }

    await this.page.waitForTimeout(400);
    logger.info(`[PartnerCreationPage] Added product: ${productName}`);
  }

  /**
   * Removes products from the partner via the Products tab remove buttons.
   * @param {string[]} productNames - product names/SKUs to remove
   */
  async deselectProducts(productNames) {
    logger.info('[PartnerCreationPage] Removing products:', productNames);
    await this._openProductsTab();
    for (const name of productNames) {
      const row = this.page
        .locator('table tbody tr')
        .filter({ hasText: name.trim() })
        .first();
      try {
        await row.waitFor({ state: 'visible', timeout: 5000 });
        await row.locator('button').last().click();
        await this.page.waitForTimeout(400);
        logger.info(`[PartnerCreationPage] Removed product: ${name}`);
      } catch {
        logger.info(`[PartnerCreationPage] Product not found to remove: ${name}`);
      }
    }
  }

  // ─── Attributes tab ────────────────────────────────────────────────────────────

  async _openAttributesTab() {
    await this.attributesTab.click();
    await this.page
      .locator('text=Available Attributes')
      .waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Expands an attribute accordion by its visible label text.
   * Idempotent — only clicks if the child table is not already visible.
   * @param {string} label - e.g. 'Partner Colors'
   */
  async _expandAccordion(label) {
    const heading = this.page.locator(`text="${label}"`).first();
    await heading.waitFor({ state: 'visible', timeout: 10000 });

    // Check if already expanded (sibling table visible)
    const parent = heading.locator('../..');
    const childTable = parent.locator('table');
    const expanded = (await childTable.count()) > 0 && (await childTable.first().isVisible());
    if (!expanded) {
      await heading.click();
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Selects (checks) attribute items in a section. Idempotent.
   * @param {string} sectionLabel - e.g. 'Partner Colors'
   * @param {string[]} itemNames   - visible text of each item to select
   */
  async _selectAttributeItems(sectionLabel, itemNames) {
    await this._openAttributesTab();
    await this._expandAccordion(sectionLabel);
    for (const itemName of itemNames) {
      const row = this.page
        .locator('table tbody tr')
        .filter({ hasText: itemName })
        .first();
      const checkbox = row.locator('input[type="checkbox"]').first();
      await checkbox.check().catch(() => {
        logger.info(`[PartnerCreationPage] Could not select attribute: ${itemName}`);
      });
    }
    logger.info(`[PartnerCreationPage] Selected ${sectionLabel}:`, itemNames);
  }

  /**
   * Deselects (unchecks) attribute items in a section.
   */
  async _deselectAttributeItems(sectionLabel, itemNames) {
    await this._openAttributesTab();
    await this._expandAccordion(sectionLabel);
    for (const itemName of itemNames) {
      const row = this.page
        .locator('table tbody tr')
        .filter({ hasText: itemName })
        .first();
      const checkbox = row.locator('input[type="checkbox"]').first();
      if (await checkbox.isChecked().catch(() => false)) {
        await checkbox.uncheck();
      }
    }
    logger.info(`[PartnerCreationPage] Deselected ${sectionLabel}:`, itemNames);
  }

  /** Add colors by name (Attributes → Partner Colors accordion). */
  async selectColors(colorNames) {
    await this._selectAttributeItems('Partner Colors', colorNames);
  }

  /** Remove colors by name. */
  async removeColors(colorNames) {
    await this._deselectAttributeItems('Partner Colors', colorNames);
  }

  /** Select ventilation options. */
  async selectVentilations(options) {
    await this._selectAttributeItems('Partner Ventilations', options);
  }

  /** Select trim options. */
  async selectTrims(options) {
    await this._selectAttributeItems('Partner Trims', options);
  }

  /** Select size options. */
  async selectSizes(options) {
    await this._selectAttributeItems('Partner Sizes', options);
  }

  // ─── Discount / Ventilation stubs ─────────────────────────────────────────────

  /**
   * Stub — discount configuration is in a future SPA section.
   * @param {number} _partnerDiscount
   * @param {number} _taxRate
   */
  async configureDiscount(_partnerDiscount, _taxRate) {
    logger.info('[PartnerCreationPage] configureDiscount: not yet implemented for SPA');
  }

  /**
   * Stub — ventilation flag configuration.
   * @param {{enabled: boolean}} _options
   */
  async configureVentilation(_options) {
    logger.info('[PartnerCreationPage] configureVentilation: not yet implemented for SPA');
  }

  // ─── Save / Update ─────────────────────────────────────────────────────────────

  async clickUpdate() {
    await this.updatePartnerBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.updatePartnerBtn.scrollIntoViewIfNeeded();
    await this.updatePartnerBtn.click();
    await this.page.waitForTimeout(1000);
    logger.info('[PartnerCreationPage] Clicked Update Partner');
  }

  async isPartnerSaved() {
    // SPA typically shows a toast/success banner — check for any success indicator.
    // Also acceptable: no error banner visible = success.
    try {
      const successIndicator = this.page
        .locator('[class*="success"], [class*="toast"], [class*="alert-success"], [role="alert"]')
        .first();
      await successIndicator.waitFor({ state: 'visible', timeout: 4000 });
      return true;
    } catch {
      const errorIndicator = this.page
        .locator('[class*="error"], [class*="alert-danger"]')
        .first();
      const hasError = await errorIndicator.isVisible().catch(() => false);
      return !hasError;
    }
  }

  // ─── Full creation flow ────────────────────────────────────────────────────────

  /**
   * Fills and saves the partner creation form.
   * @param {object} partnerData - { name, skuPrefix, platformType, websiteUrl,
   *                                 colorStyle, partnerType, environment, status }
   */
  async createPartner(partnerData) {
    logger.info('[PartnerCreationPage] Creating partner:', partnerData.name);
    await this.gotoCreatePartner();

    await this.partnerNameInput.fill(partnerData.name);

    if (partnerData.skuPrefix) {
      await this.skuPrefixInput.fill(partnerData.skuPrefix);
    }

    if (partnerData.websiteUrl) {
      await this.websiteUrlInput.fill(partnerData.websiteUrl);
    }

    if (partnerData.platformType) {
      await this.selectPlatformType(partnerData.platformType);
    }

    const colorStyle = (partnerData.colorStyle || '').toLowerCase();
    if (colorStyle === 'swatch') {
      await this.selectColorStyleSwatch();
    } else {
      await this.selectColorStyleSelect();
    }

    const partnerType = (partnerData.partnerType || partnerData.type || 'b2b').toLowerCase();
    if (partnerType === 'b2c') {
      await this.selectPartnerTypeB2C();
    } else {
      await this.selectPartnerTypeB2B();
    }

    const env = (partnerData.environment || 'staging').toLowerCase();
    if (env === 'production') {
      await this.selectProductionEnvironment();
    } else {
      await this.selectStagingEnvironment();
    }

    if (partnerData.status) {
      await this.selectStatus(partnerData.status);
    }

    await this.clickUpdate();
    return await this.isPartnerSaved();
  }
}

module.exports = { PartnerCreationPage };
