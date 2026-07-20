'use strict';

/**
 * AttributeTypesPage — Connector Hub SPA — Attributes → "Attribute Types" tab.
 *
 * Covers creating an Attribute Type (name, input type, description, status,
 * setting toggle) and searching the list.
 *
 * NOTE: the Type/Status pickers are react-select components whose class names are
 * Emotion hashes (`.css-…`). They're wrapped here in named helpers; if a build
 * changes the hashes, replace the `reactSelectInputs` locator with a stable hook
 * (label / data-testid). Options are exposed with role="option".
 */

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

// Wait budgets (ms) — named so intent is clear and tuning happens in one place.
const WAIT = { TAB: 20000, ELEMENT: 15000, OPTIONS: 8000, PROBE: 2000 };
const SEARCH_DEBOUNCE_MS = 500;

class AttributeTypesPage extends BasePage {
  constructor(page) {
    super(page);

    // ── Tabs / actions ──────────────────────────────────────────────────────
    this.attributeTypesTabBtn = page.getByRole('button', { name: 'Attribute Types' });
    this.addTypeBtn = page.getByRole('button', { name: 'Add Type' });
    this.createBtn = page.getByRole('button', { name: 'Create', exact: true });

    // ── Create form fields ──────────────────────────────────────────────────
    this.nameInput = page.getByRole('textbox', { name: 'Name' });
    this.descriptionInput = page.getByRole('textbox', { name: 'Description' });

    // react-select searchable inputs, in form order: 0 = Type, 1 = Status.
    // TODO(codegen): prefer a stable hook over the Emotion class if it changes.
    this.reactSelectInputs = page.locator('.css-19bb58m');

    // "Show in Partner Page" toggle. Markup: a <label> wrapping a sr-only
    // <input type="checkbox"> (the real state) + a visible `.w-11` track. When ON,
    // the type appears under the "Partner Attribute Type" filter and is hidden from
    // "Product Attribute Type". We read the checkbox and click the track to flip it.
    this.showInPartnerLabel = page
      .locator('label.relative:has(input[type="checkbox"].peer)')
      .first();
    this.settingToggle = this.showInPartnerLabel.locator('.w-11'); // clickable track
    this.showInPartnerCheckbox = this.showInPartnerLabel.locator('input[type="checkbox"]');

    // ── Attribute Values (opened via a type's "Manage Values" action) + form ───
    this.addAttributeBtn = page.getByRole('button', { name: 'Add Attribute' });
    this.skuInput = page.getByRole('textbox', { name: 'SKU' });
    this.basePriceInput = page.getByRole('spinbutton', { name: 'Base Price ($)' });
    this.distroPriceInput = page.getByRole('spinbutton', { name: 'Distro Price ($)' });
    this.attributeCreatedMessage = page.getByText('Attribute created.');
    this.valueSearchInput = page.getByPlaceholder('Search attributes...');
    // Edit forms submit via Update/Save (create uses "Create"). TODO(codegen): confirm label.
    this.editSubmitBtn = page
      .getByRole('button', { name: /^(Update|Save|Save Changes)$/i })
      .first();

    // ── List ────────────────────────────────────────────────────────────────
    this.searchInput = page.getByPlaceholder('Search attribute types...');
    this.successMessage = page.getByText('Attribute type created.');

    // "All / Product / Partner Attribute Type" filter. Identified by the presence
    // of its "Partner Attribute Type" option so it's stable across class changes.
    this.attributeTypeFilter = page
      .locator('select')
      .filter({ has: page.getByRole('option', { name: 'Partner Attribute Type' }) })
      .first();
  }

  /** List rows whose visible text contains `name` (unscoped — for count/visibility). */
  attributeTypeRow(name) {
    return this.page.locator('table tbody tr').filter({ hasText: name });
  }

  /**
   * Applies the Attribute Types list filter.
   * @param {'all'|'product'|'partner'} kind
   */
  async filterByAttributeType(kind = 'all') {
    const value = { all: 'all', product: '0', partner: '1' }[kind];
    if (value === undefined) {
      throw new Error(`[AttributeTypesPage] Unknown attribute-type filter: "${kind}"`);
    }
    await this.attributeTypeFilter.selectOption(value);
    await this.page.waitForTimeout(SEARCH_DEBOUNCE_MS); // let the SPA re-fetch
    logger.info(`[AttributeTypesPage] Filtered attribute types by: ${kind}`);
  }

  /** Navigates to Attributes and opens the "Attribute Types" tab. */
  async openAttributeTypes() {
    await this.navigate(CONNECTOR_PATHS.ATTRIBUTE_MAPPING);
    await this.page.waitForLoadState('domcontentloaded');
    await this.attributeTypesTabBtn.waitFor({ state: 'visible', timeout: WAIT.TAB });
    await this.attributeTypesTabBtn.click();
    logger.info('[AttributeTypesPage] Opened Attribute Types tab');
  }

  /** Opens the react-select at `index` and picks the option by name. */
  async _selectReactOption(index, optionName) {
    await this.reactSelectInputs.nth(index).click();
    await this.page.getByRole('option', { name: optionName, exact: true }).click();
  }

  /**
   * Opens the list, filters to `typeName`, and returns its visible row locator.
   * Shared by every per-type action (Manage Values / Edit).
   */
  async _openTypeRow(typeName) {
    await this.openAttributeTypes();
    // Reset any active Product/Partner filter (the SPA persists it across views)
    // so the row is found regardless of the type's classification.
    await this.filterByAttributeType('all').catch(() => {});
    await this.searchType(typeName);
    const row = this.page.locator('table tbody tr').filter({ hasText: typeName }).first();
    await row.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });
    return row;
  }

  /** Selects the input Type (e.g. "Radio", "Checkbox", "Dropdown"). */
  async selectType(optionName) {
    await this._selectReactOption(0, optionName);
    logger.info(`[AttributeTypesPage] Selected type: ${optionName}`);
  }

  /**
   * Opens the Type select, picks a random available option, and returns its name.
   * @returns {Promise<string>} the chosen type name
   */
  async selectRandomType(exclude = []) {
    await this.reactSelectInputs.nth(0).click();
    const options = this.page.getByRole('option');
    await options.first().waitFor({ state: 'visible', timeout: WAIT.OPTIONS });
    const excludeLc = exclude.map((e) => String(e).toLowerCase());
    const names = (await options.allTextContents())
      .map((t) => t.trim())
      .filter(Boolean)
      .filter((n) => !excludeLc.includes(n.toLowerCase()));
    if (names.length === 0) {
      throw new Error('[AttributeTypesPage] No Type options available to pick');
    }
    const choice = names[Math.floor(Math.random() * names.length)];
    await this.page.getByRole('option', { name: choice, exact: true }).click();
    logger.info(`[AttributeTypesPage] Selected random type: ${choice}`);
    return choice;
  }

  /** Selects the Status (e.g. "Active", ). */
  async selectStatus(optionName) {
    await this._selectReactOption(1, optionName);
    logger.info(`[AttributeTypesPage] Selected status: ${optionName}`);
  }

  /** Opens the Add Type form. */
  async clickAddType() {
    await this.addTypeBtn.click();
    await this.nameInput.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });
  }

  /**
   * @returns {Promise<boolean>} the current "Show in Partner Page" state, read
   * from the underlying checkbox (`.checked` is reliable even though it's sr-only).
   */
  async _isShowInPartnerEnabled() {
    return this.showInPartnerCheckbox.isChecked().catch(() => false);
  }

  /**
   * Sets the "Show in Partner Page" toggle and returns the VERIFIED state.
   * Clicks only when the current state differs, then re-reads — so callers store
   * what the switch actually landed on (not the intent), keeping the filter
   * assertions in TC-AT-005/006 accurate even if the toggle misbehaves.
   * @param {boolean} enabled
   * @returns {Promise<boolean>} the actual post-set state
   */
  async setShowInPartnerPage(enabled) {
    await this.settingToggle.waitFor({ state: 'visible', timeout: WAIT.ELEMENT }).catch(() => {});
    if ((await this._isShowInPartnerEnabled()) !== enabled) {
      await this.settingToggle.click();
    }
    const actual = await this._isShowInPartnerEnabled();
    logger.info(
      `[AttributeTypesPage] Show in Partner Page → ${actual ? 'ON' : 'OFF'} (requested ${enabled})`
    );
    return actual;
  }

  /**
   * Fills the Add Type form and submits.
   * @param {object} data
   * @param {string} data.name
   * @param {string} [data.type='random'] - a specific type, or 'random' to pick one
   * @param {string[]} [data.excludeTypes] - type names to skip when picking randomly
   *   (e.g. ['Text','Textarea'] — types with no selectable value/price).
   * @param {string} [data.description]
   * @param {string} [data.status='Active']
   * @param {boolean|'random'} [data.showInPartnerPage] - desired "Show in Partner
   *   Page" toggle state; 'random' picks one. Defaults to `enableSettingToggle`.
   * @param {boolean} [data.enableSettingToggle=true] - legacy alias for showInPartnerPage.
   * @returns {Promise<{ type: string, showInPartnerPage: boolean }>}
   */
  async createAttributeType({
    name,
    type = 'random',
    excludeTypes = [],
    description = '',
    status = 'Active',
    enableSettingToggle = true,
    showInPartnerPage,
  }) {
    await this.clickAddType();
    await this.nameInput.fill(name);

    let chosenType;
    if (!type || type === 'random') {
      chosenType = await this.selectRandomType(excludeTypes);
    } else {
      await this.selectType(type);
      chosenType = type;
    }

    if (description) {
      await this.descriptionInput.fill(description);
    }
    await this.selectStatus(status);

    // Resolve the desired toggle state (explicit wins; 'random' picks one;
    // otherwise fall back to the legacy enableSettingToggle flag) and apply it
    // idempotently so the stored action reflects reality.
    let desired = showInPartnerPage === undefined ? enableSettingToggle : showInPartnerPage;
    if (desired === 'random') {
      desired = Math.random() < 0.5;
    }
    const shown = await this.setShowInPartnerPage(Boolean(desired)).catch(() => {
      logger.warn('[AttributeTypesPage] Show in Partner Page toggle not found — skipped');
      return Boolean(desired);
    });

    await this.createBtn.click();
    logger.info(
      `[AttributeTypesPage] Created attribute type: ${name} (type: ${chosenType}, showInPartnerPage: ${shown})`
    );
    return { type: chosenType, showInPartnerPage: shown };
  }

  /** Filters the Attribute Types list by name. */
  async searchType(name) {
    await this.searchInput.click();
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(SEARCH_DEBOUNCE_MS);
  }

  // ─── Attribute Values (inside a type) ────────────────────────────────────────

  /**
   * Opens the Attribute Values tab and filters it to the given attribute type,
   * ready to Add Attribute values for that type.
   * @param {string} typeName
   */
  async openAttributeTypeValues(typeName) {
    const row = await this._openTypeRow(typeName);
    // The row's first button is a disabled "Drag to reorder" handle — target the
    // "Manage Values" action by name to open this type's values view.
    await row.getByRole('button', { name: 'Manage Values' }).click();
    await this.addAttributeBtn.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });
    logger.info(`[AttributeTypesPage] Opened values for type: ${typeName}`);
  }

  /**
   * Adds an attribute value and submits. The value form has a single react-select
   * (Status), so it is index 0 here.
   * @param {{ name: string, sku: string, basePrice: number|string,
   *           distroPrice: number|string, status?: string }} data
   * @returns {Promise<object>} the same data (for validation)
   */
  async addAttributeValue(data) {
    const { name, sku, basePrice, distroPrice, status = 'Active' } = data;
    await this.addAttributeBtn.click();
    await this.nameInput.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });
    await this.nameInput.fill(name);
    await this.skuInput.fill(sku);
    await this.basePriceInput.fill(String(basePrice));
    await this.distroPriceInput.fill(String(distroPrice));
    await this._selectReactOption(0, status);
    await this.createBtn.click();
    logger.info(
      `[AttributeTypesPage] Created attribute value: ${name} (${sku}) base ${basePrice} distro ${distroPrice}`
    );
    return data;
  }

  // ─── Edit (type + value) ─────────────────────────────────────────────────────

  /**
   * Edits an attribute type and submits. Only provided fields are changed.
   * `fill()` replaces existing content, so no manual clear is needed.
   * @param {string} currentName
   * @param {{ name?: string, description?: string, status?: string,
   *           showInPartnerPage?: boolean }} changes
   * @returns {Promise<object>} the applied changes
   */
  async editAttributeType(currentName, changes = {}) {
    const row = await this._openTypeRow(currentName);
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await this.nameInput.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });

    if (changes.name) {
      await this.nameInput.fill(changes.name);
    }
    if (changes.description) {
      await this.descriptionInput.fill(changes.description);
    }
    if (changes.status) {
      await this.selectStatus(changes.status);
    }
    if (changes.showInPartnerPage !== undefined) {
      await this.setShowInPartnerPage(Boolean(changes.showInPartnerPage));
    }
    await this.editSubmitBtn.click();
    logger.info(
      `[AttributeTypesPage] Edited attribute type "${currentName}" → "${changes.name || currentName}"`
    );
    return changes;
  }

  /**
   * Ensures an attribute type is a **Product Attribute Type** (usable in a
   * product's Attributes). If it currently only appears under the "Partner
   * Attribute Type" filter, it is edited to disable "Show in Partner Page".
   * @param {string} name
   * @returns {Promise<boolean>} true if an edit was applied to convert it
   */
  async ensureProductAttributeType(name) {
    await this.openAttributeTypes();
    await this.filterByAttributeType('product');
    await this.searchType(name);
    if ((await this.attributeTypeRow(name).count()) > 0) {
      logger.info(`[AttributeTypesPage] "${name}" is already a Product Attribute Type`);
      return false;
    }
    logger.info(`[AttributeTypesPage] "${name}" is Partner-only — disabling Show in Partner Page`);
    await this.editAttributeType(name, { showInPartnerPage: false });
    return true;
  }

  /**
   * Edits an attribute value and submits. Only provided fields are changed.
   * The value form's single react-select (Status) is index 0.
   * @param {string} typeName
   * @param {string} currentValueName
   * @param {{ name?: string, sku?: string, basePrice?: number|string,
   *           distroPrice?: number|string, status?: string }} changes
   * @returns {Promise<object>} the applied changes
   */
  async editAttributeValue(typeName, currentValueName, changes = {}) {
    await this.openAttributeTypeValues(typeName);
    if (await this.valueSearchInput.isVisible({ timeout: WAIT.PROBE }).catch(() => false)) {
      await this.valueSearchInput.fill(currentValueName);
      await this.page.waitForTimeout(SEARCH_DEBOUNCE_MS);
    }
    const row = this.page.locator('table tbody tr').filter({ hasText: currentValueName }).first();
    await row.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });
    await row.getByRole('button', { name: 'Edit', exact: true }).click();
    await this.nameInput.waitFor({ state: 'visible', timeout: WAIT.ELEMENT });

    if (changes.name) {
      await this.nameInput.fill(changes.name);
    }
    if (changes.sku) {
      await this.skuInput.fill(changes.sku);
    }
    if (changes.basePrice !== undefined) {
      await this.basePriceInput.fill(String(changes.basePrice));
    }
    if (changes.distroPrice !== undefined) {
      await this.distroPriceInput.fill(String(changes.distroPrice));
    }
    if (changes.status) {
      await this._selectReactOption(0, changes.status);
    }
    await this.editSubmitBtn.click();
    logger.info(`[AttributeTypesPage] Edited attribute value "${currentValueName}"`);
    return changes;
  }
}

module.exports = { AttributeTypesPage };
