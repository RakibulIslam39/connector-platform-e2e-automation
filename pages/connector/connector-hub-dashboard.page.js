'use strict';

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class ConnectorHubDashboardPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Page heading ────────────────────────────────────────────────────────
    this.pageHeading = page.locator('.cp-dashboard-page h1');
    this.pageSubtitle = page
      .locator('.cp-dashboard-page p')
      .filter({ hasText: 'Overview of your connector platform' });

    // ── Connector Hub in-app nav tabs ────────────────────────────────────────
    // The header also contains the brand link (href="#/dashboard") so filter
    // each tab by its visible label text to avoid strict-mode violations.
    this.dashboardTab = page.locator('header a[href="#/dashboard"]').filter({ hasText: 'Dashboard' });
    this.partnersTab = page.locator('header a[href="#/partners"]').filter({ hasText: 'Partners' });
    this.productsTab = page.locator('header a[href="#/products"]').filter({ hasText: 'Products' });
    this.attributesTab = page.locator('header a[href="#/attributes"]').filter({ hasText: 'Attributes' });
    this.settingsTab = page.locator('header a[href="#/settings"]').filter({ hasText: 'Settings' });
    this.logsTab = page.locator('header a[href="#/logs"]').filter({ hasText: 'Logs' });

    // ── Stat cards ───────────────────────────────────────────────────────────
    // Each card is an <a class="block" href="..."> scoped by the label text to
    // distinguish the two cards that share href="#/attributes".
    this.totalPartnersCard = page
      .locator('a.block[href="#/partners"]')
      .filter({ hasText: 'Total Partners' });
    this.totalProductsCard = page
      .locator('a.block[href="#/products"]')
      .filter({ hasText: 'Total Products' });
    this.attributeTypesCard = page
      .locator('a.block[href="#/attributes"]')
      .filter({ hasText: 'Attribute Types' });
    this.totalAttributesCard = page
      .locator('a.block[href="#/attributes"]')
      .filter({ hasText: 'Total Attributes' });

    // ── Partners by Platform section ─────────────────────────────────────────
    this.partnersByPlatformHeading = page
      .locator('h3')
      .filter({ hasText: 'Partners by Platform' });
    this.partnersByPlatformTotal = page
      .locator('.cp-content-area span')
      .filter({ hasText: /\d+ total/ });

    // ── Quick Actions ─────────────────────────────────────────────────────────
    this.addPartnerLink = page.locator('a[href="#/partners?action=add"]');
    this.addProductLink = page.locator('a[href="#/products?action=add"]');

    // ── Quick Navigation section ──────────────────────────────────────────────
    this.quickNavigationHeading = page
      .locator('h3')
      .filter({ hasText: 'Quick Navigation' });
    this.quickNavPartnersCard = page
      .locator('.cp-dashboard-page a[href="#/partners"]')
      .filter({ hasText: 'Partners' })
      .last();
    this.quickNavProductsCard = page
      .locator('.cp-dashboard-page a[href="#/products"]')
      .filter({ hasText: 'Products' })
      .last();
    this.quickNavAttributesCard = page
      .locator('.cp-dashboard-page a[href="#/attributes"]')
      .filter({ hasText: 'Attributes' })
      .last();
    this.quickNavLogsCard = page.locator('a[href="#/logs"]').filter({ hasText: 'Logs' }).last();

    // ── Settings row ──────────────────────────────────────────────────────────
    this.settingsRow = page.locator('a[href="#/settings"]').filter({ hasText: 'Settings' }).last();
    this.settingsRowSubtext = page.locator('p').filter({ hasText: 'Manage platform settings' });
  }

  async goto() {
    await this.navigate(CONNECTOR_PATHS.DASHBOARD);
    await this.waitForLoad();
  }

  /**
   * Navigates to the Connector Hub Dashboard by clicking the "Dashboard"
   * submenu item under "Connector Hub" in the WP admin sidebar.
   */
  async navigateViaSidebarMenu() {
    logger.info('[ConnectorHubDashboard] Clicking Dashboard in WP sidebar submenu');
    await this.page.locator('#toplevel_page_connector-hub > a').hover();
    await this.page
      .locator('#toplevel_page_connector-hub .wp-submenu a[href="admin.php?page=connector-hub#/dashboard"]')
      .click();
    await this.waitForLoad();
  }

  async waitForLoad() {
    await this.page.waitForSelector('.cp-dashboard-page', { timeout: 15000 });
    // React fetches stat data asynchronously. Poll until the Partners card
    // count contains a real integer (not empty / 0 placeholder).
    await this.page.waitForFunction(
      () => {
        const card = document.querySelector('a.block[href="#/partners"]');
        if (!card) return false;
        const ps = card.querySelectorAll('p');
        const last = ps[ps.length - 1];
        return last && /^\d+$/.test(last.textContent.trim());
      },
      { timeout: 15000 }
    );
    logger.info('[ConnectorHubDashboard] Dashboard loaded');
  }

  /**
   * Reads the numeric count displayed inside a stat card.
   * Uses locator.evaluate() to query the DOM element directly, avoiding
   * CSS class parsing issues with Tailwind utility class names.
   * @param {import('@playwright/test').Locator} cardLocator
   * @returns {Promise<number>}
   */
  async getStatCount(cardLocator) {
    return cardLocator.evaluate((cardEl) => {
      const ps = cardEl.querySelectorAll('p');
      const countP = ps[ps.length - 1];
      return countP ? parseInt(countP.textContent.trim(), 10) : NaN;
    });
  }

  async getTotalPartnersCount() {
    return this.getStatCount(this.totalPartnersCard);
  }

  async getTotalProductsCount() {
    return this.getStatCount(this.totalProductsCard);
  }

  async getAttributeTypesCount() {
    return this.getStatCount(this.attributeTypesCard);
  }

  async getTotalAttributesCount() {
    return this.getStatCount(this.totalAttributesCard);
  }

  /**
   * Returns the "X total" number from the Partners by Platform section.
   * Uses page.evaluate() to reliably locate the span regardless of Tailwind classes.
   * @returns {Promise<number>}
   */
  async getPartnersByPlatformTotal() {
    return this.page.evaluate(() => {
      const span = Array.from(document.querySelectorAll('.cp-content-area span')).find((s) =>
        /^\d+ total$/.test(s.textContent.trim())
      );
      return span ? parseInt(span.textContent.replace(' total', '').trim(), 10) : 0;
    });
  }

  /**
   * Returns platform breakdown data (name, count, percentage) using
   * page.evaluate() since the platform rows use only Tailwind utility classes.
   * DOM structure per row:
   *   div.flex.items-center.gap-3
   *     div (badge)
   *     div.flex-1
   *       div.flex.justify-between        ← nameSpan parent (3 levels up)
   *         span (name)
   *         span (count — digits only)
   *       div (progress bar)
   *     span (percentage — "X%")
   * @returns {Promise<Array<{platform: string, count: number|null, percentage: string|null}>>}
   */
  async getPlatformData() {
    return this.page.evaluate(() => {
      const knownPlatforms = ['WordPress', 'Magento', 'Shopify'];
      return knownPlatforms.map((name) => {
        const nameSpan = Array.from(document.querySelectorAll('.cp-content-area span')).find(
          (s) => s.textContent.trim() === name
        );
        if (!nameSpan) return { platform: name, count: null, percentage: null };

        // span → div.flex.justify-between → div.flex-1 → div.flex.items-center.gap-3
        const row = nameSpan.parentElement?.parentElement?.parentElement;
        if (!row) return { platform: name, count: null, percentage: null };

        const spans = Array.from(row.querySelectorAll('span'));
        const countSpan = spans.find((s) => /^\d+$/.test(s.textContent.trim()));
        const pctSpan = spans.find((s) => /^\d+%$/.test(s.textContent.trim()));

        return {
          platform: name,
          count: countSpan ? parseInt(countSpan.textContent.trim(), 10) : null,
          percentage: pctSpan ? pctSpan.textContent.trim() : null,
        };
      });
    });
  }
}

module.exports = { ConnectorHubDashboardPage };
