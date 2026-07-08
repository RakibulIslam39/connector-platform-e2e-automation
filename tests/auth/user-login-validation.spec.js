'use strict';

const { test, expect } = require('../../fixtures');
// const { LoginPage } = require('../../pages/auth/login.page');
const { WP_PATHS } = require('../../constants/urls');

test.describe('Scenario 1: User Login Validation', () => {
  // test('TC-AUTH-001: should log in via UI and display correct user profile on Dashboard', async ({
  //   guestPage,
  // }) => {
  //   const loginPage = new LoginPage(guestPage);

  //   await guestPage.goto(`${process.env.BASE_URL}${WP_PATHS.LOGIN}`);
  //   await loginPage.usernameInput.fill(process.env.WP_ADMIN_USER);
  //   await loginPage.passwordInput.fill(process.env.WP_ADMIN_PASS);
  //   await loginPage.submitBtn.click();

  //   await guestPage.waitForURL(/wp-admin/, { timeout: 30000 });
  //   expect(guestPage.url()).toContain('wp-admin');
  //   await expect(loginPage.adminBar).toBeVisible();

  //   const displayName = await loginPage.getUserDisplayName();
  //   expect(displayName).toBe(process.env.WP_ADMIN_DISPLAY_NAME);
  // });

  test('TC-AUTH-002: should confirm authenticated user identity via WordPress REST API', async ({
    page,
  }) => {
    await page.goto(`${process.env.BASE_URL}${WP_PATHS.ADMIN}`);
    await page.waitForLoadState('domcontentloaded');

    // Use page.evaluate() so the fetch runs inside the browser context with
    // session cookies + the WP nonce that WordPress injects into wpApiSettings.
    const userData = await page.evaluate(async () => {
      const nonce = window.wpApiSettings?.nonce ?? '';
      const res = await fetch('/wp-json/wp/v2/users/me?context=edit', {
        headers: { 'X-WP-Nonce': nonce },
      });
      return res.ok ? res.json() : { _status: res.status };
    });

    expect(userData._status).toBeUndefined();
    expect(userData.name).toBe(process.env.WP_ADMIN_DISPLAY_NAME);
    expect(userData.capabilities).toHaveProperty('administrator', true);
  });
});
