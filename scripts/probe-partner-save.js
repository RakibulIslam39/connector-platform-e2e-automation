'use strict';

require('dotenv').config({ path: 'environments/.env.local' });
const { chromium } = require('playwright');

async function main() {
  const baseUrl = process.env.PARTNER_SITE_BASE_URL;
  const apiKey = process.argv[2];
  if (!apiKey) throw new Error('Usage: node scripts/probe-partner-save.js <apiKey>');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  page.on('response', async (resp) => {
    const url = resp.url();
    if (!/wp-json|connector|hoodsly|admin-ajax/i.test(url)) return;
    let body = '';
    try {
      body = (await resp.text()).slice(0, 500);
    } catch {
      body = '(unreadable)';
    }
    console.log(`[HTTP ${resp.status()}] ${url}\n  ${body}\n`);
  });

  await page.goto(`${baseUrl}/wp-login.php`);
  await page.locator('#user_login').fill(process.env.WP_PARTNER_USER);
  await page.locator('#user_pass').fill(process.env.WP_PARTNER_PASS);
  await page.locator('#wp-submit').click();
  await page.waitForURL(/wp-admin/i);

  await page.goto(`${baseUrl}/wp-admin/options-general.php?page=hoodsly-partners-connector`);
  await page.waitForLoadState('networkidle');

  const before = await page.evaluate(() => document.body.innerText);
  console.log('BEFORE connected line:', (before.match(/Connected Partner:[^\n]*/i) || [])[0] || '(none)');

  const apiInput = page.locator('input[placeholder*="Connector Platform API Key" i]').first();
  await apiInput.clear();
  await apiInput.fill(apiKey);
  await apiInput.press('Tab');

  const saveBtn = page.getByRole('button', { name: /^save$/i });
  console.log('Save visible:', await saveBtn.isVisible());

  await saveBtn.click();
  await page.waitForTimeout(3000);

  const alerts = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[role="alert"], [role="status"], [class*="toast"], [class*="notification"]');
    return Array.from(nodes).map((el) => ({
      tag: el.tagName,
      role: el.getAttribute('role'),
      className: el.className,
      text: (el.textContent || '').trim(),
      visible: !!(el.offsetWidth || el.offsetHeight),
    }));
  });
  console.log('ALERTS:', JSON.stringify(alerts, null, 2));

  const after = await page.evaluate(() => document.body.innerText);
  console.log('AFTER connected line:', (after.match(/Connected Partner:[^\n]*/i) || [])[0] || '(none)');
  console.log('AFTER toast line:', (after.match(/You have successfully connected[^\n]*/i) || [])[0] || '(none)');

  await page.waitForTimeout(5000);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
