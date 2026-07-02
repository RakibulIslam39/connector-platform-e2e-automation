'use strict';

const { WP_SELECTORS } = require('../../constants/selectors');
const { WP_PATHS } = require('../../constants/urls');
const logger = require('../utils/logger');
const { waitForWpNotice, waitForWpSpinner } = require('../utils/wait-utils');

/**
 * Reusable WordPress admin actions.
 * Use these across all page objects that interact with WP admin.
 */

/**
 * Navigates to WordPress admin.
 * @param {import('@playwright/test').Page} page
 */
async function goToWpAdmin(page) {
  await page.goto(WP_PATHS.ADMIN);
  await page.locator(WP_SELECTORS.ADMIN_BAR).waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Clicks a WordPress admin menu item by its text label.
 * @param {import('@playwright/test').Page} page
 * @param {string} menuText
 */
async function clickAdminMenu(page, menuText) {
  const menuItem = page.locator(`${WP_SELECTORS.WP_MENU} a`).filter({ hasText: menuText }).first();
  await menuItem.click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Saves WordPress settings (clicks the Save Settings / Submit button).
 * @param {import('@playwright/test').Page} page
 */
async function saveSettings(page) {
  await page.locator(WP_SELECTORS.SAVE_SETTINGS_BTN).click();
  await waitForWpSpinner(page);
  return await waitForWpNotice(page, 'success').catch(() => null);
}

/**
 * Reads the current WordPress admin notice text.
 * @param {import('@playwright/test').Page} page
 * @param {'success'|'error'|'warning'} type
 */
async function getAdminNotice(page, type = 'success') {
  return await waitForWpNotice(page, type);
}

/**
 * Dismisses a WordPress admin notice if present.
 * @param {import('@playwright/test').Page} page
 */
async function dismissAdminNotices(page) {
  const dismissBtns = page.locator('.notice-dismiss');
  const count = await dismissBtns.count();
  for (let i = 0; i < count; i++) {
    try {
      await dismissBtns.nth(i).click();
    } catch {
      // Notice may have already disappeared
    }
  }
}

/**
 * Searches for a post/page/product in the WP admin list table.
 * @param {import('@playwright/test').Page} page
 * @param {string} searchTerm
 */
async function searchInAdminList(page, searchTerm) {
  await page.locator('#post-search-input').fill(searchTerm);
  await page.locator('#search-submit').click();
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Activates a plugin from the Plugins admin page.
 * @param {import('@playwright/test').Page} page
 * @param {string} pluginSlug - plugin folder/file slug
 */
async function activatePlugin(page, pluginSlug) {
  await page.goto(WP_PATHS.ADMIN_PLUGINS);
  const activateLink = page.locator(`tr[data-slug="${pluginSlug}"] .activate a`);
  if (await activateLink.isVisible()) {
    await activateLink.click();
    await page.waitForLoadState('domcontentloaded');
    logger.info(`[wp-actions] Plugin activated: ${pluginSlug}`);
  } else {
    logger.info(`[wp-actions] Plugin already active: ${pluginSlug}`);
  }
}

/**
 * Checks if a plugin is currently active.
 * @param {import('@playwright/test').Page} page
 * @param {string} pluginSlug
 */
async function isPluginActive(page, pluginSlug) {
  await page.goto(WP_PATHS.ADMIN_PLUGINS);
  const row = page.locator(`tr[data-slug="${pluginSlug}"]`);
  const classes = await row.getAttribute('class');
  return classes && classes.includes('active');
}

module.exports = {
  goToWpAdmin,
  clickAdminMenu,
  saveSettings,
  getAdminNotice,
  dismissAdminNotices,
  searchInAdminList,
  activatePlugin,
  isPluginActive,
};
