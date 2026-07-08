'use strict';

require('dotenv').config({ path: 'environments/.env.local' });
const { chromium } = require('playwright');

async function main() {
  const baseUrl = process.env.PARTNER_SITE_BASE_URL;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on('response', async (resp) => {
    if (!resp.url().includes('/wp-json/hoodsly-partners-connector/v1/settings')) return;
    if (resp.request().method() !== 'POST') return;
    let body = '';
    try { body = await resp.text(); } catch { return; }
    try {
      const json = JSON.parse(body);
      const summary = json.success
        ? { success: true, partner: json.data?.name || json.data }
        : { success: false, errors: json.data };
      console.log('POST RESULT:', summary);
    } catch {
      console.log('POST RAW:', body.slice(0, 200));
    }
  });

  await page.goto(`${baseUrl}/wp-login.php`);
  await page.locator('#user_login').fill(process.env.WP_PARTNER_USER);
  await page.locator('#user_pass').fill(process.env.WP_PARTNER_PASS);
  await page.locator('#wp-submit').click();
  await page.waitForURL(/wp-admin/);

  await page.goto(`${baseUrl}/wp-admin/options-general.php?page=hoodsly-partners-connector`);
  await page.waitForLoadState('networkidle');

  const apiInput = page.locator('input[placeholder*="Connector Platform API Key" i]').first();
  const before = await apiInput.inputValue();
  console.log('Before save — key length:', before.length);

  await apiInput.clear();
  await apiInput.fill(before);
  await apiInput.press('Tab');
  await page.getByRole('button', { name: /^save$/i }).evaluate((b) => b.click());
  await page.waitForTimeout(5000);

  const after = await page.evaluate(() => ({
    connected: (document.body.innerText.match(/Connected Partner:[^\n]*/i) || [])[0] || null,
    toast: (document.body.innerText.match(/You have successfully connected[^\n]*/i) || [])[0] || null,
    sorry: (document.body.innerText.match(/Sorry![^\n]*/i) || [])[0] || null,
  }));
  console.log('UI AFTER SAVE:', after);

  await browser.close();
}

main().catch(console.error);
