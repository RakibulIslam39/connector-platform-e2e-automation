'use strict';

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { ResponseCapture } = require('../helpers/response-capture');

const ENV = process.env.ENV || 'local';
require('dotenv').config({ path: path.resolve(__dirname, `../environments/.env.${ENV}`) });

/**
 * Global Setup — runs once before all tests.
 * - Resets API response capture temp file from any previous run
 * - Creates auth-state directory
 * - Authenticates as WP admin and saves browser storage state
 * - Authenticates as partner user and saves storage state
 * - Validates environment connectivity
 */
module.exports = async function globalSetup() {
  console.log('\n[globalSetup] Starting global setup...');
  console.log(`[globalSetup] Environment: ${ENV}`);
  console.log(`[globalSetup] Base URL: ${process.env.BASE_URL}`);

  // Clear any leftover capture data from the previous run
  ResponseCapture.reset();

  const authStateDir = path.resolve(__dirname, '../auth-state');
  if (!fs.existsSync(authStateDir)) {
    fs.mkdirSync(authStateDir, { recursive: true });
    console.log('[globalSetup] Created auth-state directory');
  }

  // Ensure reports directory exists
  const reportsDir = path.resolve(__dirname, '../reports');
  ['html', 'json', 'allure'].forEach((dir) => {
    const fullDir = path.join(reportsDir, dir);
    if (!fs.existsSync(fullDir)) {
      fs.mkdirSync(fullDir, { recursive: true });
    }
  });

  // ── Decide whether browser auth is needed ─────────────────────────────────
  //
  //  Skip auth when:
  //    1. SKIP_AUTH=true  (set explicitly, e.g. by the test:api npm script)
  //    2. Only the "api" Playwright project is targeted  (--project=api)
  //    3. The CLI args contain only tests/api/ paths
  //    4. WP credentials are missing or still placeholder values
  //
  const cliArgs = process.argv.join(' ');
  const isApiOnlyRun =
    process.env.SKIP_AUTH === 'true' ||
    cliArgs.includes('--project=api') ||
    (cliArgs.includes('tests/api') && !cliArgs.match(/tests\/(connector|hoodsly-hub|wrh-hub|wiks-hub)/)) ||
    !process.env.WP_ADMIN_USER ||
    !process.env.WP_ADMIN_PASS ||
    process.env.WP_ADMIN_PASS.includes('REPLACE_WITH');

  if (isApiOnlyRun) {
    console.log('[globalSetup] Skipping browser authentication — API-only run, no login needed.\n');
    return;
  }

  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });

  try {
    // ── Authenticate as WP Admin ───────────────────────────────────────────────
    await authenticateUser(browser, {
      baseURL: process.env.BASE_URL,
      username: process.env.WP_ADMIN_USER,
      password: process.env.WP_ADMIN_PASS,
      statePath: path.join(authStateDir, 'admin.json'),
      role: 'admin',
    });

    // ── Authenticate as Partner (if real credentials + partner site URL provided) ─
    //
    // Partner credentials belong to PARTNER_SITE_BASE_URL (e.g. connectorpartner.s6-tastewp.com),
    // NOT to BASE_URL (the Connector Hub). Auth failure is non-fatal: ConnectorSettingsPage
    // handles its own login in Scenario 2 when auth-state/partner.json is absent.
    //
    const partnerBaseUrl = process.env.PARTNER_SITE_BASE_URL;
    if (
      partnerBaseUrl &&
      process.env.WP_PARTNER_USER &&
      process.env.WP_PARTNER_PASS &&
      !process.env.WP_PARTNER_PASS.includes('REPLACE_WITH')
    ) {
      try {
        await authenticateUser(browser, {
          baseURL: partnerBaseUrl,
          username: process.env.WP_PARTNER_USER,
          password: process.env.WP_PARTNER_PASS,
          statePath: path.join(authStateDir, 'partner.json'),
          role: 'partner',
        });
      } catch (err) {
        console.warn(
          `[globalSetup] WARNING: Partner auth failed (${err.message.split('\n')[0]}). ` +
          `Tests that require partner login will handle auth independently.`
        );
      }
    } else if (!partnerBaseUrl) {
      console.log('[globalSetup] PARTNER_SITE_BASE_URL not set — skipping partner auth.');
    }

    console.log('[globalSetup] Global setup complete.\n');
  } finally {
    await browser.close();
  }
};

async function authenticateUser(browser, { baseURL, username, password, statePath, role }) {
  const stateExists = fs.existsSync(statePath);

  // Use fresh cached auth state (< 12 hours old) to avoid repeated logins
  if (stateExists) {
    const ageMs = Date.now() - fs.statSync(statePath).mtimeMs;
    if (ageMs < 12 * 60 * 60 * 1000) {
      console.log(`[globalSetup] Using cached auth state for: ${role}`);
      return;
    }
    console.log(
      `[globalSetup] Cached auth state for ${role} is stale (>${Math.round(ageMs / 3600000)}h) — re-authenticating`
    );
  }

  console.log(`[globalSetup] Authenticating: ${role} (${username}) at ${baseURL}`);
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  try {
    // Navigate to the WP login page — use a generous timeout for slow remote sites
    await page.goto(`${baseURL}/wp-login.php`, { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Fill credentials
    await page.locator('#user_login').waitFor({ state: 'visible', timeout: 15000 });
    await page.locator('#user_login').fill(username);
    await page.locator('#user_pass').fill(password);
    await page.locator('#wp-submit').click();

    // After clicking submit WordPress may show a "Confirm admin email" interstitial page
    // (action=confirm_admin_email) before redirecting to wp-admin. Handle it explicitly.
    try {
      // Wait until we're either on wp-admin OR on the confirm-email interstitial
      await page.waitForURL(
        url => /wp-admin/.test(url) || /action=confirm_admin_email/.test(url),
        { timeout: 60000 }
      );
    } catch (navErr) {
      // Diagnose: check current URL and any visible error message
      const currentUrl = page.url();
      const loginError = await page
        .locator('#login_error, .notice-error, .error')
        .first()
        .textContent({ timeout: 3000 })
        .catch(() => '(no error element found)');

      const diagMsg =
        `Login navigation failed for ${role}.\n` +
        `  Current URL : ${currentUrl}\n` +
        `  Login error : ${loginError.trim()}\n` +
        `  Original    : ${navErr.message.split('\n')[0]}`;

      // If there is an existing (stale) auth state, fall back to it rather than hard-failing.
      if (stateExists) {
        console.warn(`[globalSetup] WARNING: Re-authentication failed — using STALE auth state for ${role}.`);
        console.warn(`[globalSetup] ACTION REQUIRED: Update the password for ${username} in environments/.env.local`);
        console.warn(`[globalSetup] Diagnostic: ${diagMsg}`);
        return;
      }
      throw new Error(diagMsg);
    }

    // If WordPress landed on the "confirm admin email" interstitial, dismiss it
    if (/action=confirm_admin_email/.test(page.url())) {
      console.log(`[globalSetup] Dismissing "Confirm admin email" interstitial for ${role}`);
      // Click the "This is correct" / "Yes, my email is correct" confirmation button
      const confirmBtn = page
        .getByRole('button', { name: /this is correct|yes.*correct|confirm/i })
        .or(page.locator('input[name="confirm"], button[name="confirm"], #submit'))
        .first();
      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click();
      } else {
        // Fallback: navigate directly to wp-admin, bypassing the interstitial
        await page.goto(`${baseURL}/wp-admin/`, { timeout: 30000, waitUntil: 'domcontentloaded' });
      }
      await page.waitForURL(/wp-admin/, { timeout: 30000 });
    }

    await page.locator('#wpadminbar').waitFor({ state: 'visible', timeout: 20000 });

    await context.storageState({ path: statePath });
    console.log(`[globalSetup] Auth state saved: ${statePath}`);
  } catch (err) {
    // Re-throw so the run fails fast with a clear message rather than hanging
    console.error(`[globalSetup] Failed to authenticate ${role}: ${err.message}`);
    console.error('[globalSetup] TIP: For API-only runs use "npm run test:api" or set SKIP_AUTH=true');
    throw err;
  } finally {
    await context.close();
  }
}
