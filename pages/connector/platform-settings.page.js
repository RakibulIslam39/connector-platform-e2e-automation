'use strict';

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const { PLATFORM_SETTINGS_SELECTORS } = require('../../constants/selectors');
const logger = require('../../common/utils/logger');

class PlatformSettingsPage extends BasePage {
  constructor(page) {
    super(page);

    // Sidebar nav item in the Connector Hub React app
    this.platformSettingsNav = page.locator('div').filter({ hasText: /^Platform Settings$/ }).first();

    // Product Info tab (within Platform Settings)
    this.productInfoTab = page.locator(PLATFORM_SETTINGS_SELECTORS.PRODUCT_INFO_TAB);
    this.addFaqBtn = page.locator(PLATFORM_SETTINGS_SELECTORS.ADD_FAQ_BTN);
    this.faqLabelHeader = page.locator(PLATFORM_SETTINGS_SELECTORS.FAQ_LABEL_HEADER).filter({ hasText: 'No Label' });
    this.faqPartnerDropdown = page.locator('div.css-19bb58m:visible').first();
    this.faqTitleInput = page.getByPlaceholder('Enter Title').first();
    this.faqDescriptionEditor = page.frameLocator('iframe').locator(PLATFORM_SETTINGS_SELECTORS.FAQ_DESCRIPTION_TINYMCE);
    this.faqSaveBtn = page.locator('span').filter({ hasText: /^Save$/ }).first();
    this.faqSuccessMsg = page.locator(PLATFORM_SETTINGS_SELECTORS.FAQ_SUCCESS_MSG);

    // Partner Order Log sub-section
    this.partnerOrderLogNav = page.locator(PLATFORM_SETTINGS_SELECTORS.PARTNER_ORDER_LOG_NAV);
    this.orderLogPartnerSelect = page.locator('.css-19bb58m').first();
    this.orderLogOrderIdInput = page.locator(PLATFORM_SETTINGS_SELECTORS.ORDER_LOG_ORDER_ID_INPUT);
    this.orderLogFetchBtn = page.locator(PLATFORM_SETTINGS_SELECTORS.ORDER_LOG_FETCH_BTN);
    this.orderLogPayloadHeader = page.locator(PLATFORM_SETTINGS_SELECTORS.ORDER_LOG_PAYLOAD_HEADER);
    this.orderLogErrorMsg = page.locator(PLATFORM_SETTINGS_SELECTORS.ORDER_LOG_ERROR_MSG);
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async goto() {
    await this.navigate(CONNECTOR_PATHS.PLATFORM_SETTINGS);
  }

  /**
   * Clicks the "Platform Settings" sidebar nav item in the Connector Hub React app.
   */
  async clickPlatformSettingsNav() {
    await this.platformSettingsNav.waitFor({ state: 'visible', timeout: 10000 });
    await this.platformSettingsNav.click();
    await this.waitForPageLoad();
  }

  // ─── FAQ Management ──────────────────────────────────────────────────────────

  /**
   * Navigates to the Product Info tab inside Platform Settings.
   */
  async navigateToProductInfoTab() {
    await this.goto();
    await this.productInfoTab.waitFor({ state: 'visible', timeout: 10000 });
    await this.productInfoTab.click();
    await this.addFaqBtn.waitFor({ state: 'visible', timeout: 10000 });
    logger.info('[PlatformSettingsPage] Opened Product Info tab');
  }

  async clickAddPartnerFaq() {
    await this.addFaqBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addFaqBtn.click();
  }

  /**
   * Selects a partner from the FAQ accordion's partner name dropdown (React Select).
   */
  async selectFaqPartner(partnerName) {
    await this.faqPartnerDropdown.waitFor({ state: 'visible', timeout: 10000 });
    await this.faqPartnerDropdown.click();
    const partnerInput = this.faqPartnerDropdown.locator('input').first();
    await partnerInput.waitFor({ state: 'visible', timeout: 10000 });
    await partnerInput.fill('');
    await partnerInput.pressSequentially(partnerName, { delay: 30 });

    const option = this.page
      .locator("div[role='option'], li")
      .filter({ hasText: partnerName })
      .first();
    try {
      await option.waitFor({ state: 'visible', timeout: 10000 });
      await option.click();
    } catch {
      await partnerInput.press('Enter');
    }
    logger.info(`[PlatformSettingsPage] Selected FAQ partner: ${partnerName}`);
  }

  async enterFaqTitle(titleText) {
    await this.faqTitleInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.faqTitleInput.click();
    await this.faqTitleInput.fill(titleText);
  }

  async enterFaqDescription(descriptionText) {
    const descField = this.faqDescriptionEditor.locator('p:visible').first();
    await descField.waitFor({ state: 'visible', timeout: 10000 });
    await descField.click();
    await descField.fill(descriptionText);
  }

  async saveFaqSettings() {
    await this.faqSaveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.faqSaveBtn.click();
  }

  async isFaqSaveSuccessful() {
    try {
      await this.faqSuccessMsg.waitFor({ state: 'visible', timeout: 10000 });
      return await this.faqSuccessMsg.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Full FAQ add flow: navigate → open Product Info tab → click Add Partner FAQ →
   * select partner → fill title & description → save.
   * @param {{ partnerName: string, titleText: string, descriptionText: string }} faqData
   * @returns {Promise<boolean>} true if success popup appeared
   */
  async addPartnerFaq({ partnerName, titleText, descriptionText }) {
    logger.info(`[PlatformSettingsPage] Adding FAQ for partner: ${partnerName}`);
    await this.navigateToProductInfoTab();
    await this.clickAddPartnerFaq();
    await this.faqLabelHeader.waitFor({ state: 'visible', timeout: 10000 });
    await this.faqLabelHeader.click();
    await this.selectFaqPartner(partnerName);
    await this.enterFaqTitle(titleText);
    await this.enterFaqDescription(descriptionText);
    await this.saveFaqSettings();
    return await this.isFaqSaveSuccessful();
  }

  // ─── Partner Order Log ────────────────────────────────────────────────────────

  /**
   * Navigates to the Partner Order Log sub-section inside Platform Settings.
   */
  async navigateToPartnerOrderLog() {
    await this.goto();
    await this.partnerOrderLogNav.waitFor({ state: 'visible', timeout: 8000 });
    await this.partnerOrderLogNav.click();
    await this.orderLogOrderIdInput.waitFor({ state: 'visible', timeout: 8000 });
    logger.info('[PlatformSettingsPage] Opened Partner Order Log');
  }

  /**
   * Selects a partner from the Partner Order Log partner dropdown (React Select).
   */
  async selectOrderLogPartner(partnerName) {
    await this.orderLogPartnerSelect.click();
    await this.page.keyboard.type(partnerName);
    const option = this.page
      .locator(`li:has-text('${partnerName}'), div[role='option']:has-text('${partnerName}')`)
      .first();
    await option.waitFor({ state: 'visible', timeout: 5000 });
    await option.click();
  }

  async enterOrderLogOrderId(orderId) {
    await this.orderLogOrderIdInput.fill(orderId);
  }

  async fetchOrderLogData() {
    await this.orderLogFetchBtn.click();
  }

  async isOrderLogPayloadVisible() {
    try {
      await this.orderLogPayloadHeader.first().waitFor({ state: 'visible', timeout: 8000 });
      return await this.orderLogPayloadHeader.first().isVisible();
    } catch {
      return false;
    }
  }

  async isOrderLogErrorVisible() {
    try {
      await this.orderLogErrorMsg.first().waitFor({ state: 'visible', timeout: 5000 });
      return await this.orderLogErrorMsg.first().isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Full order log search: select partner → enter order ID → fetch → return state.
   * @param {{ partnerName: string, orderId: string }} searchParams
   * @returns {Promise<'found' | 'not-found' | 'unknown'>}
   */
  async searchOrderLog({ partnerName, orderId }) {
    logger.info(
      `[PlatformSettingsPage] Searching order log — partner: ${partnerName}, orderId: ${orderId}`
    );
    await this.navigateToPartnerOrderLog();
    await this.selectOrderLogPartner(partnerName);
    await this.enterOrderLogOrderId(orderId);
    await this.fetchOrderLogData();

    if (await this.isOrderLogPayloadVisible()) return 'found';
    if (await this.isOrderLogErrorVisible()) return 'not-found';
    return 'unknown';
  }
}

module.exports = { PlatformSettingsPage };
