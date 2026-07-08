'use strict';

/**
 * Probe: capture notification DOM after saving API key on partner site.
 * Usage: node scripts/probe-partner-connection-toast.js [apiKey]
 */

require('dotenv').config({ path: 'environments/.env.local' });
const { chromium } = require('playwright');

const baseUrl = process.env.PARTNER_SITE_BASE_URL;
const apiKey = process.argv[2] || process.env.PROBE_API_KEY;

async function captureNotifications(page, label) {
  const data = await page.evaluate(() => {
    const selectors = [
      '[role="alert"]',
      '[role="status"]',
      '[class*="toast"]',
      '[class*="snackbar"]',
      '[class*="notification"]',
      '[class*="notice"]',
      '[class*="alert"]',
      '.notice-success',
      '.notice-error',
      '#message',
    ];

    const hits = [];
    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach((el) => {
        const text = (el.textContent || '').trim();
        if (!text) return;
        hits.push({
          selector: sel,
          tag: el.tagName,
          role: el.getAttribute('role'),
          className: el.className,
          text: text.slice(0, 300),
          visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
        });
      });
    }

    const bodyText = document.body.innerText || '';
    const connectedMatch = bodyText.match(/Connected Partner:[^\n]*/);
    const toastMatch = bodyText.match(/You have successfully connected with partner:[^\n]*/);

    return {
      hits,
      connectedMatch: connectedMatch ? connectedMatch[0] : null,
      toastMatch: toastMatch ? toastMatch[0] : null,
    };
  });

  console.log(`\n── ${label} ──`);
  console.log(JSON.stringify(data, null, 2));
}

async function main() {
  if (!baseUrl) throw new Error('PARTNER_SITE_BASE_URL missing');
  if (!apiKey) throw new Error('Pass API key as arg or set PROBE_API_KEY');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/wp-login.php`);
  await page.locator('#user_login').fill(process.env.WP_PARTNER_USER);
  await page.locator('#user_pass').fill(process.env.WP_PARTNER_PASS);
  await page.locator('#wp-submit').click();
  await page.waitForURL(/wp-admin/i, { timeout: 20000 });

  await page.goto(`${baseUrl}/wp-admin/options-general.php?page=hoodsly-partners-connector`);
  await page.waitForLoadState('domcontentloaded');

  const apiInput = page.locator('input[placeholder*="Connector Platform API Key" i]').first();
  await apiInput.waitFor({ state: 'visible', timeout: 15000 });
  await apiInput.clear();
  await apiInput.fill(apiKey);

  await captureNotifications(page, 'Before Save');

  const saveBtn = page.getByRole('button', { name: /^save$/i });
  const toastPromise = page.waitForFunction(
    () => {
      const t = document.body.innerText || '';
      return /You have successfully connected with partner:/i.test(t)
        || /Connected Partner:/i.test(t);
    },
    { timeout: 20000 }
  ).catch(() => null);

  await saveBtn.click();
  await toastPromise;

  for (const delay of [0, 500, 1500, 3000, 6000]) {
    if (delay) await page.waitForTimeout(delay);
    await captureNotifications(page, `After Save (+${delay}ms)`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
