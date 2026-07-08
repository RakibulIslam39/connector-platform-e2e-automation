'use strict';

/**
 * ProductCreationPage — Connector Hub SPA — "Add Product" flow
 *
 * All product creation lives inside the Connector Hub SPA at:
 *   /wp-admin/admin.php?page=connector-hub#/products?action=add
 *
 * The Add Product form has (at least) two areas:
 *   Basic Info — title, SKU, status, description, featured image, gallery
 *   Attributes — a deeply nested tree of expandable attribute groups
 *                (Color, Size, Ventilation Options, per-brand CFM values, etc.)
 *
 * Confirmed DOM: every attribute row is a clickable `div.cursor-pointer` holding
 * a `span.font-medium` label plus a badge span — "N selected" for multi-select
 * groups, "Enabled"/"Disabled" for toggle attributes (Color, Sherwin-Williams,
 * Physical Sample).
 *
 * `selectAllAttributes()` enumerates the multi-select group rows by ordinal index
 * (so duplicate-named groups stay distinguishable), expands each, and either uses
 * a "Select All" control or randomly picks options — recording every decision on
 * `this.selectedAttributes`. Toggle attributes are handled separately by the
 * idempotent `enable*Toggle` helpers.
 */

const { BasePage } = require('../base.page');
const { CONNECTOR_PATHS } = require('../../constants/urls');
const { pickRandom } = require('../../common/utils/random-data-generator');
const logger = require('../../common/utils/logger');

const GROUP_BADGE_PATTERN = /\d+\s*selected$/i;

/** Inclusive random integer in [min, max]. */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class ProductCreationPage extends BasePage {
  constructor(page) {
    super(page);

    /** @type {Array<{group: string, index: number, mode: string, values: any[]}>} */
    this.selectedAttributes = [];

    // ── Product list page ────────────────────────────────────────────────────
    this.connectorHubLink = page.getByRole('link', { name: 'Connector Hub' });
    this.productsNavLink = page.locator('header').getByRole('link', { name: 'Products' });
    this.addProductLink = page.getByRole('link', { name: 'Add Product' });

    // ── Add Product form — Basic Info ───────────────────────────────────────
    this.productTitleInput = page.getByRole('textbox', { name: 'Enter product title' });
    this.productSkuInput = page.getByRole('textbox', { name: 'e.g., VEN-' });
    this.statusSelect = page.getByRole('combobox').first();
    this.descriptionFrame = page.locator('#product-description_ifr').contentFrame();
    this.dimensionsFrame = page.locator('#product-dimensions_ifr').contentFrame();
    // Native <select> whose options include "Select a category" / "Wood Hoods".
    this.categorySelect = page.locator('select').filter({ hasText: 'Select a category' }).first();

    // ── Basic Info — Featured image ─────────────────────────────────────────
    this.addMediaBtn = page
      .locator('#wp-product-description-wrap')
      .getByRole('button', { name: 'Add media' });
    this.imageSizeSelect = page.getByRole('combobox').nth(1);
    this.insertIntoPostBtn = page.getByRole('button', { name: 'Insert into post' });

    // ── Basic Info — Gallery ─────────────────────────────────────────────────
    this.addImagesBtn = page.getByRole('button', { name: 'Add Images' });
    this.selectMediaBtn = page.getByRole('button', { name: 'Select', exact: true });

    // ── Tabs ──────────────────────────────────────────────────────────────────
    this.attributesTab = page.getByRole('button', { name: 'Attributes' });

    // ── Attributes tab — footer submit ─────────────────────────────────────────
    // There are two "Create Product" buttons (top + bottom of the form) — target
    // the explicit one to avoid a strict-mode multi-match.
    this.saveProductBtn = page.getByRole('button', { name: 'Create Product' }).first();

    // ── Edit page — "Update Product" button ────────────────────────────────
    // After creation the SPA auto-redirects to #/products?action=edit&id={id}.
    // Attributes can only be persisted via the edit-page POST /products/{id}.
    this.updateProductBtn = page.getByRole('button', { name: 'Update Product' }).first();

    // ── Success indicators ──────────────────────────────────────────────────
    this.successMessage = page.getByText('Product created.');
    this.updateSuccessMessage = page.getByText('Product updated.');
  }

  // ─── Navigation ───────────────────────────────────────────────────────────────

  /**
   * Direct navigation to the Add Product route (fast path for setup steps).
   */
  async gotoCreateProduct() {
    await this.navigate(CONNECTOR_PATHS.PRODUCT_CREATE);
    await this.productTitleInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  /**
   * Opens the Add Product form. Navigates directly to the Connector Hub Products
   * route (robust for an SPA — the WP sidebar "Connector Hub" link is not reliably
   * clickable from a cold /wp-admin/ load), then clicks the in-app "Add Product".
   * Mirrors the partner flow's navigateToAddPartnerViaQuickActions pattern.
   */
  async navigateToAddProductViaMenu() {
    logger.info('[ProductCreationPage] Navigating to Add Product via Connector Hub Products route');
    await this.navigate(CONNECTOR_PATHS.PRODUCTS);
    await this.page.waitForLoadState('domcontentloaded');

    await this.addProductLink.waitFor({ state: 'visible', timeout: 20000 });
    await this.addProductLink.click();
    await this.productTitleInput.waitFor({ state: 'visible', timeout: 20000 });
  }

  // ─── Basic Info ─────────────────────────────────────────────────────────────

  async fillTitle(title) {
    await this.productTitleInput.click();
    await this.productTitleInput.fill(title);
  }

  async fillSku(sku) {
    await this.productSkuInput.click();
    await this.productSkuInput.fill(sku);
  }

  async selectStatus(status) {
    await this.statusSelect.selectOption(status);
  }

  /**
   * Focuses the TinyMCE description editor and optionally types content.
   * @param {string} [text] - description text to type; if omitted, only focuses the editor.
   */
  async setDescription(text) {
    const paragraph = this.descriptionFrame.getByRole('paragraph');
    await paragraph.click();
    if (text) {
      await this.page.keyboard.type(text, { delay: 10 });
    }
  }

  /**
   * Fills the Dimensions rich-text (TinyMCE) editor.
   * @param {string} [text]
   */
  async setDimensions(text) {
    const paragraph = this.dimensionsFrame.getByRole('paragraph');
    await paragraph.click();
    if (text) {
      await this.page.keyboard.type(text, { delay: 10 });
    }
    logger.info('[ProductCreationPage] Filled Dimensions');
  }

  /**
   * Selects a product Category from the dropdown (e.g. "Wood Hoods").
   * @param {string} categoryName
   */
  async selectCategory(categoryName) {
    await this.categorySelect.selectOption({ label: categoryName });
    logger.info(`[ProductCreationPage] Selected category: ${categoryName}`);
  }

  /**
   * Sets the featured image via the WP media library modal.
   * @param {string} imageName - accessible name of the media checkbox (e.g. "test image")
   * @param {string} [sizeOptionValue] - value to select in the "size" combobox once inserted
   */
  async setFeaturedImage(imageName, sizeOptionValue) {
    await this.addMediaBtn.click();
    await this.page.getByRole('checkbox', { name: imageName }).click();
    if (sizeOptionValue) {
      await this.imageSizeSelect.selectOption(sizeOptionValue);
    }
    await this.insertIntoPostBtn.click();
    logger.info(`[ProductCreationPage] Set featured image: ${imageName}`);
  }

  /**
   * Adds a gallery image via the WP media library modal.
   * @param {string} imageName - accessible name of the media checkbox (e.g. "test image")
   */
  async addGalleryImage(imageName) {
    await this.addImagesBtn.click();
    await this.page.getByRole('checkbox', { name: imageName }).click();
    await this.selectMediaBtn.click();
    logger.info(`[ProductCreationPage] Added gallery image: ${imageName}`);
  }

  // ─── Attributes tab ─────────────────────────────────────────────────────────

  async openAttributesTab() {
    await this.attributesTab.click();
  }

  // ─── Toggle helpers (idempotent: enable-if-disabled, skip-if-enabled) ─────────
  //
  // Standing convention (see memory.md): never blind-click a toggle. Detect the
  // current state first and only enable when needed.

  /**
   * Enables an attribute's "Enable for this product" toggle if it is currently
   * disabled; skips if already enabled.
   *
   * @param {string} attributeLabel - exact label, e.g. "Color",
   *   "Please Enter Your Sherwin-Williams Color Code", "Physical Sample Instructions"
   * @returns {Promise<'enabled'|'already-enabled'>}
   */
  async enableProductToggle(attributeLabel) {
    // Confirmed DOM: each attribute row is a clickable `div.cursor-pointer`
    // holding a `span.font-medium` label plus a badge span reading
    // "Enabled"/"Disabled" (toggle rows) or "N selected" (multi-select rows).
    const row = this.page
      .locator('div.cursor-pointer')
      .filter({ has: this.page.getByText(attributeLabel, { exact: true }) })
      .first();
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.scrollIntoViewIfNeeded();

    // Idempotent — skip without expanding when the badge already reads "Enabled".
    const badgeText = (
      (await row
        .locator('span')
        .last()
        .textContent()
        .catch(() => '')) || ''
    ).trim();
    if (/^enabled$/i.test(badgeText)) {
      logger.info(`[ProductCreationPage] Toggle already enabled — skipping: ${attributeLabel}`);
      return 'already-enabled';
    }

    // Expand the row. The switch has NO accessible name ("Enable for this product"
    // is an adjacent label) and lives in the row's expanded panel — a SIBLING of
    // the header — so scope to the row's wrapper. Its first switch is "Enable for
    // this product"; the second (if present) is "Enable Conditional Logic".
    await row.click();
    const control = row.locator('xpath=..').getByRole('switch').first();
    await control.waitFor({ state: 'visible', timeout: 8000 });

    // A `switch` isn't a checkbox — read state from aria-checked. Click to enable,
    // then verify it registered (retry once if the SPA swallowed the click).
    const isChecked = async () =>
      (await control.getAttribute('aria-checked').catch(() => null)) === 'true';
    if (!(await isChecked())) {
      await control.click();
    }
    if (!(await isChecked())) {
      await control.click();
      await this.page.waitForTimeout(300);
    }
    logger.info(`[ProductCreationPage] Enabled toggle: ${attributeLabel}`);
    return 'enabled';
  }

  /** Enables the Color attribute toggle for this product (idempotent). */
  async enableColorToggle() {
    return this.enableProductToggle('Color');
  }

  /** Enables the Sherwin-Williams Color Code toggle for this product (idempotent). */
  async enableSherwinWilliamsColorCodeToggle() {
    return this.enableProductToggle('Please Enter Your Sherwin-Williams Color Code');
  }

  /** Enables the Physical Sample Instructions toggle for this product (idempotent). */
  async enablePhysicalSampleInstructionsToggle() {
    return this.enableProductToggle('Physical Sample Instructions');
  }

  /**
   * Reads the accessible names of every currently visible checkbox on the page.
   * Used to diff "before" vs "after" expanding a group so newly revealed
   * checkboxes (belonging to the group just expanded) can be identified.
   */
  async _getVisibleCheckboxNames() {
    return this.page.evaluate(() => {
      const boxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
      return boxes
        .filter((el) => el.offsetParent !== null)
        .map((el) => {
          let label = el.getAttribute('aria-label');
          if (!label && el.id) {
            const lab = document.querySelector(`label[for="${el.id}"]`);
            if (lab) {
              label = lab.textContent.trim();
            }
          }
          if (!label) {
            const parentLabel = el.closest('label');
            if (parentLabel) {
              label = parentLabel.textContent.trim();
            }
          }
          return (label || el.name || el.id || '').trim();
        })
        .filter(Boolean);
    });
  }

  /**
   * Selects attribute options for every multi-select group, keeping the RANDOM
   * pick-per-group behaviour and recording each decision (with an ordinal index)
   * so duplicate-named groups (6× "Ventilation Options", repeated brand groups,
   * 4× "Non-Duct Kit") stay distinguishable and can be validated later.
   *
   * Grounded in the confirmed DOM: each group is a `div.cursor-pointer` header
   * with a `span.font-medium` label and a `"N selected"` badge. Toggle rows
   * (Color / Sherwin-Williams / Physical Sample — badge "Enabled"/"Disabled")
   * are excluded here; use the enable*Toggle helpers for those.
   *
   * @param {object} [options]
   * @param {number} [options.maxLeaveOut] - max options to randomly OMIT per group (default 4)
   * @returns {Promise<Array<{group: string, index: number, mode: string, values: any[]}>>}
   */
  async selectAllAttributes(options = {}) {
    const { maxLeaveOut = 4 } = options;
    this.selectedAttributes = [];

    // Group headers = clickable rows whose badge reads "N selected".
    const groupHeaders = this.page
      .locator('div.cursor-pointer')
      .filter({ hasText: GROUP_BADGE_PATTERN });
    const groupCount = await groupHeaders.count();
    logger.info(`[ProductCreationPage] Found ${groupCount} multi-select attribute groups`);

    for (let index = 0; index < groupCount; index += 1) {
      const header = groupHeaders.nth(index);
      const label = (
        (await header
          .locator('span.font-medium')
          .first()
          .textContent()
          .catch(() => '')) || `Group ${index}`
      ).trim();

      // Expand this group and diff visible checkboxes to isolate its options.
      const before = await this._getVisibleCheckboxNames();
      await header.scrollIntoViewIfNeeded();
      await header.click();
      await this.page.waitForTimeout(250);
      const after = await this._getVisibleCheckboxNames();
      const revealed = after.filter(
        (name) => !before.includes(name) && name.toLowerCase() !== 'select all'
      );

      // Select ALL options except a random 1..maxLeaveOut (always leave the group
      // non-empty). e.g. Size 34 → ~30-33 selected; Ventilation → all minus 1-2.
      let values = [];
      let skippedCount = 0;
      if (revealed.length > 0) {
        const leaveOut =
          revealed.length <= 1 ? 0 : Math.min(randomInt(1, maxLeaveOut), revealed.length - 1);
        const skip = new Set(pickRandom(revealed, leaveOut));
        values = revealed.filter((name) => !skip.has(name));
        skippedCount = leaveOut;

        for (const name of values) {
          await this.page
            .getByRole('checkbox', { name, exact: true })
            .first()
            .check()
            .catch(() => logger.debug(`[ProductCreationPage] Could not check "${name}"`));
        }
      }

      // Persistence check — the header badge reflects the SPA's COMMITTED count.
      // If we checked options but the badge stays "0 selected", the clicks aren't
      // registering (wrong check target / hidden input), which is the real cause
      // of a product saving with no attributes. The per-option .catch() would
      // otherwise hide this, so surface it as a warning.
      const badgeText = (
        (await header
          .locator('span')
          .last()
          .textContent()
          .catch(() => '')) || ''
      ).trim();
      const registered = parseInt((badgeText.match(/(\d+)\s*selected/i) || [])[1] || '0', 10);
      if (values.length > 0 && registered === 0) {
        logger.warn(
          `[ProductCreationPage] "${label}": checked ${values.length} option(s) but badge still "0 selected" — selection is NOT registering`
        );
      }

      this.selectedAttributes.push({
        group: label,
        index,
        mode: revealed.length > 0 ? 'partial' : 'expanded-only',
        values,
        total: revealed.length,
        skipped: skippedCount,
        registered,
      });

      // Collapse again so only one group is open at a time (stable diffs).
      await header.click().catch(() => {});
      await this.page.waitForTimeout(100);
    }

    logger.info(
      `[ProductCreationPage] Attribute selection complete — ${this.selectedAttributes.length} groups processed`
    );
    return this.selectedAttributes;
  }

  // ─── Save ───────────────────────────────────────────────────────────────────

  async submitProduct() {
    await this.saveProductBtn.click();
    logger.info('[ProductCreationPage] Submitted product creation form');
  }

  /**
   * Waits for the SPA to redirect to the Edit Product page after successful
   * creation. The SPA navigates to #/products?action=edit&id={newId} and
   * replaces "Create Product" with "Update Product".
   *
   * Call this immediately after `submitProduct()` + `successMessage` assertion.
   *
   * @param {number} [timeout=15000]
   * @returns {Promise<string|null>} The created product ID extracted from the URL.
   */
  async waitForEditPage(timeout = 15000) {
    await this.updateProductBtn.waitFor({ state: 'visible', timeout });
    const url = this.page.url();
    const productId = url.match(/[?&]id=(\d+)/)?.[1] ?? null;
    logger.info(
      `[ProductCreationPage] Edit page loaded — product id: ${productId} (${url})`
    );
    return productId;
  }

  /**
   * Clicks the "Update Product" button on the Edit Product page and waits
   * for the "Product updated." success message.
   *
   * Attributes selected via `selectAllAttributes()` are only persisted to the
   * backend by this call (POST /products/{id}); they are NOT included in the
   * initial creation POST.
   */
  async updateProduct() {
    await this.updateProductBtn.click();
    logger.info('[ProductCreationPage] Clicked Update Product');
  }

  async isProductCreated(timeout = 15000) {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  // ─── Full creation flow ─────────────────────────────────────────────────────

  /**
   * Runs the complete Add Product flow end-to-end.
   * @param {object} productData
   * @param {string} productData.title
   * @param {string} productData.sku
   * @param {string} productData.status
   * @param {string} [productData.description]
   * @param {string} [productData.imageName] - defaults to "test image"
   * @returns {Promise<{created: boolean, selectedAttributes: Array}>}
   */
  async createProduct(productData) {
    const imageName = productData.imageName || 'test image';

    logger.info(
      `[ProductCreationPage] Creating product: ${productData.title} (${productData.sku})`
    );

    await this.navigateToAddProductViaMenu();
    await this.fillTitle(productData.title);
    await this.fillSku(productData.sku);
    await this.selectStatus(productData.status);
    await this.setDescription(productData.description);
    await this.setFeaturedImage(imageName, '9');
    await this.addGalleryImage(imageName);

    await this.openAttributesTab();
    await this.selectAllAttributes();

    await this.submitProduct();
    const created = await this.isProductCreated();

    return { created, selectedAttributes: this.selectedAttributes };
  }
}

module.exports = { ProductCreationPage };
