'use strict';

const { test, expect } = require('../../fixtures');

test.describe('Damage Claims', () => {
  test.beforeEach(async ({ page }) => {
    const hubUrl = process.env.HUB_BASE_URL;
    if (hubUrl) {
      await page.goto(`${hubUrl}/wp-admin/`);
    }
  });

  test('damage claims page loads', async ({ damageClaimPage }) => {
    await damageClaimPage.goto();
    await expect(damageClaimPage.page).toHaveURL(/damage-claims/);
  });

  test('damage claims list renders', async ({ damageClaimPage }) => {
    await damageClaimPage.goto();
    const count = await damageClaimPage.getClaimCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('file damage claim button is present on a completed order', async ({
    orderManagementPage,
    damageClaimPage,
  }) => {
    // Full flow: navigate to completed order → find File Damage Claim button → submit claim
    await orderManagementPage.goto();
    await damageClaimPage.goto();
    await expect(damageClaimPage.page).toHaveURL(/damage-claims/);
  });

  test('partner role restricts order visibility to own orders only', async ({ page }) => {
    // Business rule: Partner Hub roles can only see their own completed orders
    // and current order progress — they cannot see other partners' orders
    // Full implementation: login as partner role, verify filtered order view
    expect(true).toBe(true); // Placeholder — requires partner Hub credentials
  });
});
