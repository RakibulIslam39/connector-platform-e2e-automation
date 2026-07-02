'use strict';

/**
 * Codegen-style probe for Hoodsly Partners Connector → Import tab.
 * Captures role-based selectors matching playwright codegen output.
 */

require('dotenv').config({ path: 'environments/.env.local' });
const { chromium } = require('playwright');

async function main() {
  const baseUrl = process.env.PARTNER_SITE_BASE_URL;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${baseUrl}/wp-login.php`);
  await page.locator('#user_login').fill(process.env.WP_PARTNER_USER);
  await page.locator('#user_pass').fill(process.env.WP_PARTNER_PASS);
  await page.locator('#wp-submit').click();
  await page.waitForURL(/wp-admin/);

  await page.goto(`${baseUrl}/wp-admin/options-general.php?page=hoodsly-partners-connector`);
  await page.waitForLoadState('networkidle');

  const app = page.locator('#hoodsly-partners-connector');

  // Codegen: click Import tab
  await app.getByRole('link', { name: 'Import' }).click();
  await page.waitForTimeout(1500);

  const snapshot = await page.evaluate(() => {
    const root = document.querySelector('#hoodsly-partners-connector');
    if (!root) return { error: 'app root missing' };

    const roles = [];
    root.querySelectorAll('[role], input[type="checkbox"], button, a').forEach((el) => {
      const text = (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 120);
      if (!text && el.tagName !== 'INPUT') return;
      roles.push({
        tag: el.tagName,
        role: el.getAttribute('role') || el.type || '',
        text,
        checked: el.checked ?? null,
        visible: !!(el.offsetWidth || el.offsetHeight),
      });
    });

    return {
      bodyText: (root.innerText || '').slice(0, 800),
      roles,
    };
  });

  console.log('IMPORT TAB SNAPSHOT:\n', JSON.stringify(snapshot, null, 2));

  const terms = app.getByRole('checkbox', {
    name: /I accept the Terms and Conditions and MAP Policy/i,
  });
  console.log('Terms checkbox count:', await terms.count());
  console.log('Terms visible:', await terms.first().isVisible().catch(() => false));

  const importBtn = app.getByRole('button', { name: /^Import$/i });
  console.log('Import button count:', await importBtn.count());

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
