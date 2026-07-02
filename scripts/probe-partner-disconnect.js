'use strict';

require('dotenv').config({ path: 'environments/.env.local' });
const { chromium } = require('playwright');

async function main() {
  const baseUrl = process.env.PARTNER_SITE_BASE_URL;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('response', async (resp) => {
    if (!resp.url().includes('/wp-json/hoodsly-partners-connector/v1/settings')) return;
    let body = '';
    try { body = await resp.text(); } catch { return; }
    try {
      const json = JSON.parse(body);
      console.log(`[${resp.request().method()}]`, JSON.stringify(json, null, 2));
    } catch {
      console.log(`[${resp.request().method()}]`, body.slice(0, 300));
    }
  });

  await page.goto(`${baseUrl}/wp-login.php`);
  await page.locator('#user_login').fill(process.env.WP_PARTNER_USER);
  await page.locator('#user_pass').fill(process.env.WP_PARTNER_PASS);
  await page.locator('#wp-submit').click();
  await page.waitForURL(/wp-admin/);

  await page.goto(`${baseUrl}/wp-admin/options-general.php?page=hoodsly-partners-connector`);
  await page.waitForLoadState('networkidle');

  const siteUrl = await page.evaluate(() => {
    const text = document.body.innerText || '';
    return {
      connected: (text.match(/Connected Partner:[^\n]*/i) || [])[0] || null,
      home: window.location.origin,
    };
  });
  console.log('SITE INFO:', siteUrl);

  const apiInput = page.locator('input[placeholder*="Connector Platform API Key" i]').first();
  const currentKey = await apiInput.inputValue();
  console.log('Current key length:', currentKey.length);

  // Clear and save to disconnect
  await apiInput.clear();
  await page.getByRole('button', { name: /^save$/i }).evaluate((b) => b.click());
  await page.waitForTimeout(3000);

  const afterClear = await page.evaluate(() => ({
    connected: (document.body.innerText.match(/Connected Partner:[^\n]*/i) || [])[0] || null,
    alerts: Array.from(document.querySelectorAll('.Toastify__toast-body,[role=alert]')).map((el) => el.textContent.trim()),
  }));
  console.log('AFTER CLEAR:', afterClear);

  await browser.close();
}

main().catch(console.error);
