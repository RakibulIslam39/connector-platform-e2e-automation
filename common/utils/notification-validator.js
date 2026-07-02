'use strict';

/**
 * NotificationValidator — helpers for asserting toast/popup/notice messages.
 *
 * Covers the various notification patterns used across the Connector Platform SPA
 * and the partner WordPress site (WP admin notices, Vue/React toasts, snackbars).
 *
 * All selectors use broad attribute-based matching so they work regardless of
 * whether the SPA renders a toast, alert, or WP-style notice.
 */

const { expect } = require('@playwright/test');

/**
 * Base locator string that matches common notification container patterns.
 * Checked in priority order: role="alert", toast classes, WP notice classes.
 */
const NOTIFICATION_SELECTOR = [
  '[role="alert"]',
  '[role="status"]',
  '.Toastify__toast-body',
  '.Toastify__toast--success',
  '.Toastify__toast--error',
  '.Toastify__toast',
  '[class*="toast"]',
  '[class*="snackbar"]',
  '[class*="notification"]',
  '[class*="notice"]',
  '[class*="alert"]',
  '.notice-success',
  '.notice-error',
  '#message',
].join(', ');

/** Escape special regex characters in a literal string. */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Waits until a notification containing `text` is visible on the page.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} text - Exact or partial text to match inside the notification
 * @param {number} [timeout=12000] - Max wait time in ms
 */
async function waitForToast(page, text, timeout = 12000) {
  const locator = page.locator(NOTIFICATION_SELECTOR).filter({ hasText: text });
  await locator.first().waitFor({ state: 'visible', timeout });
}

/**
 * Asserts that a notification containing `text` is currently visible.
 * Uses expect() so it integrates naturally with Playwright's assertion system.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 * @param {number} [timeout=12000]
 */
async function assertToastVisible(page, text, timeout = 12000) {
  const locator = page.locator(NOTIFICATION_SELECTOR).filter({ hasText: text });
  await expect(locator.first()).toBeVisible({ timeout });
}

/**
 * Soft-asserts that a notification containing `text` is currently visible.
 * Does NOT stop execution on failure — use for bulk validation scenarios.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} text
 * @param {number} [timeout=12000]
 */
async function assertToastSoft(page, text, timeout = 12000) {
  const locator = page.locator(NOTIFICATION_SELECTOR).filter({ hasText: text });
  await expect.soft(locator.first()).toBeVisible({ timeout });
}

/**
 * Asserts the "API key copied to clipboard." notification is visible.
 * Called immediately after clicking the Copy button on the API key field.
 *
 * @param {import('@playwright/test').Page} page
 */
async function assertClipboardToast(page) {
  await assertToastVisible(page, 'API key copied to clipboard.');
}

/**
 * Asserts the "Partner created." success notification is visible.
 *
 * @param {import('@playwright/test').Page} page
 */
async function assertPartnerCreated(page) {
  await assertToastVisible(page, 'Partner created.');
}

/** Asserts partner was moved to trash (Connector Hub SPA toast). */
async function assertPartnerMovedToTrash(page) {
  await assertToastVisible(page, 'Partner deleted.');
}

/** Asserts partner was permanently deleted (Connector Hub SPA toast). */
async function assertPartnerPermanentlyDeleted(page) {
  await assertToastVisible(page, 'Partner permanently deleted.');
}

/**
 * Waits for partner connection success on the partner-site connector settings page.
 *
 * The plugin may show a fleeting toast:
 *   "You have successfully connected with partner: <Partner Name>"
 * and/or a persistent green status label:
 *   "Connected Partner: <Partner Name>"
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} partnerName
 * @param {number} [timeout=20000]
 */
async function waitForConnectionSuccess(page, partnerName, timeout = 20000) {
  const toastText = `You have successfully connected with partner: ${partnerName}`;
  const connectedText = `Connected Partner: ${partnerName}`;
  const connectedPattern = new RegExp(
    `Connected Partner:\\s*${escapeRegex(partnerName)}`,
    'i'
  );

  const toastLocator = page
    .locator('.Toastify__toast-body, .Toastify__toast, [role="alert"]')
    .filter({ hasText: toastText });
  const connectedLocator = page.getByText(connectedPattern);

  try {
    await Promise.race([
      toastLocator.first().waitFor({ state: 'visible', timeout }),
      connectedLocator.first().waitFor({ state: 'visible', timeout }),
      page.waitForFunction(
        ({ toast, connected }) => {
          const bodyText = document.body.innerText || '';
          return bodyText.includes(toast) || bodyText.includes(connected);
        },
        { toast: toastText, connected: connectedText },
        { timeout }
      ),
    ]);
  } catch (error) {
    const bodySnippet = await page.evaluate(() => {
      const text = document.body.innerText || '';
      return {
        toast: (text.match(/You have successfully connected with partner:[^\n]*/i) || [])[0] || null,
        connected: (text.match(/Connected Partner:[^\n]*/i) || [])[0] || null,
      };
    });

    throw new Error(
      `Connection success not found for "${partnerName}". ` +
        `Visible toast: ${bodySnippet.toast || 'none'}. ` +
        `Visible label: ${bodySnippet.connected || 'none'}.`
    );
  }
}

/**
 * Asserts the partner connection success message.
 * Accepts either the success toast or the persistent "Connected Partner" label.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} partnerName - Expected partner name embedded in the message
 * @param {number} [timeout=20000]
 */
async function assertConnectionSuccess(page, partnerName, timeout = 20000) {
  await waitForConnectionSuccess(page, partnerName, timeout);
}

/**
 * Waits until the connector Settings save action finishes (button leaves "Saving…").
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout=30000]
 */
async function waitForSettingsSaveIdle(page, timeout = 30000) {
  await page.waitForFunction(
    () => {
      const buttons = [...document.querySelectorAll('button')];
      const saveBtn = buttons.find((btn) => /^(save|saving)/i.test((btn.textContent || '').trim()));
      if (!saveBtn) return true;
      return !saveBtn.disabled && !/saving/i.test(saveBtn.textContent || '');
    },
    { timeout }
  );
}

/**
 * Asserts the "Settings updated successfully." notification.
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout=30000]
 */
async function assertSettingsUpdated(page, timeout = 30000) {
  const text = 'Settings updated successfully.';
  const toastLocator = page.locator(NOTIFICATION_SELECTOR).filter({ hasText: text });

  try {
    await Promise.race([
      toastLocator.first().waitFor({ state: 'visible', timeout }),
      page.waitForFunction(
        (expected) => (document.body.innerText || '').includes(expected),
        text,
        { timeout }
      ),
    ]);
  } catch (error) {
    const visible = await getVisibleNotificationText(page);
    throw new Error(
      `Settings success not found. Expected "${text}". Visible notification: ${visible || 'none'}`
    );
  }
}

/**
 * Asserts the "Product imported successfully." notification.
 *
 * @param {import('@playwright/test').Page} page
 */
async function assertImportSuccess(page) {
  await assertToastVisible(page, 'Product imported successfully.');
}

/**
 * Waits for any visible notification to disappear (useful when chaining actions).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [timeout=8000]
 */
async function waitForToastDismissed(page, timeout = 8000) {
  const locator = page.locator(NOTIFICATION_SELECTOR).first();
  try {
    await locator.waitFor({ state: 'hidden', timeout });
  } catch {
    // Toast may have already disappeared — not a failure
  }
}

/**
 * Returns visible notification text from toast/alert/status elements, if any.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string|null>}
 */
async function getVisibleNotificationText(page) {
  const selectors = [
    NOTIFICATION_SELECTOR,
    '[role="status"]',
  ].join(', ');

  const notifications = page.locator(selectors);
  const count = await notifications.count();

  for (let i = 0; i < count; i += 1) {
    const item = notifications.nth(i);
    const visible = await item.isVisible().catch(() => false);
    if (!visible) continue;

    const text = (await item.textContent().catch(() => '')).trim();
    if (text) return text;
  }

  return null;
}

module.exports = {
  waitForToast,
  assertToastVisible,
  assertToastSoft,
  assertClipboardToast,
  assertPartnerCreated,
  assertPartnerMovedToTrash,
  assertPartnerPermanentlyDeleted,
  waitForConnectionSuccess,
  assertConnectionSuccess,
  waitForSettingsSaveIdle,
  assertSettingsUpdated,
  assertImportSuccess,
  waitForToastDismissed,
  getVisibleNotificationText,
};
