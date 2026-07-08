'use strict';

const { chromium } = require('@playwright/test');
require('dotenv').config({ path: 'environments/.env.local' });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const base = process.env.PARTNER_SITE_BASE_URL;

  await page.goto(`${base}/shop/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  const titles = await page
    .locator('.woocommerce-loop-product__title, ul.products li.product .woocommerce-loop-product__title')
    .allTextContents();
  console.log('SHOP_PRODUCTS_COUNT', titles.length);
  console.log('SHOP_SAMPLE', JSON.stringify(titles.slice(0, 5)));

  const dc =
    titles.find((t) => /double curved/i.test(t)) ||
    titles.find((t) => /\d{13,}/.test(t));

  console.log('DOUBLE_CURVED_MATCH', dc || 'none');

  if (dc) {
    await page.getByRole('link', { name: dc, exact: true }).first().click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(4000);

    const h1 = await page.locator('h1.product_title, .product_title').first().textContent();
    console.log('PDP_TITLE', (h1 || '').trim());

    const labels = await page
      .locator('label, legend, .option-label, .tmcp-field-wrap label')
      .allTextContents();
    console.log('PDP_LABELS', JSON.stringify(labels.filter(Boolean).slice(0, 40)));

    const selects = await page.locator('select').evaluateAll((els) =>
      els.map((el) => ({
        name: el.name,
        id: el.id,
        options: [...el.options].slice(0, 10).map((o) => o.text.trim()),
      }))
    );
    console.log('PDP_SELECTS', JSON.stringify(selects, null, 2));

    const radios = await page.locator('input[type=radio]').evaluateAll((els) =>
      els.slice(0, 25).map((el) => ({
        name: el.name,
        value: el.value,
        label: (el.closest('label')?.innerText || el.parentElement?.innerText || '').trim(),
      }))
    );
    console.log('PDP_RADIOS', JSON.stringify(radios.slice(0, 20), null, 2));
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
