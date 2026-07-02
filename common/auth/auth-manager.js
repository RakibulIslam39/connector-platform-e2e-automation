'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

const AUTH_STATE_DIR = path.resolve(__dirname, '../../auth-state');

/**
 * Manages authentication state for multiple user roles.
 * Saves and loads Playwright storage state (cookies + localStorage).
 */
class AuthManager {
  constructor() {
    if (!fs.existsSync(AUTH_STATE_DIR)) {
      fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
    }
  }

  getStatePath(role) {
    return path.join(AUTH_STATE_DIR, `${role}.json`);
  }

  hasStoredState(role) {
    const statePath = this.getStatePath(role);
    if (!fs.existsSync(statePath)) {
      return false;
    }
    // Check if state file is fresh enough (< 12 hours)
    const stats = fs.statSync(statePath);
    const ageMs = Date.now() - stats.mtimeMs;
    const maxAgeMs = 12 * 60 * 60 * 1000;
    return ageMs < maxAgeMs;
  }

  /**
   * Logs into WordPress and saves the authentication state.
   * @param {import('@playwright/test').Page} page
   * @param {object} credentials - { username, password, baseURL }
   * @param {string} role - identifier for this auth state (e.g., 'admin', 'partner')
   */
  async loginAndSaveState(page, credentials, role = 'admin') {
    const { username, password, baseURL } = credentials;
    logger.info(`[AuthManager] Logging in as ${role} (${username})`);

    await page.goto(`${baseURL}/wp-login.php`);
    await page.locator('#user_login').fill(username);
    await page.locator('#user_pass').fill(password);
    await page.locator('#wp-submit').click();

    // Wait for successful login
    await page.waitForURL(/wp-admin/, { timeout: 30000 });
    await page.locator('#wpadminbar').waitFor({ state: 'visible', timeout: 15000 });

    const statePath = this.getStatePath(role);
    await page.context().storageState({ path: statePath });
    logger.info(`[AuthManager] Auth state saved: ${statePath}`);

    return statePath;
  }

  /**
   * Performs WordPress login without saving state.
   * @param {import('@playwright/test').Page} page
   * @param {object} credentials - { username, password }
   */
  async login(page, credentials) {
    const { username, password } = credentials;
    logger.info(`[AuthManager] Logging in as: ${username}`);

    await page.goto('/wp-login.php');
    await page.locator('#user_login').fill(username);
    await page.locator('#user_pass').fill(password);
    await page.locator('#wp-submit').click();
    await page.waitForURL(/wp-admin/, { timeout: 30000 });
    await page.locator('#wpadminbar').waitFor({ state: 'visible', timeout: 15000 });

    logger.info(`[AuthManager] Login successful: ${username}`);
  }

  /**
   * Logs out from WordPress.
   * @param {import('@playwright/test').Page} page
   */
  async logout(page) {
    logger.info('[AuthManager] Logging out');
    await page.goto('/wp-login.php?action=logout');
    try {
      await page.locator('a[href*="action=logout"]').click();
    } catch {
      // Already logged out
    }
  }

  /**
   * Clears all stored auth states.
   */
  clearAllStates() {
    const files = fs.readdirSync(AUTH_STATE_DIR).filter((f) => f.endsWith('.json'));
    files.forEach((file) => {
      fs.unlinkSync(path.join(AUTH_STATE_DIR, file));
      logger.info(`[AuthManager] Cleared auth state: ${file}`);
    });
  }
}

const authManager = new AuthManager();
module.exports = { authManager, AuthManager };
