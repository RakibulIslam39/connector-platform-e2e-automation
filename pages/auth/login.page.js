'use strict';

const { BasePage } = require('../base.page');
const { WP_SELECTORS } = require('../../constants/selectors');
const logger = require('../../common/utils/logger');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.usernameInput = page.locator(WP_SELECTORS.LOGIN_USERNAME);
    this.passwordInput = page.locator(WP_SELECTORS.LOGIN_PASSWORD);
    this.submitBtn = page.locator(WP_SELECTORS.LOGIN_SUBMIT);
    this.loginError = page.locator(WP_SELECTORS.LOGIN_ERROR);
    this.adminBar = page.locator(WP_SELECTORS.ADMIN_BAR);
  }

  async goto() {
    await this.navigate('/wp-login.php');
  }

  async login(username, password) {
    logger.info(`[LoginPage] Logging in as: ${username}`);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
    await this.page.waitForURL(/wp-admin/, { timeout: 30000 });
    await this.adminBar.waitFor({ state: 'visible', timeout: 15000 });
    logger.info('[LoginPage] Login successful');
  }

  async loginWithEnvCredentials() {
    await this.goto();
    await this.login(process.env.WP_ADMIN_USER, process.env.WP_ADMIN_PASS);
  }

  async getErrorMessage() {
    await this.loginError.waitFor({ state: 'visible', timeout: 10000 });
    return await this.loginError.textContent();
  }

  async isLoggedIn() {
    return await this.adminBar.isVisible();
  }

  async getUserDisplayName() {
    const el = this.page.locator(WP_SELECTORS.ADMIN_BAR_USER_DISPLAY).first();
    await el.waitFor({ state: 'visible', timeout: 10000 });
    return (await el.textContent()).trim();
  }
}

module.exports = { LoginPage };
