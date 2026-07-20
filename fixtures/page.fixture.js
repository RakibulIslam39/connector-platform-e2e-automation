'use strict';

const path = require('path');
const fs = require('fs');
const { test: base } = require('@playwright/test');

// ── Page objects (only those consumed by active specs) ───────────────────────
const { PartnerFormPage } = require('../pages/connector/partner-form.page');
const { PartnerCleanupPage } = require('../pages/connector/partner-cleanup.page');
const { ProductCreationPage } = require('../pages/connector/product-creation.page');
const { AttributeTypesPage } = require('../pages/connector/attribute-types.page');
const { ConnectorSettingsPage } = require('../pages/partner-site/connector-settings.page');

/**
 * Page fixture — the single source of truth for page-object injection.
 * Every test receives fully-constructed POM instances bound to the test's page
 * context. New page objects should be registered here (not in fixtures/index.js).
 *
 * PartnerProductEditPage / PartnerProductViewPage are constructed directly in the
 * specs/services that need them (against the partner-site page), so they are not
 * registered as fixtures here.
 */
const pageFixture = base.extend({
  // ── Connector Hub (uses the admin storageState from playwright.config) ──────
  partnerFormPage: async ({ page }, use) => use(new PartnerFormPage(page)),
  partnerCleanupPage: async ({ page }, use) => use(new PartnerCleanupPage(page)),
  productCreationPage: async ({ page }, use) => use(new ProductCreationPage(page)),
  attributeTypesPage: async ({ page }, use) => use(new AttributeTypesPage(page)),

  /**
   * Connector settings on the Partner Site. Runs in its own browser context
   * pointed at PARTNER_SITE_BASE_URL so it stays isolated from the Connector Hub
   * admin session. Reuses the persisted partner session (auth-state/partner.json)
   * when present; loginAsPartner() falls back to the wp-login form otherwise.
   */
  connectorSettingsPage: async ({ browser }, use) => {
    const partnerStateFile = path.resolve(__dirname, '../auth-state/partner.json');
    const contextOpts = {
      baseURL: process.env.PARTNER_SITE_BASE_URL,
      ignoreHTTPSErrors: true,
    };
    if (fs.existsSync(partnerStateFile)) {
      contextOpts.storageState = partnerStateFile;
    }
    const context = await browser.newContext(contextOpts);
    const partnerPage = await context.newPage();
    await use(new ConnectorSettingsPage(partnerPage));
    await context.close();
  },
});

module.exports = { pageFixture };
