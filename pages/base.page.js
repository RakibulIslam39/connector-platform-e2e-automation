'use strict';

const { expect } = require('@playwright/test');
const logger = require('../common/utils/logger');

/**
 * BasePage — all page objects extend this class.
 * Provides shared navigation, wait, and interaction utilities.
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ─── Navigation ─────────────────────────────────────────────────────────────

  async navigate(path = '') {
    logger.debug(`Navigating to: ${path}`);
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  async reload() {
    await this.page.reload();
    await this.waitForPageLoad();
  }

  async goBack() {
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  getCurrentURL() {
    return this.page.url();
  }

  async getTitle() {
    return await this.page.title();
  }

  // ─── Element interactions ────────────────────────────────────────────────────

  async click(selector) {
    await this.page.locator(selector).click();
  }

  async fill(selector, value) {
    const locator = this.page.locator(selector);
    await locator.clear();
    await locator.fill(value);
  }

  async selectOption(selector, value) {
    await this.page.locator(selector).selectOption(value);
  }

  async check(selector) {
    await this.page.locator(selector).check();
  }

  async uncheck(selector) {
    await this.page.locator(selector).uncheck();
  }

  async uploadFile(selector, filePath) {
    await this.page.locator(selector).setInputFiles(filePath);
  }

  async hover(selector) {
    await this.page.locator(selector).hover();
  }

  async pressKey(selector, key) {
    await this.page.locator(selector).press(key);
  }

  async clearAndFill(selector, value) {
    const locator = this.page.locator(selector);
    await locator.triple_click();
    await locator.fill(value);
  }

  // ─── Waits ───────────────────────────────────────────────────────────────────

  async waitForSelector(selector, options = {}) {
    return await this.page.waitForSelector(selector, { timeout: 15000, ...options });
  }

  async waitForVisible(selector, timeout = 15000) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  async waitForHidden(selector, timeout = 15000) {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }

  async waitForURL(urlPattern, timeout = 30000) {
    await this.page.waitForURL(urlPattern, { timeout });
  }

  async waitForText(text, timeout = 15000) {
    await this.page.getByText(text).waitFor({ state: 'visible', timeout });
  }

  async waitForSpinnerToDisappear(spinnerSelector = '.spinner.is-active') {
    try {
      await this.page.locator(spinnerSelector).waitFor({ state: 'hidden', timeout: 30000 });
    } catch {
      // Spinner may not appear at all — not an error
    }
  }

  // ─── Assertions ──────────────────────────────────────────────────────────────

  async assertVisible(selector) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async assertHidden(selector) {
    await expect(this.page.locator(selector)).toBeHidden();
  }

  async assertText(selector, expectedText) {
    await expect(this.page.locator(selector)).toContainText(expectedText);
  }

  async assertExactText(selector, expectedText) {
    await expect(this.page.locator(selector)).toHaveText(expectedText);
  }

  async assertValue(selector, expectedValue) {
    await expect(this.page.locator(selector)).toHaveValue(expectedValue);
  }

  async assertEnabled(selector) {
    await expect(this.page.locator(selector)).toBeEnabled();
  }

  async assertDisabled(selector) {
    await expect(this.page.locator(selector)).toBeDisabled();
  }

  async assertURLContains(urlPart) {
    await expect(this.page).toHaveURL(new RegExp(urlPart));
  }

  async assertTitle(expectedTitle) {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle));
  }

  // ─── Getters ─────────────────────────────────────────────────────────────────

  async getText(selector) {
    return await this.page.locator(selector).textContent();
  }

  async getValue(selector) {
    return await this.page.locator(selector).inputValue();
  }

  async getAttribute(selector, attribute) {
    return await this.page.locator(selector).getAttribute(attribute);
  }

  async isVisible(selector) {
    return await this.page.locator(selector).isVisible();
  }

  async isEnabled(selector) {
    return await this.page.locator(selector).isEnabled();
  }

  async isChecked(selector) {
    return await this.page.locator(selector).isChecked();
  }

  async getCount(selector) {
    return await this.page.locator(selector).count();
  }

  // ─── Screenshots & Artifacts ─────────────────────────────────────────────────

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${name}-${timestamp}.png`;
    await this.page.screenshot({
      path: `./reports/screenshots/${fileName}`,
      fullPage: true,
    });
    logger.info(`Screenshot saved: ${fileName}`);
    return fileName;
  }

  // ─── Dialog handling ─────────────────────────────────────────────────────────

  async acceptDialog() {
    this.page.once('dialog', (dialog) => dialog.accept());
  }

  async dismissDialog() {
    this.page.once('dialog', (dialog) => dialog.dismiss());
  }

  // ─── Scroll ──────────────────────────────────────────────────────────────────

  async scrollTo(selector) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  // ─── iframe support ──────────────────────────────────────────────────────────

  getFrame(frameName) {
    return this.page.frame({ name: frameName });
  }

  getFrameLocator(frameSelector) {
    return this.page.frameLocator(frameSelector);
  }
}

module.exports = { BasePage };
