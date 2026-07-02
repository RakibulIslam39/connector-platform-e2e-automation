'use strict';

/**
 * Codegen-style probe for partner-site DOM selectors used by PARTNER_SITE_SELECTORS.
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

  const pluginsProbe = await page.evaluate(() => ({
    pluginsMenu: !!document.querySelector('#menu-plugins'),
    pluginSearch: document.querySelector('#plugin-search-input')?.id || null,
    postSearch: document.querySelector('#post-search-input')?.id || null,
  }));

  await page.goto(`${baseUrl}/wp-admin/options-general.php?page=hoodsly-partners-connector`);
  await page.waitForLoadState('networkidle');

  const connectorProbe = await page.evaluate(() => {
    const app = document.querySelector('#hoodsly-partners-connector');
    const apiInput = app?.querySelector('input[type="text"], input:not([type="checkbox"])');
    const checkboxes = [...(app?.querySelectorAll('input[type="checkbox"]') || [])].map((el) => ({
      name: el.name,
      id: el.id,
      label: el.closest('label')?.innerText?.slice(0, 80) || null,
    }));
    const connected = (document.body.innerText.match(/Connected Partner:[^\n]*/i) || [])[0];
    return { apiInputName: apiInput?.name, apiInputId: apiInput?.id, checkboxes, connected };
  });

  await page.goto(`${baseUrl}/wp-admin/edit.php?post_type=product`);
  await page.waitForLoadState('domcontentloaded');

  const productsProbe = await page.evaluate(() => ({
    searchInput: document.querySelector('#post-search-input')?.outerHTML?.slice(0, 120) || null,
    firstProduct: document.querySelector('#the-list tr td.title a.row-title')?.textContent?.trim(),
  }));

  console.log(JSON.stringify({ pluginsProbe, connectorProbe, productsProbe }, null, 2));
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
