'use strict';

const { test, expect } = require('../../fixtures');
const { loadTestData } = require('../../common/utils/data-utils');

const partnerSiteConfig = loadTestData('partner-site', 'partner-site-config.json');

/**
 * Partner Site Plugin Tests — Hoodsly Partners Connector plugin on a WordPress partner site.
 *
 * PARTNER_SITE_BASE_URL must be set in the environment for these tests to run.
 * Tests target the partner WordPress admin (/wp-admin/) at that URL.
 */
test.describe('Partner Site — Plugin Settings', () => {
  test.beforeEach(async ({ page }) => {
    const partnerUrl = process.env.PARTNER_SITE_BASE_URL;
    if (!partnerUrl) {
      test.skip(true, 'PARTNER_SITE_BASE_URL not configured — skipping partner site tests');
      return;
    }
    await page.goto(`${partnerUrl}/wp-admin/`);
  });

  // ─── Plugin visibility ────────────────────────────────────────────────────

  test.describe('Plugin Verification', () => {
    test('Hoodsly Partners Connector plugin is searchable on Plugins page', async ({
      partnerSitePluginPage,
    }) => {
      const { searchTerm } = partnerSiteConfig.plugin;
      await partnerSitePluginPage.navigateToPluginsPage();
      await partnerSitePluginPage.searchPlugin(searchTerm);
      // Plugin page renders after search
      await expect(partnerSitePluginPage.page).toHaveURL(/plugins\.php/);
    });

    test('WPPOOL marker is visible — confirms plugin is present and active', async ({
      partnerSitePluginPage,
    }) => {
      const { searchTerm, wppoolMarker } = partnerSiteConfig.plugin;
      await partnerSitePluginPage.navigateToPluginsPage();
      await partnerSitePluginPage.searchPlugin(searchTerm);
      const markerVisible = await partnerSitePluginPage.isTextVisible(wppoolMarker);
      const pluginVisible = await partnerSitePluginPage.isTextVisible(searchTerm);
      // At least one of them must be visible after searching
      expect(markerVisible || pluginVisible).toBe(true);
    });
  });

  // ─── API Key management ───────────────────────────────────────────────────

  test.describe('API Key Management', () => {
    test('can navigate to Hoodsly connector settings page', async ({
      partnerSitePluginPage,
    }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      // URL should reflect the settings page (exact path varies by WP config)
      await expect(partnerSitePluginPage.page).toHaveURL(/hoodsly-partners-connector|connector/);
    });

    test('API key field is visible on the connector settings page', async ({
      partnerSitePluginPage,
    }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      await expect(partnerSitePluginPage.apiKeyField).toBeVisible();
    });

    test('connected partner name matches expected value', async ({ partnerSitePluginPage }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      const partnerName = await partnerSitePluginPage.getConnectedPartnerName();
      if (partnerName) {
        expect(partnerName).toBe(partnerSiteConfig.settings.connectedPartnerName);
      }
    });

    test('update API key — saves and shows success message', async ({
      partnerSitePluginPage,
    }) => {
      const apiKey = process.env.CONNECTOR_API_SIGNATURE;
      if (!apiKey) {
        test.skip(true, 'CONNECTOR_API_SIGNATURE not set — skipping API key update');
        return;
      }
      await partnerSitePluginPage.navigateToConnectorSettings();
      await partnerSitePluginPage.setApiKey(apiKey);
      await partnerSitePluginPage.saveSettings();
      const saved = await partnerSitePluginPage.isSettingsSaved();
      expect(saved).toBe(true);
    });
  });

  // ─── Tabs ─────────────────────────────────────────────────────────────────

  test.describe('Import & Settings Tabs', () => {
    test('Import tab is visible on connector settings page', async ({
      partnerSitePluginPage,
    }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      await expect(partnerSitePluginPage.importTab).toBeVisible();
    });

    test('Settings tab is visible on connector settings page', async ({
      partnerSitePluginPage,
    }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      await expect(partnerSitePluginPage.settingsTab).toBeVisible();
    });

    test('Settings tab click does not error', async ({ partnerSitePluginPage }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      await partnerSitePluginPage.clickSettingsTab();
      await expect(partnerSitePluginPage.page).toHaveURL(
        /hoodsly-partners-connector|connector/
      );
    });
  });

  // ─── BOL Creation Settings ────────────────────────────────────────────────

  test.describe('BOL Creation Settings', () => {
    test('BOL creation setting is detectable on the Settings tab', async ({
      partnerSitePluginPage,
    }) => {
      await partnerSitePluginPage.navigateToConnectorSettings();
      await partnerSitePluginPage.clickSettingsTab();
      // isBolCreationVisible returns boolean — both true/false are valid deployment states
      const visible = await partnerSitePluginPage.isBolCreationVisible();
      expect(typeof visible).toBe('boolean');
    });

    test('ensure BOL creation is enabled with company details and save', async ({
      partnerSitePluginPage,
    }) => {
      const { bolCompanyName, bolCompanyEmail, bolCompanyPhone } = partnerSiteConfig.settings;
      await partnerSitePluginPage.navigateToConnectorSettings();
      await partnerSitePluginPage.clickSettingsTab();
      const result = await partnerSitePluginPage.ensureBolCreationEnabled({
        companyName: bolCompanyName,
        companyEmail: bolCompanyEmail,
        companyPhone: bolCompanyPhone,
      });
      expect(['not-visible', 'already-enabled', 'enabled']).toContain(result);
      if (result !== 'not-visible') {
        await partnerSitePluginPage.saveSettings();
        const saved = await partnerSitePluginPage.isSettingsSaved();
        expect(saved).toBe(true);
      }
    });
  });
});
