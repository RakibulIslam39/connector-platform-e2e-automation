'use strict';

const { BasePage } = require('../base.page');
const { PARTNER_SITE_SELECTORS } = require('../../constants/selectors');
const logger = require('../../common/utils/logger');

/**
 * PartnerSitePluginPage — covers all interactions with the Hoodsly Partners Connector
 * plugin on a WordPress partner site admin panel:
 *   - Plugin visibility check (/wp-admin/plugins.php)
 *   - API key management (connector settings page)
 *   - Settings tab: BOL creation toggle, environment, hold order, etc.
 *   - Import tab: accept terms + import products
 *   - Product admin: search, hover, preview, attribute dropdowns
 *
 * Tests using this page must navigate to the PARTNER_SITE_BASE_URL wp-admin
 * in beforeEach, since the partner site is a separate WordPress instance.
 */
class PartnerSitePluginPage extends BasePage {
  constructor(page) {
    super(page);

    // Plugins page
    this.pluginsMenuLink = page.locator(PARTNER_SITE_SELECTORS.PLUGINS_MENU);
    this.installedPluginsSubLink = page.locator(
      '#menu-plugins .wp-submenu a[href*="plugins.php"]'
    );
    this.pluginSearchInput = page
      .locator(PARTNER_SITE_SELECTORS.PLUGIN_SEARCH_INPUT)
      .first();

    // Settings navigation
    this.settingsMenuLink = page
      .locator('div.wp-menu-name')
      .filter({ hasText: /^Settings$/ });
    this.hoodslyConnectorMenu = page
      .locator('a')
      .filter({ hasText: 'Hoodsly Partners Connector' })
      .first();

    // Connector settings page elements
    this.apiKeyField = page.locator(PARTNER_SITE_SELECTORS.API_KEY_FIELD);
    this.importTab = page.locator('span').filter({ hasText: /^Import$/ });
    this.settingsTab = page.locator('span').filter({ hasText: /^Settings$/ });
    this.saveBtn = page.locator(':text-is("Save")');
    this.termsCheckbox = page.locator(PARTNER_SITE_SELECTORS.IMPORT_TERMS_CHECKBOX);
    this.importBtn = page
      .locator("button[type='button']")
      .filter({ has: page.locator('span:has-text("Import")') });
    this.importSuccessMsg = page.locator(PARTNER_SITE_SELECTORS.IMPORT_SUCCESS_MSG);
    this.connectedPartnerLabel = page.locator(PARTNER_SITE_SELECTORS.CONNECTED_PARTNER_LABEL);
    this.settingsSuccessMsg = page.locator(PARTNER_SITE_SELECTORS.SETTINGS_SUCCESS_MSG);

    // Settings tab toggles
    this.bolCreationText = page.locator(PARTNER_SITE_SELECTORS.BOL_CREATION_TEXT);
    this.bolCreationToggle = page.locator('#headlessui-switch-\\:r5\\::visible');
    this.bolCompanyNameInput = page.locator(PARTNER_SITE_SELECTORS.BOL_COMPANY_NAME_FIELD);
    this.bolCompanyEmailInput = page.locator(PARTNER_SITE_SELECTORS.BOL_COMPANY_EMAIL_FIELD);
    this.bolCompanyPhoneInput = page.locator(PARTNER_SITE_SELECTORS.BOL_COMPANY_PHONE_FIELD);
    this.bolCompanyNameLabel = page.locator(PARTNER_SITE_SELECTORS.BOL_COMPANY_NAME_LABEL);

    // Products admin panel
    this.productsMenuLink = page.locator('div').filter({ hasText: /^Products$/ }).first();
    this.productSearchInput = page.locator(PARTNER_SITE_SELECTORS.PRODUCT_SEARCH_INPUT);
    this.colorOptionRadio = page.locator(PARTNER_SITE_SELECTORS.COLOR_OPTION_RADIO);
    this.colorDropdown = page.locator(PARTNER_SITE_SELECTORS.COLOR_DROPDOWN);
    this.sizeDropdown = page.locator(PARTNER_SITE_SELECTORS.SIZE_DROPDOWN);
    this.ventilationDropdown = page.getByLabel('Ventilation Options*');
    this.trimDropdown = page.locator(PARTNER_SITE_SELECTORS.TRIM_DROPDOWN);
  }

  // ─── Plugin search ─────────────────────────────────────────────────────────

  async navigateToPluginsPage() {
    if (this.page.url().includes('/plugins.php')) return;
    await this.pluginsMenuLink.click();
    if (!this.page.url().includes('plugins.php')) {
      await this.installedPluginsSubLink.first().click();
    }
    await this.page.waitForURL('**/wp-admin/plugins.php**', { timeout: 15000 });
    await this.pluginSearchInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  async searchPlugin(pluginName) {
    await this.pluginSearchInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.pluginSearchInput.fill(pluginName);
    await this.pluginSearchInput.press('Enter');
    await this.waitForPageLoad();
  }

  /**
   * Checks whether the given text is visible on the page (e.g. 'WPPOOL' as a plugin marker).
   */
  async isTextVisible(text) {
    try {
      await this.page.locator(`:text-is("${text}")`).waitFor({ state: 'visible', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }

  // ─── Settings navigation ──────────────────────────────────────────────────

  /**
   * Navigates Settings → Hoodsly Partners Connector to reach the plugin settings page.
   */
  async navigateToConnectorSettings() {
    await this.settingsMenuLink.click();
    await this.hoodslyConnectorMenu.click();
    await this.waitForPageLoad();
    logger.info('[PartnerSitePluginPage] Navigated to Connector Settings');
  }

  async clickSettingsTab() {
    await this.settingsTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.settingsTab.click();
  }

  async clickImportTab() {
    await this.importTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.importTab.click();
  }

  // ─── API Key management ───────────────────────────────────────────────────

  /**
   * Reads the connected partner name from the settings page header label.
   */
  async getConnectedPartnerName() {
    try {
      await this.connectedPartnerLabel.waitFor({ state: 'visible', timeout: 10000 });
      const text = ((await this.connectedPartnerLabel.textContent()) || '').trim();
      if (!text.includes(':')) return '';
      return text.split(':').slice(1).join(':').trim();
    } catch {
      return '';
    }
  }

  async setApiKey(apiKey) {
    logger.info('[PartnerSitePluginPage] Setting API key');
    await this.apiKeyField.waitFor({ state: 'visible', timeout: 10000 });
    await this.apiKeyField.fill(apiKey);
  }

  async saveSettings() {
    await this.saveBtn.click();
    logger.info('[PartnerSitePluginPage] Settings saved');
  }

  async isSettingsSaved() {
    try {
      await this.settingsSuccessMsg.waitFor({ state: 'visible', timeout: 10000 });
      return await this.settingsSuccessMsg.isVisible();
    } catch {
      return false;
    }
  }

  // ─── Import Products ──────────────────────────────────────────────────────

  async importProducts() {
    logger.info('[PartnerSitePluginPage] Starting product import');
    await this.clickImportTab();
    await this.termsCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await this.termsCheckbox.check();
    await this.importBtn.click();
    try {
      await this.importSuccessMsg.waitFor({ state: 'visible', timeout: 30000 });
      logger.info('[PartnerSitePluginPage] Product import successful');
      return true;
    } catch {
      logger.warn('[PartnerSitePluginPage] Product import success popup not detected');
      return false;
    }
  }

  // ─── BOL Creation Settings ────────────────────────────────────────────────

  async isBolCreationVisible() {
    try {
      await this.bolCreationText.waitFor({ state: 'visible', timeout: 5000 });
      return await this.bolCreationText.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Reads the aria-checked attribute to determine BOL toggle state.
   */
  async isBolCreationEnabled() {
    await this.bolCreationToggle.waitFor({ state: 'visible', timeout: 10000 });
    const ariaChecked = await this.bolCreationToggle.getAttribute('aria-checked');
    return (ariaChecked || '').trim().toLowerCase() === 'true';
  }

  async toggleBolCreation() {
    await this.bolCreationToggle.waitFor({ state: 'visible', timeout: 10000 });
    await this.bolCreationToggle.click();
  }

  async isBolCompanyFieldsVisible() {
    try {
      await this.bolCompanyNameLabel.waitFor({ state: 'visible', timeout: 1000 });
      return await this.bolCompanyNameLabel.isVisible();
    } catch {
      return false;
    }
  }

  async fillBolCompanyDetails({ companyName, companyEmail, companyPhone }) {
    await this.bolCompanyNameInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.bolCompanyNameInput.fill(companyName);
    await this.bolCompanyEmailInput.fill(companyEmail);
    await this.bolCompanyPhoneInput.fill(companyPhone);
    logger.info('[PartnerSitePluginPage] Filled BOL company details');
  }

  /**
   * Idempotent BOL enable: checks current state, enables if off, fills company info if
   * the company fields appear after enabling.
   * @returns {Promise<'not-visible' | 'already-enabled' | 'enabled'>}
   */
  async ensureBolCreationEnabled({ companyName, companyEmail, companyPhone }) {
    if (!(await this.isBolCreationVisible())) {
      logger.warn('[PartnerSitePluginPage] BOL Creation option not visible on this settings page');
      return 'not-visible';
    }
    if (await this.isBolCreationEnabled()) {
      logger.info('[PartnerSitePluginPage] BOL Creation already enabled');
      return 'already-enabled';
    }
    await this.toggleBolCreation();
    if (await this.isBolCompanyFieldsVisible()) {
      await this.fillBolCompanyDetails({ companyName, companyEmail, companyPhone });
    }
    logger.info('[PartnerSitePluginPage] BOL Creation enabled');
    return 'enabled';
  }

  // ─── Products admin panel ─────────────────────────────────────────────────

  async navigateToProductsAdmin() {
    await this.productsMenuLink.waitFor({ state: 'visible', timeout: 10000 });
    await this.productsMenuLink.click();
    await this.productSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    logger.info('[PartnerSitePluginPage] Navigated to Products admin');
  }

  async searchProductAdmin(productName) {
    await this.productSearchInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.productSearchInput.fill(productName);
    await this.productSearchInput.press('Enter');
    await this.waitForPageLoad();
  }

  async isProductAdminVisible(productName) {
    const primary = this.page.locator(`//a[normalize-space()='${productName}']`);
    try {
      await primary.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      const fallback = this.page.locator('#the-list tr', { hasText: productName }).first();
      try {
        await fallback.waitFor({ state: 'visible', timeout: 10000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  async hoverOnProductAdmin(productName) {
    const primary = this.page.locator(`//a[normalize-space()='${productName}']`);
    try {
      await primary.waitFor({ state: 'visible', timeout: 5000 });
      await primary.hover();
    } catch {
      const fallback = this.page
        .locator('#the-list tr', { hasText: productName })
        .first()
        .locator('a.row-title')
        .first();
      await fallback.waitFor({ state: 'visible', timeout: 10000 });
      await fallback.hover();
    }
  }

  async clickPreviewProduct(productName) {
    const preview = this.page.locator(
      `span.view a[aria-label='Preview \u201c${productName}\u201d']`
    );
    const fallback = this.page.locator('span.view a:has-text("Preview")').first();
    const target = (await preview.isVisible()) ? preview : fallback;
    await target.evaluate((el) => el.setAttribute('target', '_self'));
    await target.click();
    await this.waitForPageLoad();
  }

  async selectColorOption() {
    await this.colorOptionRadio.waitFor({ state: 'visible', timeout: 10000 });
    await this.colorOptionRadio.check();
  }

  async getColorDropdownOptions() {
    const options = await this.colorDropdown.locator('option').all();
    const colors = [];
    for (const opt of options) {
      const text = ((await opt.textContent()) || '').trim();
      if (text) colors.push(text);
    }
    return colors;
  }

  async getVentilationDropdownOptions() {
    const options = await this.ventilationDropdown.locator('option').all();
    const values = [];
    for (const opt of options) {
      const text = ((await opt.textContent()) || '').trim();
      if (text) values.push(text);
    }
    return values;
  }

  async getTrimDropdownOptions() {
    const trimLocator = this.trimDropdown.first();
    try {
      await trimLocator.waitFor({ state: 'attached', timeout: 10000 });
    } catch {
      return [];
    }
    const options = await trimLocator.locator('option').all();
    const values = [];
    for (const opt of options) {
      const text = ((await opt.textContent()) || '').trim();
      if (text) values.push(text);
    }
    return values;
  }
}

module.exports = { PartnerSitePluginPage };
