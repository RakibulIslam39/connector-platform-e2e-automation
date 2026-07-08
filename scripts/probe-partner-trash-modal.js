'use strict';

/**
 * One-off probe: capture Move to Trash / Delete Permanently confirmation modal DOM.
 * Run: node scripts/probe-partner-trash-modal.js
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

require('dotenv').config({ path: path.resolve(__dirname, '../environments/.env.local') });

const BASE_URL = process.env.BASE_URL;
const PARTNER_URL = process.env.PARTNER_SITE_BASE_URL;
const AUTH_STATE = path.resolve(__dirname, '../auth-state/admin.json');
const OUT = path.resolve(__dirname, '../test-results/probe-trash-modal.md');

async function dumpModal(page, label) {
  const snapshot = await page.locator('body').ariaSnapshot();
  const modalCandidates = await page.evaluate(() => {
    const selectors = [
      '[role="dialog"]',
      '[data-headlessui-state="open"]',
      '[class*="modal"]',
      '[class*="Modal"]',
      '[class*="dialog"]',
      '[class*="Dialog"]',
      '[class*="overlay"]',
    ];
    return selectors.flatMap((sel) =>
      Array.from(document.querySelectorAll(sel)).map((el) => ({
        selector: sel,
        text: el.textContent?.trim().slice(0, 500),
        html: el.outerHTML.slice(0, 2000),
      }))
    );
  });
  return `\n## ${label}\n\n### aria snapshot\n\`\`\`\n${snapshot.slice(0, 8000)}\n\`\`\`\n\n### modal candidates\n\`\`\`json\n${JSON.stringify(modalCandidates, null, 2)}\n\`\`\`\n`;
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const context = await browser.newContext({
    storageState: AUTH_STATE,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  let output = `# Partner trash modal probe\n\nPartner URL: ${PARTNER_URL}\n\n`;

  try {
    await page.goto(`${BASE_URL}/wp-admin/admin.php?page=connector-hub#/partners`);
    await page.locator('input[placeholder="Search partners..."]').waitFor({ timeout: 20000 });

    const statusSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Trash' }) }).first();
    await statusSelect.selectOption('All Status').catch(async () => {
      await statusSelect.selectOption({ index: 0 }).catch(() => {});
    });
    await page.waitForTimeout(1200);

    await page.locator('input[placeholder="Search partners..."]').clear();
    await page.waitForTimeout(800);

    const rowToTrash = page.locator('table tbody tr').filter({ hasNotText: 'No partners found' }).first();
    const hasActive = await rowToTrash.isVisible({ timeout: 5000 }).catch(() => false);
    output += `\nUsing first visible partner row (All Status)\n`;

    if (hasActive) {
      const trashBtn = rowToTrash.getByRole('button', { name: /move to trash/i });
      await trashBtn.click();
      await page.waitForTimeout(1000);
      output += await dumpModal(page, 'After Move to Trash click (before confirm)');

      const confirmBtn = page.getByRole('dialog').getByRole('button', { name: /^move to trash$/i });
      const cancelBtn = page.getByRole('dialog').getByRole('button', { name: /^cancel$/i });
      if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        output += `\nConfirm button found: Move to Trash\n`;
        await confirmBtn.click();
        await page.waitForTimeout(1500);
        output += await dumpModal(page, 'After Move to Trash confirm (toast)');
      }
    } else {
      output += `\nNo active partner row for ${PARTNER_URL}\n`;
    }

    // Trash view probe skipped — Delete Permanently modal already captured in prior run.

    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, output);
    console.log(`Probe written to ${OUT}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
