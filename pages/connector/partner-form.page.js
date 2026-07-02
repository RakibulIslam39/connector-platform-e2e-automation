'use strict';

/**
 * PartnerFormPage — Complete POM for the Partner Creation / Edit form.
 *
 * Covers all six sections of the Connector Hub SPA partner form:
 *   1. Basic Info    (name, type, URL, API key, status, color style, SKU prefix, platform, hub key, env)
 *   2. Products      (Add Products modal, add all, Double Curved custom title)
 *   3. Attributes    (Partner Colors + Custom Color Match + Select All,
 *                     Catalog Filter validation, Primed/Paint Ready,
 *                     Ventilations, Trims, Sizes)
 *   4. Billing       (Billing Model, Shipping Paid By)
 *   5. FAQs          (Add FAQ, title, answer, Done)
 *   6. Shipping      (Add Policy, title, description)
 *
 * Navigation entry point:
 *   Dashboard → Quick Actions → Add Partner link (#/partners?action=add)
 */

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const { assertClipboardToast, getVisibleNotificationText } = require('../../common/utils/notification-validator');
const logger = require('../../common/utils/logger');
const { parseHubProductButtonText } = require('../../common/utils/product-sku-utils');

class PartnerFormPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);

    // ── Tab navigation ────────────────────────────────────────────────────────
    this.basicInfoTab = page.getByRole('button', { name: 'Basic Info' });
    this.productsTab = page.getByRole('button', { name: 'Products' });
    this.attributesTab = page.getByRole('button', { name: 'Attributes' });
    this.billingTab = page.getByRole('button', { name: 'Billing' });
    this.faqsShippingTab = page.getByRole('button', { name: 'FAQs & Shipping' });

    // ── Basic Info fields ─────────────────────────────────────────────────────
    this.partnerNameInput = page.locator('input[placeholder="Enter partner name"]');
    this.websiteUrlInput = page.locator('input[placeholder="https://example.com"]');
    this.skuPrefixInput = page.locator('input[placeholder="e.g., HS-"]');
    this.hubApiKeyInput = page.locator('input[placeholder="Paste the key from HoodslyHub"]');
    this.apiKeyInput = page.locator('input[placeholder="API key will be auto-generated"]');
    this.generateApiKeyBtn = page.getByRole('button', { name: 'Generate' });
    this.copyApiKeyBtn = page.getByRole('button', { name: 'Copy' });

    // ── Partner Type radios ───────────────────────────────────────────────────
    this.partnerTypeB2C = page.getByRole('radio', { name: 'B2C' });
    this.partnerTypeB2B = page.getByRole('radio', { name: 'B2B' });

    // ── Color Style radios ────────────────────────────────────────────────────
    this.colorStyleSelect = page.getByRole('radio', { name: 'Select' });
    this.colorStyleSwatch = page.getByRole('radio', { name: 'Swatch' });

    // ── Status select ─────────────────────────────────────────────────────────
    this.statusSelect = page
      .locator('select')
      .filter({ has: page.getByRole('option', { name: 'Draft' }) })
      .first();

    // ── Platform Type select ──────────────────────────────────────────────────
    this.platformTypeSelect = page
      .locator('select')
      .filter({ has: page.getByRole('option', { name: 'WordPress' }) })
      .first();

    // ── Environment select ────────────────────────────────────────────────────
    this.environmentSelect = page
      .locator('select')
      .filter({ has: page.getByRole('option', { name: 'Staging' }) })
      .first();

    // ── Products tab ──────────────────────────────────────────────────────────
    this.addProductsBtn = page.getByRole('button', { name: 'Add Products' });

    // ── Billing tab ───────────────────────────────────────────────────────────
    this.billingModelSelect = page
      .locator('select')
      .filter({ has: page.getByRole('option', { name: 'Distro' }) })
      .first();
    this.partnerPaysShippingRadio = page.getByRole('radio', {
      name: /partner pays shipping/i,
    });

    // ── FAQs & Shipping tab ───────────────────────────────────────────────────
    this.addFaqBtn = page.getByRole('button', { name: 'Add FAQ' });
    this.addPolicyBtn = page.getByRole('button', { name: 'Add Policy' });

    // ── Submit ────────────────────────────────────────────────────────────────
    // Two "Create Partner" buttons exist: one in the top nav bar (type="button", smaller padding)
    // and one at the bottom of the form (type="submit", larger padding). Use .last() to always
    // target the bottom form-submission button regardless of DOM order changes.
    this.createPartnerBtn = page.getByRole('button', { name: 'Create Partner' }).last();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Navigates directly to the Add Partner URL in the SPA.
   */
  async gotoAddPartner() {
    logger.info('[PartnerFormPage] Navigating to Add Partner');
    await this.navigate(CONNECTOR_PATHS.PARTNER_CREATE);
    await this.partnerNameInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Navigates via Dashboard Quick Actions "Add Partner" link.
   * Use this when the spec starts from the Connector Hub Dashboard.
   */
  async navigateToAddPartnerViaQuickActions() {
    logger.info('[PartnerFormPage] Navigating via Dashboard Quick Actions → Add Partner');
    await this.navigate(CONNECTOR_PATHS.DASHBOARD);
    await this.page.waitForLoadState('domcontentloaded');
    const addPartnerLink = this.page.getByRole('link', { name: 'Add Partner' }).first();
    await addPartnerLink.waitFor({ state: 'visible', timeout: 15000 });
    await addPartnerLink.click();
    await this.partnerNameInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Basic Info Tab
  // ═══════════════════════════════════════════════════════════════════════════

  async _ensureBasicInfoTab() {
    await this.basicInfoTab.click();
    await this.partnerNameInput.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fills the Partner Name field.
   * @param {string} name
   */
  async fillPartnerName(name) {
    await this._ensureBasicInfoTab();
    await this.partnerNameInput.clear();
    await this.partnerNameInput.fill(name);
    logger.info(`[PartnerFormPage] Filled partner name: ${name}`);
  }

  /**
   * Selects Partner Type radio button.
   * @param {'B2C'|'B2B'} type
   */
  async selectPartnerType(type) {
    if (type.toUpperCase() === 'B2C') {
      await this.partnerTypeB2C.check();
    } else {
      await this.partnerTypeB2B.check();
    }
    logger.info(`[PartnerFormPage] Selected partner type: ${type}`);
  }

  /**
   * Fills the Website URL field.
   * @param {string} url
   */
  async fillWebsiteUrl(url) {
    await this.websiteUrlInput.clear();
    await this.websiteUrlInput.fill(url);
    logger.info(`[PartnerFormPage] Filled website URL: ${url}`);
  }

  /**
   * Clicks Generate to create a new API key, then clicks Copy.
   * Validates the "API key copied to clipboard." popup.
   * Returns the generated API key string.
   *
   * @returns {Promise<string>} The generated API key value
   */
  async generateAndCopyApiKey() {
    logger.info('[PartnerFormPage] Generating API key');
    await this.generateApiKeyBtn.click();
    await this.page.waitForTimeout(800);

    const apiKey = await this.apiKeyInput.inputValue();

    logger.info('[PartnerFormPage] Copying API key to clipboard');
    await this.copyApiKeyBtn.click();

    await assertClipboardToast(this.page);

    logger.info(`[PartnerFormPage] API key generated and copied: ${apiKey.substring(0, 8)}...`);
    return apiKey;
  }

  /**
   * Opens the edit form for a partner and reads the persisted API key from Basic Info.
   * Use after Create Partner — the key shown on the add form may differ from the saved value.
   *
   * @param {string} partnerName
   * @returns {Promise<string>}
   */
  async readStoredApiKeyForPartner(partnerName) {
    await this.navigate(CONNECTOR_PATHS.PARTNERS);

    const searchInput = this.page.locator('input[placeholder="Search partners..."]');
    await searchInput.waitFor({ state: 'visible', timeout: 20000 });
    await searchInput.fill(partnerName);
    await this.page.waitForTimeout(800);

    const row = this.page.locator('table tbody tr').filter({ hasText: partnerName }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.getByRole('link', { name: 'Edit' }).click();
    await this.page.getByRole('heading', { name: 'Edit Partner' }).waitFor({ state: 'visible', timeout: 20000 });
    await this.basicInfoTab.click();

    await this.apiKeyInput.waitFor({ state: 'visible', timeout: 20000 });
    const apiKey = (await this.apiKeyInput.inputValue()).trim();
    if (!apiKey) {
      throw new Error(`[PartnerFormPage] API key empty on edit form for: ${partnerName}`);
    }

    logger.info(`[PartnerFormPage] Read stored API key for ${partnerName}: ${apiKey.substring(0, 8)}...`);
    return apiKey;
  }

  /**
   * Selects the Status dropdown option.
   * @param {'Active'|'Draft'|'Inactive'} status
   */
  async selectStatus(status) {
    await this.statusSelect.selectOption({ label: status });
    logger.info(`[PartnerFormPage] Selected status: ${status}`);
  }

  /**
   * Selects Partner Colors Style radio.
   * Idempotent — skips if already selected.
   * @param {'Select'|'Swatch'} style
   */
  async selectColorStyle(style) {
    if (style === 'Swatch') {
      if (!(await this.colorStyleSwatch.isChecked())) {
        await this.colorStyleSwatch.check();
      }
    } else {
      if (!(await this.colorStyleSelect.isChecked())) {
        await this.colorStyleSelect.check();
      }
    }
    logger.info(`[PartnerFormPage] Set color style: ${style}`);
  }

  /**
   * Fills the SKU Prefix field.
   * @param {string} prefix
   */
  async fillSkuPrefix(prefix) {
    await this.skuPrefixInput.clear();
    await this.skuPrefixInput.fill(prefix);
    logger.info(`[PartnerFormPage] Filled SKU prefix: ${prefix}`);
  }

  /**
   * Selects the Platform Type dropdown option.
   * @param {'WordPress'|'Shopify'|'Magento'} platform
   */
  async selectPlatformType(platform) {
    await this.platformTypeSelect.selectOption({ label: platform });
    logger.info(`[PartnerFormPage] Selected platform type: ${platform}`);
  }

  /**
   * Fills the Hub API Key field.
   * @param {string} key
   */
  async fillHubApiKey(key) {
    await this.hubApiKeyInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.hubApiKeyInput.clear();
    await this.hubApiKeyInput.fill(key);
    logger.info('[PartnerFormPage] Filled Hub API key');
  }

  /**
   * Selects the Environment dropdown option.
   * @param {'Staging'|'Production'} env
   */
  async selectEnvironment(env) {
    await this.environmentSelect.selectOption({ label: env });
    logger.info(`[PartnerFormPage] Selected environment: ${env}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Products Tab
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clicks the Products tab and waits for the "Add Products" button to be visible.
   * This confirms the main products list view is rendered (not the inline add panel).
   */
  async _openProductsTab() {
    await this.productsTab.click();
    await this.addProductsBtn.waitFor({ state: 'visible', timeout: 10000 });
    logger.info('[PartnerFormPage] Opened Products tab');
  }

  /**
   * Adds ALL available products.
   *
   * UI behaviour (confirmed from page snapshot):
   *   - Clicking "Add Products" opens an inline search panel within the Products tab.
   *   - Each available product is rendered as a single <button> element whose
   *     accessible name contains the product name + SKU (e.g. "VEN-DBC").
   *   - Clicking a product button adds it and removes it from the available list.
   *   - After all products are added, clicking "Cancel" closes the inline panel
   *     and returns to the selected-products list view.
   *
   * @returns {Promise<{ count: number, products: Array<{ catalogName: string, catalogSku: string, customTitle?: string|null }> }>}
   */
  async addAllProducts() {
    await this._openProductsTab();
    logger.info('[PartnerFormPage] Opening Add Products panel');

    const selectedProducts = [];
    let clickCount = 0;
    const MAX_ATTEMPTS = 2;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      if (attempt > 1) {
        logger.warn('[PartnerFormPage] Retrying Add Products — panel may not have loaded');
        const cancelPanelBtn = this.page.getByRole('button', { name: 'Cancel' }).first();
        if (await cancelPanelBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          await cancelPanelBtn.click();
          await this.page.waitForTimeout(500);
        }
        await this._openProductsTab();
        await this.page.waitForTimeout(1000);
      }

      await this.addProductsBtn.waitFor({ state: 'visible', timeout: 15000 });
      await this.addProductsBtn.click();

      const searchInput = this.page.locator('input[placeholder="Search products..."]');
      const panelReady = await searchInput
        .waitFor({ state: 'visible', timeout: 10000 })
        .then(() => true)
        .catch(() => false);
      if (!panelReady) continue;

      const availableBtn = () =>
        this.page.getByRole('button').filter({ hasText: /VEN-/ }).first();

      clickCount = 0;
      selectedProducts.length = 0;
      const MAX_PRODUCTS = 200;

      while (clickCount < MAX_PRODUCTS) {
        const btn = availableBtn();
        const visible = await btn.isVisible({ timeout: 1000 }).catch(() => false);
        if (!visible) break;

        const btnText = (await btn.textContent()) || '';
        const parsed = parseHubProductButtonText(btnText);
        logger.info(`[PartnerFormPage] Adding product: ${parsed.catalogName} (${parsed.catalogSku})`);
        selectedProducts.push({ ...parsed, customTitle: null });
        await btn.click();
        await this.page.waitForTimeout(250);
        clickCount++;
      }

      if (clickCount > 0) break;
    }

    logger.info(`[PartnerFormPage] Added ${clickCount} products`);

    const cancelPanelBtn = this.page.getByRole('button', { name: 'Cancel' }).first();
    if (await cancelPanelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelPanelBtn.click();
      await this.page.waitForTimeout(500);
    }

    return { count: clickCount, products: selectedProducts };
  }

  /**
   * Sets the Custom Title for a specific product (e.g. "Double Curved") in the
   * selected-products list.
   *
   * Must be called AFTER addAllProducts() has been called and the inline panel closed.
   * The selected-products list shows each product row with an optional custom title input.
   *
   * @param {string} productName - Visible product name in the selected list
   * @param {string} customTitle - Value to enter into the custom title input
   */
  async setProductCustomTitle(productName, customTitle) {
    logger.info(`[PartnerFormPage] Setting custom title for: ${productName}`);

    // Ensure the inline Add Products panel is closed (Cancel if still visible)
    const cancelPanelBtn = this.page.getByRole('button', { name: 'Cancel' }).first();
    if (await cancelPanelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelPanelBtn.click();
      await this.page.waitForTimeout(400);
    }

    // Find the selected product row by its product name text
    const row = this.page
      .locator('div, tr, li')
      .filter({ hasText: new RegExp(productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') })
      .filter({
        // Exclude rows that also contain VEN- (those are still in the available list)
        hasNot: this.page.locator('button').filter({ hasText: /VEN-/ }),
      })
      .first();

    // Fallback: wider search if the filtered row is not found
    const simpleRow = this.page
      .locator('div, tr, li')
      .filter({ hasText: productName })
      .last();

    let targetRow = row;
    if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) {
      targetRow = simpleRow;
    }

    await targetRow.waitFor({ state: 'visible', timeout: 10000 });

    // Find the custom title input within the row
    const titleInput = targetRow
      .locator('input[placeholder*="title" i], input[placeholder*="custom" i], input[placeholder*="name" i], input[type="text"]')
      .first();

    if (await titleInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await titleInput.clear();
      await titleInput.fill(customTitle);
      logger.info(`[PartnerFormPage] Set custom title "${customTitle}" for ${productName}`);
    } else {
      logger.warn(`[PartnerFormPage] Custom title input not found for ${productName} — row may not have this field`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Attributes Tab — Partner Colors
  // ═══════════════════════════════════════════════════════════════════════════

  async _openAttributesTab() {
    // Guard: if the Attributes tab content is already rendered (accordion section heading
    // is visible), clicking the tab button again would force a SPA re-render that
    // collapses all expanded accordions. Skip the click when already active.
    const alreadyActive = await this.page
      .getByText('Available Attributes', { exact: true })
      .isVisible({ timeout: 500 })
      .catch(() => false);

    if (alreadyActive) {
      logger.info('[PartnerFormPage] Attributes tab already active — skipping click');
      return;
    }

    await this.attributesTab.click();
    // Wait for the tab content heading to appear (confirms SPA render completed)
    await this.page
      .getByText('Available Attributes', { exact: true })
      .waitFor({ state: 'visible', timeout: 10000 });
    logger.info('[PartnerFormPage] Opened Attributes tab');
  }

  /**
   * Expands an accordion section by its visible label text.
   *
   * UI structure (confirmed from page snapshot):
   *   Each accordion row is a plain div (cursor:pointer) containing:
   *     - a nested div with the label text in a child generic element
   *     - an img (chevron icon) as a direct sibling of the label container
   *   After expansion, additional content (inputs, color grids, etc.) appears below.
   *
   * Strategy: click the accordion row's label text. The click bubbles up to the row's
   * handler and expands the section. We then wait for any input/checkbox to become
   * visible as confirmation the expanded content has loaded.
   *
   * @param {string} label - Visible text label, e.g. 'Partner Colors'
   */
  async _expandAccordion(label) {
    // The label text is in a nested generic/div inside the accordion row.
    // The accordion row text contains "{label}  N selected" combined, but the direct
    // text element has only "{label}". Click using exact-quoted text= syntax.
    const labelEl = this.page.locator(`text="${label}"`).first();
    await labelEl.waitFor({ state: 'visible', timeout: 15000 });

    // ── Idempotency guard ────────────────────────────────────────────────────
    // If the accordion is already expanded, clicking would toggle it CLOSED.
    // Detect expansion by checking whether the accordion header's next DOM sibling
    // contains checkboxes (the content div only exists when expanded).
    const isAlreadyExpanded = await this.page.evaluate((searchLabel) => {
      // Find the innermost element with EXACTLY the label text (no extra children text)
      const allEls = Array.from(document.querySelectorAll('div, span, p'));
      for (const el of allEls) {
        if (el.textContent.trim() !== searchLabel) continue;

        // Walk up to find the OUTERMOST cursor:pointer ancestor.
        // NOTE: cursor is an inherited CSS property — children of a [cursor:pointer] div
        // also report cursor:pointer via getComputedStyle. We must continue walking up
        // until the PARENT no longer has cursor:pointer to find the true accordion header.
        let cursor = null;
        let outerHeader = null;
        let node = el;
        while (node && node !== document.body) {
          const parentCur = node.parentElement
            ? window.getComputedStyle(node.parentElement).cursor
            : 'auto';
          const nodeCur = window.getComputedStyle(node).cursor;
          if (nodeCur === 'pointer' && parentCur !== 'pointer') {
            // node is the outermost cursor:pointer element in this chain
            outerHeader = node;
            break;
          }
          node = node.parentElement;
        }

        if (!outerHeader) continue;

        // The accordion content appears as the next sibling of the header div.
        // If it contains checkboxes the section is currently expanded.
        const sibling = outerHeader.nextElementSibling;
        if (sibling) {
          const hasCheckboxes = sibling.querySelectorAll(
            'input[type="checkbox"], [role="checkbox"]'
          ).length > 0;
          if (hasCheckboxes) return true;
        }
      }
      return false;
    }, label).catch(() => false);

    if (isAlreadyExpanded) {
      logger.info(`[PartnerFormPage] Accordion "${label}" already expanded — skipping click`);
      return;
    }
    // ── Click to expand ──────────────────────────────────────────────────────
    const chevronImg = this.page
      .locator('div')
      .filter({ hasText: new RegExp(`^${label}\\s`) })
      .locator('img')
      .first();

    const imgVisible = await chevronImg.isVisible({ timeout: 1000 }).catch(() => false);
    if (imgVisible) {
      await chevronImg.click();
    } else {
      await labelEl.click();
    }

    // Wait for accordion animation + content render
    await this.page.waitForTimeout(800);
    logger.info(`[PartnerFormPage] Expanded accordion: ${label}`);
  }

  /**
   * Opens the Partner Colors accordion section.
   */
  async openPartnerColorsSection() {
    await this._openAttributesTab();
    await this._expandAccordion('Partner Colors');
    logger.info('[PartnerFormPage] Opened Partner Colors section');
  }

  /**
   * Enables the "Custom Color Match" switch/toggle inside the expanded Partner Colors accordion.
   *
   * DOM structure (confirmed from page snapshot):
   *   switch [role="switch"] — the toggle control
   *   paragraph: "Custom Color Match"
   *   paragraph: description text
   * The switch role is targeted directly via getByRole('switch').
   */
  async enableCustomColorMatch() {
    // Wait for the label to confirm the accordion is expanded
    const labelEl = this.page.getByText('Custom Color Match').first();
    await labelEl.waitFor({ state: 'visible', timeout: 10000 });

    // The toggle is a switch role element (not a checkbox or button[role="switch"])
    const toggleSwitch = this.page.getByRole('switch').first();
    const ariaChecked = await toggleSwitch.getAttribute('aria-checked').catch(() => 'false');
    const isEnabled = ariaChecked === 'true';

    if (!isEnabled) {
      await toggleSwitch.click();
      await this.page.waitForTimeout(400);
    }

    logger.info('[PartnerFormPage] Custom Color Match enabled');
  }

  /**
   * Clicks the "Select All" checkbox within the Partner Colors section to select all colors.
   *
   * DOM structure (confirmed from page snapshot):
   *   generic [cursor=pointer]:
   *     checkbox "Select All"   ← role=checkbox, NOT button
   *     generic: "Select All"
   *
   * @returns {Promise<string[]>} All color names that were selected
   */
  async clickSelectAllColors() {
    // "Select All" is a checkbox element (confirmed from page snapshot), not a button
    const selectAllCheckbox = this.page
      .getByRole('checkbox', { name: /select all/i })
      .first();

    await selectAllCheckbox.waitFor({ state: 'visible', timeout: 10000 });

    const isChecked = await selectAllCheckbox.isChecked().catch(() => false);
    if (!isChecked) {
      await selectAllCheckbox.click();
      await this.page.waitForTimeout(600);
    }

    logger.info('[PartnerFormPage] Clicked Select All colors');
    return this._getSelectedColorNames();
  }

  /**
   * Reads the names of all currently selected colors in the Partner Colors color table.
   *
   * Table structure: checkbox | Color | Catalog | Custom Name | Current Price | Custom Price | Custom Distro Price
   * Checked rows have a checked checkbox in the first data cell.
   *
   * @returns {Promise<string[]>}
   */
  async _getSelectedColorNames() {
    // Color table rows: each has a checkbox in the first cell, color name in the second
    const checkedRows = this.page.locator(
      'table tbody tr:has(input[type="checkbox"]:checked), table tbody tr:has([role="checkbox"][aria-checked="true"])'
    );
    const names = [];
    const count = await checkedRows.count();
    for (let i = 0; i < count; i++) {
      // Color name is in the second cell (td:nth-child(2))
      const nameCell = checkedRows.nth(i).locator('td').nth(1);
      const text = (await nameCell.textContent()) || '';
      if (text.trim()) names.push(text.trim());
    }
    return names;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Attributes Tab — Catalog Filter Validation
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns all option values from the "Filter by Catalog" dropdown.
   * @returns {Promise<string[]>}
   */
  async getFilterByCatalogOptions() {
    const select = this.page
      .locator('select')
      .filter({ has: this.page.locator('option').filter({ hasText: /catalog|filter/i }) })
      .first();

    // Fall back to a labeled select
    const filterSelect = this.page
      .locator('[aria-label*="catalog" i], [aria-label*="filter" i], select')
      .filter({ has: this.page.getByText(/filter by catalog/i).locator('..') })
      .first();

    const options = await select.locator('option').allTextContents().catch(async () => {
      return filterSelect.locator('option').allTextContents();
    });

    return options.map((o) => o.trim()).filter(Boolean);
  }

  /**
   * Selects a catalog filter option by value/label.
   * @param {string} option
   */
  async selectCatalogFilter(option) {
    const select = this.page.locator('select').filter({
      has: this.page.locator('option').filter({ hasText: option }),
    }).first();
    await select.selectOption({ label: option });
    await this.page.waitForTimeout(600);
    logger.info(`[PartnerFormPage] Selected catalog filter: ${option}`);
  }

  /**
   * Reads all visible catalog column values from the colors/products table.
   * @returns {Promise<string[]>} Array of catalog cell texts (trimmed)
   */
  async getVisibleCatalogColumnValues() {
    // Catalog is the 3rd column: td(1)=checkbox|td(2)=Color|td(3)=Catalog
    // Use nth(2) (0-based index) within each row's td set
    const rows = this.page.locator('table tbody tr');
    const count = await rows.count();
    const values = [];
    for (let i = 0; i < count; i++) {
      const cell = rows.nth(i).locator('td').nth(2);
      const text = (await cell.textContent()) || '';
      values.push(text.trim());
    }
    return values;
  }

  /**
   * Validates the "Filter by Catalog" dropdown behavior.
   *
   * Rules:
   *   - "All Catalogs": no per-row assertion (shows everything) — just select and move on.
   *   - Specific catalog (e.g. "USCD"): rows with "—" or empty catalog are special
   *     (Raw / Unfinished, Primed / Paint Ready) and appear in every filter view — skip them.
   *     Non-special rows must have a catalog value that contains the filter keyword.
   *   - After iteration, reset to "All Catalogs" so the Primed row is visible for
   *     subsequent steps.
   *
   * Uses expect.soft() so all failures are collected without aborting.
   *
   * @param {import('@playwright/test').expect} expect - Playwright expect function
   */
  async validateCatalogFilter(expect) {
    const options = await this.getFilterByCatalogOptions();
    logger.info(`[PartnerFormPage] Validating catalog filters: ${options.join(', ')}`);

    for (const option of options) {
      await this.selectCatalogFilter(option);

      // "All Catalogs" shows every row — no specific catalog column assertion needed
      if (option === 'All Catalogs') continue;

      const catalogValues = await this.getVisibleCatalogColumnValues();
      const keyword = option.toLowerCase().split(/[\s/]/)[0]; // first word of the option

      for (const value of catalogValues) {
        // Special rows (Raw / Unfinished, Primed / Paint Ready) always show "—" regardless
        // of the selected catalog filter — skip them from validation
        if (value === '—' || value.trim() === '') continue;

        expect
          .soft(value.toLowerCase(), `Catalog filter: "${option}" | Row catalog: "${value}"`)
          .toContain(keyword);
      }
    }

    // Always reset to "All Catalogs" so all rows (including Primed) remain visible
    await this.selectCatalogFilter('All Catalogs');
    logger.info('[PartnerFormPage] Catalog filter validation complete — reset to All Catalogs');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Attributes Tab — Primed / Paint Ready
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Locates the "Primed / Paint Ready" row in the colors table.
   * @returns {import('@playwright/test').Locator}
   */
  _getPrimedRow() {
    return this.page
      .locator('table tbody tr, [class*="product-row"]')
      .filter({ hasText: /primed.*paint.*ready/i })
      .first();
  }

  /**
   * Reads the Current Price value from the Primed / Paint Ready row.
   *
   * Color table column order (confirmed from page snapshot):
   *   td(1)=checkbox | td(2)=Color | td(3)=Catalog | td(4)=Custom Name | td(5)=Current Price |
   *   td(6)=Custom Price | td(7)=Custom Distro Price
   *
   * @returns {Promise<string>} Raw price text (e.g. "$50.00")
   */
  async getPrimedRowCurrentPrice() {
    const row = this._getPrimedRow();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    // Current Price is the 5th td (1-based: checkbox|Color|Catalog|CustomName|CurrentPrice)
    const priceCell = row.locator('td').nth(4); // 0-based index 4 = 5th column
    const text = (await priceCell.textContent()) || '';
    logger.info(`[PartnerFormPage] Primed/Paint Ready current price: ${text.trim()}`);
    return text.trim();
  }

  /**
   * Fills the Custom Name input for the Primed / Paint Ready row.
   * The row checkbox must already be checked (e.g. via Select All) for this input to be enabled.
   * @param {string} name
   */
  async fillPrimedCustomName(name) {
    const row = this._getPrimedRow();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    // Custom Name textbox is in td(4) (0-based index 3)
    const nameInput = row.locator('td').nth(3).locator('input[type="text"], textbox').first();
    await nameInput.waitFor({ state: 'visible', timeout: 8000 });
    await nameInput.clear();
    await nameInput.fill(name);
    logger.info(`[PartnerFormPage] Set Primed/Paint Ready custom name: ${name}`);
  }

  /**
   * Fills the Custom Price input for the Primed / Paint Ready row.
   * The row checkbox must already be checked (e.g. via Select All) for this input to be enabled.
   * @param {number|string} price
   */
  async fillPrimedCustomPrice(price) {
    const row = this._getPrimedRow();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    // Custom Price spinbutton is in td(6) (0-based index 5)
    const priceInput = row.locator('td').nth(5).locator('input[type="number"], [role="spinbutton"]').first();
    await priceInput.waitFor({ state: 'visible', timeout: 8000 });
    await priceInput.clear();
    await priceInput.fill(String(price));
    logger.info(`[PartnerFormPage] Set Primed/Paint Ready custom price: ${price}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Attributes Tab — Ventilations / Trims / Sizes
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Opens the Partner Ventilations accordion.
   */
  async openVentilationsSection() {
    await this._openAttributesTab();
    await this._expandAccordion('Partner Ventilations');
    logger.info('[PartnerFormPage] Opened Partner Ventilations section');
  }

  /**
   * Opens the Partner Trims accordion.
   */
  async openTrimsSection() {
    await this._openAttributesTab();
    await this._expandAccordion('Partner Trims');
    logger.info('[PartnerFormPage] Opened Partner Trims section');
  }

  /**
   * Opens the Partner Sizes accordion.
   */
  async openSizesSection() {
    await this._openAttributesTab();
    await this._expandAccordion('Partner Sizes');
    logger.info('[PartnerFormPage] Opened Partner Sizes section');
  }

  /**
   * Returns all available option names within the most-recently-expanded accordion section.
   *
   * DOM structure (checkbox grid, same for Ventilations / Trims / Sizes):
   *   checkbox "ItemName"  ← accessible name from aria-label attribute
   *
   * Strategy: collect every visible checkbox accessible name, exclude "Select All".
   * Since `openSizesSection()` is called immediately before this, the Sizes accordion
   * is freshly expanded. Other sections (Ventilations, Trims) retain their checkboxes
   * but their item names are known constants — we filter them out via the exclusion list.
   *
   * @param {string} sectionLabel - Used only for logging
   * @param {string[]} [excludeNames=[]] - Names to exclude (e.g. already-known sections)
   * @returns {Promise<string[]>}
   */
  async _getSectionOptions(sectionLabel, excludeNames = []) {
    const EXCLUDED_ACCESSIBLE_NAMES = new Set([
      'Select All', 'select all',
      // Known ventilation names (may be visible if Ventilations accordion is still open)
      'Zline', 'Broan', 'TradeWinds', 'Vent-A-Hood', 'Hauslane',
      // Known trim names (may be visible if Trims accordion is still open)
      'Classic Trim', 'Block Trim', 'Flat Trim',
      ...excludeNames,
    ]);

    const allCheckboxes = this.page.getByRole('checkbox');
    const count = await allCheckboxes.count();
    const names = [];

    for (let i = 0; i < count; i++) {
      const cb = allCheckboxes.nth(i);
      // Try multiple strategies to get the accessible name / label text
      const name = await cb.evaluate((el) => {
        // 1. aria-label attribute
        if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
        // 2. aria-labelledby
        const labelledById = el.getAttribute('aria-labelledby');
        if (labelledById) {
          const labelEl = document.getElementById(labelledById);
          if (labelEl) return labelEl.textContent.trim();
        }
        // 3. <label> element association (for attribute)
        if (el.labels && el.labels.length > 0) return el.labels[0].textContent.trim();
        // 4. Sibling text element in the same container
        const sibling = el.nextElementSibling;
        if (sibling) return sibling.textContent.trim();
        // 5. Parent element inner text (minus checkbox)
        const parent = el.parentElement;
        if (parent) return parent.textContent.trim();
        return '';
      }).catch(() => '');

      if (name && !EXCLUDED_ACCESSIBLE_NAMES.has(name)) {
        names.push(name);
      }
    }

    logger.info(`[PartnerFormPage] ${sectionLabel} options found: ${names.join(', ')}`);
    return names;
  }

  /**
   * Selects items in an expanded accordion section by checking their named checkboxes.
   *
   * DOM structure (confirmed from Ventilations page snapshot):
   *   generic [cursor=pointer]:
   *     checkbox "ItemName"   ← accessible name = item label
   *     generic: ItemName
   *
   * Each item checkbox has an accessible name matching its label text exactly.
   * Using getByRole('checkbox', { name }) is the most reliable selector.
   *
   * @param {string} sectionLabel - For logging
   * @param {string[]} itemNames  - Exact accessible names of items to select
   * @returns {Promise<string[]>} Names that were successfully selected
   */
  async _selectItemsInSection(sectionLabel, itemNames) {
    logger.info(`[PartnerFormPage] Selecting in ${sectionLabel}:`, itemNames);
    const selected = [];

    for (const name of itemNames) {
      let checkbox;

      // Strategy 1: getByRole with accessible name (works for Ventilations/Trims where
      //             the checkbox element has an aria-label matching the item text)
      const byRole = this.page.getByRole('checkbox', { name, exact: true });
      const roleVisible = await byRole.isVisible({ timeout: 1500 }).catch(() => false);

      if (roleVisible) {
        checkbox = byRole;
      } else {
        // Strategy 2: find by sibling/container text (for Sizes where checkboxes lack
        //             aria-label but the label text is in an adjacent element)
        //
        // DOM structure:
        //   generic [cursor=pointer]:       ← item container
        //     [role="checkbox"] / input     ← the checkbox
        //     generic: "30" x 36""         ← label text sibling
        //
        // Find the innermost element with exactly this text, then navigate to its
        // nearest ancestor that contains a checkbox.
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const textEl = this.page
          .locator('div, span, p')
          .filter({ hasText: new RegExp(`^${escapedName}$`) })
          .last();

        const textVisible = await textEl.isVisible({ timeout: 1500 }).catch(() => false);
        if (textVisible) {
          // Navigate to the parent container and find its checkbox
          const container = this.page.locator('div, li').filter({
            has: this.page.locator('div, span, p').filter({ hasText: new RegExp(`^${escapedName}$`) }),
          }).last();
          checkbox = container.locator('input[type="checkbox"], [role="checkbox"]').first();
        } else {
          // Last resort: use getByRole without exact match
          checkbox = this.page.getByRole('checkbox', { name });
        }
      }

      await checkbox.waitFor({ state: 'visible', timeout: 8000 });

      const isChecked = await checkbox.isChecked().catch(() => false);
      if (!isChecked) {
        await checkbox.click();
        await this.page.waitForTimeout(200);
      }

      selected.push(name);
      logger.info(`[PartnerFormPage] Selected "${name}" in ${sectionLabel}`);
    }

    return selected;
  }

  /**
   * Selects specified ventilation options (4 random items from the full list).
   * @param {string[]} items - Ventilation names to select
   */
  async selectVentilations(items) {
    await this.openVentilationsSection();
    await this._selectItemsInSection('Partner Ventilations', items);
    logger.info(`[PartnerFormPage] Selected ventilations: ${items.join(', ')}`);
  }

  /**
   * Selects specified trim options.
   * @param {string[]} items - Trim names to select
   */
  async selectTrims(items) {
    await this.openTrimsSection();
    await this._selectItemsInSection('Partner Trims', items);
    logger.info(`[PartnerFormPage] Selected trims: ${items.join(', ')}`);
  }

  /**
   * Returns all available size options in the Partner Sizes section.
   * @returns {Promise<string[]>}
   */
  async getAllSizeOptions() {
    await this.openSizesSection();
    return this._getSectionOptions('Partner Sizes');
  }

  /**
   * Selects specified size options.
   * @param {string[]} items - Size values to select
   */
  async selectSizes(items) {
    await this.openSizesSection();
    await this._selectItemsInSection('Partner Sizes', items);
    logger.info(`[PartnerFormPage] Selected ${items.length} sizes`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Billing Tab
  // ═══════════════════════════════════════════════════════════════════════════

  async _openBillingTab() {
    await this.billingTab.click();
    await this.page.waitForTimeout(800);
    logger.info('[PartnerFormPage] Opened Billing tab');
  }

  /**
   * Selects the Billing Model option.
   * @param {'Distro'|'Standard'|string} model
   */
  async selectBillingModel(model) {
    await this._openBillingTab();
    await this.billingModelSelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.billingModelSelect.selectOption({ label: model });
    logger.info(`[PartnerFormPage] Selected billing model: ${model}`);
  }

  /**
   * Ensures "Partner pays shipping (own RL account)" radio is selected.
   * Idempotent — skips if already selected.
   */
  async ensurePartnerPaysShipping() {
    await this._openBillingTab();
    const isChecked = await this.partnerPaysShippingRadio.isChecked().catch(() => false);
    if (!isChecked) {
      await this.partnerPaysShippingRadio.check();
      logger.info('[PartnerFormPage] Selected: Partner pays shipping');
    } else {
      logger.info('[PartnerFormPage] Partner pays shipping already selected — skipping');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAQs & Shipping Tab
  // ═══════════════════════════════════════════════════════════════════════════

  async _openFaqsShippingTab() {
    await this.faqsShippingTab.click();
    await this.page.waitForTimeout(800);
    logger.info('[PartnerFormPage] Opened FAQs & Shipping tab');
  }

  /**
   * Adds a FAQ entry with the given title and answer.
   *
   * DOM structure (confirmed from error-context snapshot):
   *   button "Add FAQ"  → creates a new FAQ form
   *   textbox "Enter question"  → FAQ title (accessible name from placeholder/aria)
   *   button "Visual" / button "Code"  → TinyMCE mode switchers
   *   application → iframe (TinyMCE visual editor)
   *   button "Done"  → saves the FAQ
   *
   * Strategy: fill title via accessible name; switch TinyMCE to Code mode
   * which exposes a plain <textarea> that can be filled directly.
   *
   * @param {string} title
   * @param {string} answer
   */
  async addFaq(title, answer) {
    await this._openFaqsShippingTab();

    // Ensure the "FAQs" sub-tab is active (not "Shipping & Returns")
    const faqsSubtab = this.page.getByRole('button', { name: /^faqs?$/i });
    if (await faqsSubtab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await faqsSubtab.click();
      await this.page.waitForTimeout(300);
    }

    await this.addFaqBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addFaqBtn.click();
    await this.page.waitForTimeout(500);

    // Title: the textbox has accessible name "Enter question" (from placeholder / aria-label)
    const titleInput = this.page.getByRole('textbox', { name: /enter question/i }).last();
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });
    await titleInput.clear();
    await titleInput.fill(title);

    // Answer: TinyMCE is used as a rich-text editor.
    // Switch to "Code" (text) mode to expose a plain <textarea> for filling.
    // The Code button switches TinyMCE from its iframe-based Visual mode to a plain textarea.
    const codeBtn = this.page.getByRole('button', { name: /^code$/i }).last();
    const codeBtnVisible = await codeBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (codeBtnVisible) {
      await codeBtn.click();
      await this.page.waitForTimeout(500);
    }

    // In Code mode a plain <textarea> appears. WordPress may use class "wp-editor-area",
    // but the class name can vary — use the last visible textarea on the page.
    // The Visual-mode TinyMCE iframe body becomes hidden in Code mode, so any visible
    // textarea is the Code-mode editor.
    const answerArea = this.page.locator('textarea').last();
    const areaVisible = await answerArea.isVisible({ timeout: 5000 }).catch(() => false);
    if (areaVisible) {
      await answerArea.fill(answer);
    } else if (!codeBtnVisible) {
      // Code button never appeared — TinyMCE still in Visual (iframe) mode. Type into it.
      try {
        const frame = this.page.frameLocator('iframe[id*="mce"], iframe').last();
        const frameBody = frame.locator('body');
        await frameBody.waitFor({ state: 'visible', timeout: 5000 });
        await frameBody.click();
        await this.page.keyboard.type(answer);
      } catch {
        logger.warn('[PartnerFormPage] Could not fill FAQ answer — TinyMCE not ready');
      }
    } else {
      logger.warn('[PartnerFormPage] Could not fill FAQ answer — no textarea visible after Code mode switch');
    }

    // Save the FAQ item
    const doneBtn = this.page.getByRole('button', { name: /^done$/i }).last();
    await doneBtn.waitFor({ state: 'visible', timeout: 5000 });
    await doneBtn.click();
    await this.page.waitForTimeout(400);
    logger.info(`[PartnerFormPage] Added FAQ: "${title}"`);
  }

  /**
   * Adds a shipping/returns policy entry.
   *
   * Navigates to the "Shipping & Returns" sub-tab first, then clicks
   * "Add Policy" and fills the title and description fields.
   *
   * @param {string} policyTitle
   * @param {string} policyDescription
   */
  async addPolicy(policyTitle, policyDescription) {
    await this._openFaqsShippingTab();

    // Navigate to the "Shipping & Returns" sub-tab
    const shippingSubtab = this.page.getByRole('button', { name: /shipping.*returns/i });
    if (await shippingSubtab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await shippingSubtab.click();
      await this.page.waitForTimeout(400);
    }

    await this.addPolicyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.addPolicyBtn.click();
    await this.page.waitForTimeout(500);

    // Policy title: try accessible-name-based selectors first, fall back to position
    const titleInput = this.page.getByRole('textbox').first();
    await titleInput.waitFor({ state: 'visible', timeout: 8000 });
    await titleInput.clear();
    await titleInput.fill(policyTitle);

    // Policy description: TinyMCE editor — switch to Code mode to expose a plain <textarea>
    const codeBtnPolicy = this.page.getByRole('button', { name: /^code$/i }).last();
    const codeBtnPolicyVisible = await codeBtnPolicy.isVisible({ timeout: 3000 }).catch(() => false);
    if (codeBtnPolicyVisible) {
      await codeBtnPolicy.click();
      await this.page.waitForTimeout(500);
    }

    // Use the last visible textarea (Code mode exposes one; class name may vary)
    const descArea = this.page.locator('textarea').last();
    const descVisible = await descArea.isVisible({ timeout: 5000 }).catch(() => false);
    if (descVisible) {
      await descArea.fill(policyDescription);
    } else if (!codeBtnPolicyVisible) {
      try {
        const frame = this.page.frameLocator('iframe[id*="mce"], iframe').last();
        const frameBody = frame.locator('body');
        await frameBody.waitFor({ state: 'visible', timeout: 5000 });
        await frameBody.click();
        await this.page.keyboard.type(policyDescription);
      } catch {
        logger.warn('[PartnerFormPage] Could not fill policy description — TinyMCE not ready');
      }
    } else {
      logger.warn('[PartnerFormPage] Could not fill policy description — no textarea visible after Code mode switch');
    }

    // Click "Done" to commit and close the policy editor (required before form submission)
    const doneBtnPolicy = this.page.getByRole('button', { name: /^done$/i }).last();
    await doneBtnPolicy.waitFor({ state: 'visible', timeout: 5000 });
    await doneBtnPolicy.click();

    // Wait for the policy editor to collapse (Done button disappears) before returning.
    // This ensures the SPA has committed the policy to its state before form submission.
    await doneBtnPolicy.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    // await this.page.waitForTimeout(600);

    logger.info(`[PartnerFormPage] Added policy: "${policyTitle}"`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Submit
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Clicks the "Create Partner" submit button via native JS and waits for success.
   */
  async _clickCreatePartnerButton() {
    await this.page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn && submitBtn.textContent.trim().includes('Create Partner')) {
        submitBtn.click();
        return;
      }
      const allBtns = Array.from(document.querySelectorAll('button'));
      const createBtn = allBtns.findLast(b => b.textContent.trim() === 'Create Partner');
      if (createBtn) createBtn.click();
    });
  }

  /**
   * Waits for partner creation to finish and throws a descriptive error on failure.
   * @param {number} [timeout=60000]
   */
  async _waitForPartnerCreationResult(timeout = 60000) {
    const heading = this.page.getByRole('heading', { name: 'Add New Partner', exact: true });
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      const navigatedAway = !(await heading.isVisible().catch(() => false));
      if (navigatedAway) {
        logger.info('[PartnerFormPage] Partner created — SPA navigated away from Add page');
        return;
      }

      const notificationText = await getVisibleNotificationText(this.page);
      if (notificationText) {
        if (/partner created/i.test(notificationText)) {
          logger.info('[PartnerFormPage] Partner created — success notification confirmed');
          return;
        }

        if (/failed to create partner|website may already exist|already exist/i.test(notificationText)) {
          throw new Error(`Partner creation failed: ${notificationText}`);
        }
      }

      await this.page.waitForTimeout(500);
    }

    const finalNotification = await getVisibleNotificationText(this.page);
    if (finalNotification) {
      throw new Error(`Partner creation did not complete: ${finalNotification}`);
    }

    throw new Error('Partner creation timed out — still on Add New Partner page with no success signal');
  }

  /**
   * Clicks the "Create Partner" submit button and waits for the SPA to confirm success.
   *
   * Success is detected in order:
   *   1. The "Add New Partner" heading disappears (SPA navigated away) — primary signal
   *   2. A "Partner created." toast/notification is visible — secondary signal
   */
  async clickCreatePartner() {
    logger.info('[PartnerFormPage] Submitting Create Partner form');
    await this.createPartnerBtn.waitFor({ state: 'visible', timeout: 10000 });
    await this.createPartnerBtn.scrollIntoViewIfNeeded();

    // Small settle pause — give the SPA a moment to finish any pending state updates
    // (e.g., from the policy editor closing) before submitting.
    await this.page.waitForTimeout(800);

    // Playwright's synthetic mouse click does not reliably trigger this SPA's Vue/React
    // click handlers. Use native browser element.click() instead.
    await this._clickCreatePartnerButton();
    logger.info('[PartnerFormPage] Create Partner button clicked (native JS)');

    try {
      await this._waitForPartnerCreationResult(60000);
    } catch (firstError) {
      logger.warn(`[PartnerFormPage] First submit attempt failed: ${firstError.message}`);
      logger.warn('[PartnerFormPage] Retrying Create Partner click once');

      await this.page.waitForTimeout(1000);
      await this._clickCreatePartnerButton();
      await this._waitForPartnerCreationResult(60000);
    }

    // Best-effort toast check — the toast auto-dismisses quickly, so use a short timeout.
    const toastVisible = await this.page
      .locator('[role="alert"], [role="status"], [class*="toast"], [class*="snackbar"], [class*="notification"]')
      .filter({ hasText: 'Partner created' })
      .first()
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    if (toastVisible) {
      logger.info('[PartnerFormPage] Partner created — success toast also confirmed');
    } else {
      logger.info('[PartnerFormPage] Partner created — toast auto-dismissed (navigation was the success signal)');
    }
  }
}

module.exports = { PartnerFormPage };
