'use strict';

/**
 * ConnectorSettingsPage — POM for the Hoodsly Partners Connector plugin settings page
 * on the partner WordPress site.
 *
 * This page object handles three distinct sections within
 * wp-admin → Settings → Hoodsly Partners Connector:
 *
 *   1. API Configuration  — input API key, submit, validate connection message
 *   2. Settings           — enable "Publish products automatically upon import?", Save
 *   3. Import             — enable "Import data from Connector Platform", click Import
 *
 * The page is accessed on the partner site (PARTNER_SITE_BASE_URL), NOT the
 * Connector Hub. The fixture creates a separate browser context for this URL.
 */

const { BasePage } = require('../base.page');
const {
  assertSettingsUpdated,
  assertImportSuccess,
  waitForSettingsSaveIdle,
} = require('../../common/utils/notification-validator');
const logger = require('../../common/utils/logger');

/**
 * WP admin path for the Hoodsly Partners Connector settings page.
 * The page slug matches the plugin's registered settings page.
 */
const CONNECTOR_PLUGIN_PATH = '/wp-admin/options-general.php?page=hoodsly-partners-connector';

class ConnectorSettingsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page - Page instance pointed at PARTNER_SITE_BASE_URL
   */
  constructor(page) {
    super(page);

    // ── Login form (partner WP site) ──────────────────────────────────────────
    this.loginUsernameInput = page.locator('#user_login, input[name="log"]');
    this.loginPasswordInput = page.locator('#user_pass, input[name="pwd"]');
    this.loginSubmitBtn = page.locator('#wp-submit, input[type="submit"][value*="Log"]');

    // ── API Configuration section ─────────────────────────────────────────────
    // The input field for the Connector Platform API Key
    this.apiKeyInput = page
      .locator(
        'input[name*="api_key"], input[id*="api_key"], input[placeholder*="API key" i], ' +
          'input[placeholder*="connector" i]'
      )
      .first();

    // The save/submit button specifically for the API key section
    this.apiKeySaveBtn = page
      .locator('input[type="submit"][value*="Save"], button[type="submit"]')
      .filter({ has: page.locator('..').filter({ hasText: /api.*key|connector.*platform/i }) })
      .first();

    // Broader fallback: first submit button in the API section form
    this.apiSectionSubmitBtn = page
      .locator('form')
      .filter({ has: page.locator('input[name*="api_key"], input[id*="api_key"]') })
      .locator('input[type="submit"], button[type="submit"]')
      .first();

    // ── Settings section ──────────────────────────────────────────────────────
    // "Publish products automatically upon import?" toggle
    this.autoPublishToggle = page
      .locator('input[type="checkbox"], input[type="radio"], button[role="switch"]')
      .filter({
        has: page.locator('..').filter({ hasText: /publish.*automatically|auto.*publish/i }),
      })
      .first();

    this.autoPublishLabel = page
      .locator('label, td, div')
      .filter({ hasText: /publish products automatically upon import/i })
      .first();

    // Settings section Save button
    this.settingsSaveBtn = page
      .locator('input[type="submit"][value*="Save"], button[type="submit"]')
      .filter({ has: page.locator('..').filter({ hasText: /publish.*automatically|settings/i }) })
      .first();

    // ── Import section ────────────────────────────────────────────────────────
    // "Import data from Connector Platform" toggle/checkbox
    this.importToggle = page
      .locator('input[type="checkbox"], input[type="radio"], button[role="switch"]')
      .filter({ has: page.locator('..').filter({ hasText: /import data from connector/i }) })
      .first();

    this.importToggleLabel = page
      .locator('label, td, div')
      .filter({ hasText: /import data from connector platform/i })
      .first();

    // "Import" action button
    this.importBtn = page
      .getByRole('button', { name: /^import$/i })
      .or(
        page
          .locator('input[type="submit"][value="Import"], button')
          .filter({ hasText: /^import$/i })
      )
      .first();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Auth — Login to partner WordPress site
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Logs in to the partner WordPress site using credentials from environment variables.
   * Uses WP_PARTNER_USER and WP_PARTNER_PASS.
   */
  async loginAsPartner() {
    const baseUrl = process.env.PARTNER_SITE_BASE_URL;
    const username = process.env.WP_PARTNER_USER;
    const password = process.env.WP_PARTNER_PASS;

    if (!baseUrl || !username || !password) {
      throw new Error(
        '[ConnectorSettingsPage] Missing PARTNER_SITE_BASE_URL, WP_PARTNER_USER, or WP_PARTNER_PASS in environment'
      );
    }

    logger.info(`[ConnectorSettingsPage] Logging in as partner: ${username}`);
    await this.page.goto(`${baseUrl}/wp-login.php`);
    await this.page.waitForLoadState('domcontentloaded');

    await this.loginUsernameInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.loginUsernameInput.fill(username);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitBtn.click();
    await this.page.waitForLoadState('domcontentloaded');

    // WordPress sometimes shows a "Confirm admin email" interstitial before the
    // dashboard — bypass it by going straight to wp-admin.
    if (/action=confirm_admin_email/i.test(this.page.url())) {
      await this.page.goto(`${baseUrl}/wp-admin/`, { waitUntil: 'domcontentloaded' });
    }

    // Readiness = the WP admin bar is present. Avoids waitForURL's default 'load'
    // wait, which the heavy partner dashboard (WooCommerce + remote news widgets)
    // can exceed even though navigation already succeeded.
    await this.page.locator('#wpadminbar').waitFor({ state: 'visible', timeout: 30000 });
    logger.info('[ConnectorSettingsPage] Partner login successful');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navigates to the Hoodsly Partners Connector plugin settings page.
   * Assumes the user is already logged in as a partner admin.
   */
  async navigateToSettings() {
    const baseUrl = process.env.PARTNER_SITE_BASE_URL;
    const settingsUrl = `${baseUrl}${CONNECTOR_PLUGIN_PATH}`;
    logger.info(`[ConnectorSettingsPage] Navigating to connector settings: ${settingsUrl}`);
    await this.page.goto(settingsUrl);
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the page to render the API key field as a readiness signal
    await this.apiKeyInput.waitFor({ state: 'visible', timeout: 20000 });
    logger.info('[ConnectorSettingsPage] Connector settings page loaded');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Section 1: API Configuration
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Inputs the Connector Platform API Key into the API Key field.
   * @param {string} apiKey - The API key generated during partner creation (Scenario 1)
   */
  async inputApiKey(apiKey) {
    await this.apiKeyInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.apiKeyInput.click({ clickCount: 3 });
    await this.apiKeyInput.fill('');
    await this.apiKeyInput.fill(apiKey);
    await this.apiKeyInput.press('Tab');
    logger.info(`[ConnectorSettingsPage] Entered API key: ${apiKey.substring(0, 8)}...`);
  }

  /**
   * Submits the API key configuration form.
   * Waits for the settings API POST to complete; does not assert toast/popup text.
   */
  async submitApiKey() {
    const saveBtn = this.page.getByRole('button', { name: /^save$/i });
    const fallback = this.page
      .locator('input[type="submit"], button[type="submit"], button')
      .filter({ hasText: /save/i })
      .first();

    const postResponse = this.page.waitForResponse(
      (resp) =>
        resp.url().includes('/wp-json/hoodsly-partners-connector/v1/settings') &&
        resp.request().method() === 'POST',
      { timeout: 30000 }
    );

    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.evaluate((button) => button.click());
    } else {
      await fallback.waitFor({ state: 'visible', timeout: 10000 });
      await fallback.evaluate((button) => button.click());
    }

    const response = await postResponse;
    const payload = await response.json().catch(() => ({}));

    if (!payload.success) {
      const errors = Array.isArray(payload.data)
        ? payload.data.join('; ')
        : JSON.stringify(payload.data);
      throw new Error(`[ConnectorSettingsPage] API key save failed: ${errors}`);
    }

    if (payload.data?.name) {
      logger.info(
        `[ConnectorSettingsPage] API key saved — connected partner: ${payload.data.name}`
      );
    }

    await this.page.waitForLoadState('domcontentloaded');
    logger.info('[ConnectorSettingsPage] Submitted API key');
    return payload.data?.name || null;
  }

  /**
   * Reads the connected partner name shown after API key save.
   * @returns {Promise<string|null>}
   */
  async readConnectedPartnerName() {
    const label = this.page.locator(':text("Connected Partner:")').first();
    if (!(await label.isVisible({ timeout: 5000 }).catch(() => false))) {
      return null;
    }
    const text = ((await label.textContent()) || '').replace(/Connected Partner:/i, '').trim();
    return text || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Tab navigation (React SPA tabs within the connector plugin)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Locator scope for the Hoodsly Partners Connector React app. */
  _connectorApp() {
    return this.page.locator('#hoodsly-partners-connector');
  }

  /** Opens the Settings tab (auto-publish and related options). */
  async openSettingsTab() {
    const tab = this._connectorApp().getByRole('link', { name: /^settings$/i });
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await this.page.waitForLoadState('domcontentloaded');
    logger.info('[ConnectorSettingsPage] Opened Settings tab');
  }

  /** Opens the Import tab (import toggle and Import button). */
  async openImportTab() {
    const tab = this._connectorApp().getByRole('link', { name: /^import$/i });
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    await this.page.waitForLoadState('domcontentloaded');
    logger.info('[ConnectorSettingsPage] Opened Import tab');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Section 2: Settings
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Enables the "Publish products automatically upon import?" toggle if not already enabled.
   * Idempotent — skips when already on.
   */
  async enableAutoPublish() {
    await this.openSettingsTab();

    const app = this._connectorApp();
    const toggle = app
      .locator('div')
      .filter({ hasText: /Publish products automatically upon import\?/i })
      .getByRole('switch')
      .first();

    await toggle.waitFor({ state: 'visible', timeout: 10000 });

    const isChecked = await toggle.evaluate((el) => {
      const aria = el.getAttribute('aria-checked');
      if (aria !== null) {
        return aria === 'true';
      }
      return el.hasAttribute('checked');
    });

    if (!isChecked) {
      await toggle.click();
      await this.page.waitForTimeout(400);
      logger.info('[ConnectorSettingsPage] Enabled auto-publish toggle');
    } else {
      logger.info('[ConnectorSettingsPage] Auto-publish already enabled — skipping');
    }
  }

  /**
   * Clicks the Settings section Save button.
   * The plugin uses a React "Save" button — target by role.
   */
  async saveSettings() {
    const saveBtn = this._connectorApp().getByRole('button', { name: /^save$/i });
    if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await saveBtn.click();
    } else {
      const fallback = this._connectorApp()
        .locator('input[type="submit"], button')
        .filter({ hasText: /save/i })
        .first();
      await fallback.waitFor({ state: 'visible', timeout: 10000 });
      await fallback.click();
    }
    await waitForSettingsSaveIdle(this.page, 30000).catch(() => {});
    logger.info('[ConnectorSettingsPage] Clicked Save settings');
  }

  /**
   * Validates "Settings updated successfully." notification.
   * @param {number} [timeout=30000]
   */
  async waitForSettingsSaved(timeout = 30000) {
    await waitForSettingsSaveIdle(this.page, timeout);
    await assertSettingsUpdated(this.page, timeout);

    logger.info('[ConnectorSettingsPage] Settings saved notification validated');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Section 3: Import Products
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Accepts Terms and Conditions on the Import tab (required before clicking Import).
   * The Import tab has no toggle — only a terms checkbox and Import button.
   */
  async enableImportToggle() {
    await this.openImportTab();

    const app = this._connectorApp();
    const termsCheckbox = app.getByRole('checkbox', {
      name: /I accept the Terms and Conditions and MAP Policy/i,
    });

    await termsCheckbox.waitFor({ state: 'visible', timeout: 10000 });

    if (!(await termsCheckbox.isChecked())) {
      await termsCheckbox.check();
      logger.info('[ConnectorSettingsPage] Accepted import terms and conditions');
    } else {
      logger.info('[ConnectorSettingsPage] Import terms already accepted — skipping');
    }
  }

  /**
   * Clicks the Import button to trigger product import from Connector Platform.
   */
  async clickImport() {
    const importBtn = this._connectorApp().getByRole('button', { name: /^import$/i });
    await importBtn.waitFor({ state: 'visible', timeout: 10000 });
    await importBtn.click();
    logger.info('[ConnectorSettingsPage] Clicked Import button');
  }

  /**
   * Validates the "Product imported successfully." notification.
   * Import can take time — uses a longer timeout.
   */
  async waitForImportSuccess() {
    await assertImportSuccess(this.page);
    logger.info('[ConnectorSettingsPage] Import success notification validated');
  }
}

module.exports = { ConnectorSettingsPage };
