'use strict';

const { test: base } = require('@playwright/test');
const { LoginPage } = require('../pages/auth/login.page');
const logger = require('../common/utils/logger');

/**
 * Auth fixture — provides pre-authenticated pages for different user roles.
 * Storage state is loaded from auth-state/ directory (populated by global setup).
 */
const authFixture = base.extend({
  /**
   * Authenticated page for WP Admin role.
   * Storage state is loaded automatically via playwright.config.js storageState setting.
   */
  adminPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    // If for any reason the session expired, re-authenticate
    const isLoggedIn = await loginPage.isLoggedIn().catch(() => false);
    if (!isLoggedIn) {
      logger.warn('[authFixture] Session expired, re-authenticating as admin');
      await loginPage.loginWithEnvCredentials();
    }
    await use(page);
  },

  /**
   * Authenticated page for Partner role.
   */
  partnerPage: async ({ browser }, use) => {
    const partnerStateFile = require('path').resolve(__dirname, '../auth-state/partner.json');
    const fs = require('fs');

    let context;
    if (fs.existsSync(partnerStateFile)) {
      context = await browser.newContext({ storageState: partnerStateFile });
    } else {
      context = await browser.newContext();
      const page = await context.newPage();
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(process.env.WP_PARTNER_USER, process.env.WP_PARTNER_PASS);
      await context.storageState({ path: partnerStateFile });
      await page.close();
    }

    const partnerPage = await context.newPage();
    await use(partnerPage);
    await context.close();
  },

  /**
   * Unauthenticated page — for testing login flows, public pages, etc.
   */
  guestPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const guestPage = await context.newPage();
    await use(guestPage);
    await context.close();
  },
});

module.exports = { authFixture };
