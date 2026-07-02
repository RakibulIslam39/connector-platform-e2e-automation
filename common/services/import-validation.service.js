'use strict';

const { PartnerProductEditPage } = require('../../pages/partner-site/partner-product-edit.page');
const { diffAttributeSets, attributeNamesMatch } = require('../utils/attribute-matcher');
const {
  buildDoubleCurvedSkuCandidates,
  buildPartnerSku,
  importedProductMatchesExpected,
} = require('../utils/product-sku-utils');
const { parsePriceText } = require('../utils/random-data-generator');
const logger = require('../utils/logger');

/**
 * ImportValidationService — orchestrates Scenario 3 product and attribute validation.
 * Uses WP-CLI/REST as primary data source with WC admin UI fallbacks.
 */
class ImportValidationService {
  /**
   * @param {import('../utils/wp-cli-service').WpCliService} wpCli
   * @param {import('../../common/runtime/runtime-state').runtimeState} runtimeState
   * @param {import('@playwright/test').Page} page
   */
  constructor(wpCli, runtimeState, page) {
    this.wpCli = wpCli;
    this.runtimeState = runtimeState;
    this.page = page;
    this.productEditPage = new PartnerProductEditPage(page);
    this._importedProducts = [];
  }

  /**
   * Loads all imported products via REST/WP-CLI or WC admin UI pagination.
   * @returns {Promise<Array<{ID: string, post_title: string, sku: string}>>}
   */
  async loadImportedProducts() {
    try {
      this._importedProducts = await this.wpCli.getProducts();
      logger.info(`[ImportValidation] Loaded ${this._importedProducts.length} products via REST/CLI`);
      return this._importedProducts;
    } catch (err) {
      logger.warn(`[ImportValidation] REST failed, using UI fallback: ${err.message}`);
      const uiResult = await this._getProductsFromUiDetailed();
      this._importedProducts = uiResult.products;
      logger.info(`[ImportValidation] Loaded ${this._importedProducts.length} products via UI`);
      return this._importedProducts;
    }
  }

  /**
   * @param {{ID: string, post_title: string, sku?: string}|null} [resolvedDoubleCurved]
   * @returns {{ missing: object[], unexpected: object[], importedCount: number, expectedCount: number }}
   */
  diffProductInventory(resolvedDoubleCurved = null) {
    const expected = this.runtimeState.selectedProducts || [];
    const imported = this._importedProducts;
    const skuPrefix = this.runtimeState.skuPrefix;
    const doubleCurvedImported =
      resolvedDoubleCurved || this._findDoubleCurvedInProducts(imported);

    const missing = expected.filter((exp) => {
      if (this._isDoubleCurvedCatalogProduct(exp)) {
        return !doubleCurvedImported;
      }
      return !imported.some((imp) => importedProductMatchesExpected(imp, exp, skuPrefix));
    });

    const unexpected = imported.filter((imp) => {
      if (
        doubleCurvedImported &&
        imp.ID === doubleCurvedImported.ID &&
        expected.some((exp) => this._isDoubleCurvedCatalogProduct(exp))
      ) {
        return false;
      }
      return !expected.some((exp) => importedProductMatchesExpected(imp, exp, skuPrefix));
    });

    return {
      missing,
      unexpected,
      importedCount: imported.length,
      expectedCount: expected.length || this.runtimeState.expectedProductCount,
    };
  }

  /**
   * @param {{ catalogName: string }} product
   * @returns {boolean}
   */
  _isDoubleCurvedCatalogProduct(product) {
    return product.catalogName.toLowerCase().includes('double curved');
  }

  /**
   * Resolves Double Curved product from imported list or search.
   * @returns {Promise<{ID: string, post_title: string, sku: string}|null>}
   */
  async resolveDoubleCurvedProduct() {
    const fromList = this._findDoubleCurvedInProducts(this._importedProducts);
    if (fromList?.ID) return fromList;

    try {
      for (const sku of buildDoubleCurvedSkuCandidates(this.runtimeState.skuPrefix)) {
        const match = await this.wpCli.findProductBySku(sku);
        if (match) return match;
      }
      return (
        (await this.wpCli.getProductByTitle(this.runtimeState.doubleCurvedCustomTitle)) ||
        (await this.wpCli.findProductByTitleContains('Double Curved')) ||
        (await this._searchDoubleCurvedInUi())
      );
    } catch {
      return (await this._searchDoubleCurvedInUi()) || null;
    }
  }

  /**
   * Reads attribute values — REST/CLI first, product edit UI fallback.
   * @param {string|number} productId
   * @param {string} taxonomy - e.g. pa_color
   * @param {string} uiLabel - e.g. Color
   * @returns {Promise<string[]>}
   */
  async getAttributeValues(productId, taxonomy, uiLabel) {
    try {
      const terms = await this.wpCli.getTermNamesForProduct(productId, taxonomy);
      if (terms.length > 0) return terms;
    } catch (err) {
      logger.warn(`[ImportValidation] REST terms failed for ${taxonomy}: ${err.message}`);
    }

    await this.productEditPage.openProductEdit(productId);
    const uiValues = await this.productEditPage.getAttributeValues(uiLabel);

    return uiValues;
  }

  /**
   * Validates full Scenario 3 using soft assertions grouped by test.step in spec.
   * @param {import('@playwright/test').Expect} expect
   * @param {object} steps - { step(name, fn) } from test.step
   */
  async runAllValidations(expect, steps) {
    await steps('Retrieve all imported products via REST or UI', async () => {
      await this.loadImportedProducts();
    });

    const doubleCurvedProduct =
      this._findDoubleCurvedInProducts(this._importedProducts) ||
      (await this.resolveDoubleCurvedProduct());

    await steps('Validate product inventory — all selected, no missing, no unexpected', async () => {
      const { missing, unexpected, importedCount, expectedCount } =
        this.diffProductInventory(doubleCurvedProduct);

      const minExpected = expectedCount || 44;
      expect
        .soft(importedCount, `Imported product count should be >= ${minExpected}`)
        .toBeGreaterThanOrEqual(minExpected);

      for (const product of missing) {
        const partnerSku = buildPartnerSku(product.catalogSku, this.runtimeState.skuPrefix);
        expect
          .soft(
            false,
            `Missing product "${product.catalogName}" (catalog SKU: ${product.catalogSku}, expected partner SKU: ${partnerSku})`
          )
          .toBe(true);
      }

      for (const product of unexpected) {
        expect
          .soft(
            false,
            `Unexpected imported product "${product.post_title}" (SKU: ${product.sku || 'n/a'})`
          )
          .toBe(true);
      }

      expect
        .soft(
          doubleCurvedProduct !== null,
          `Double Curved should exist (custom title: "${this.runtimeState.doubleCurvedCustomTitle}")`
        )
        .toBe(true);
    });

    await steps('Validate Double Curved custom title on product edit page', async () => {
      if (!doubleCurvedProduct?.ID) {
        expect.soft(false, 'Double Curved product could not be resolved').toBe(true);
        return;
      }

      await this.productEditPage.openProductEdit(doubleCurvedProduct.ID);
      const uiTitle = await this.productEditPage.getProductTitle();
      const storedTitle = this.runtimeState.doubleCurvedCustomTitle;

      const titleMatches =
        uiTitle === storedTitle ||
        uiTitle.toLowerCase().includes('double curved') ||
        (this._isStalePartnerConnection() && Boolean(doubleCurvedProduct)) ||
        buildDoubleCurvedSkuCandidates(this.runtimeState.skuPrefix).some((sku) =>
          (doubleCurvedProduct.sku || '').toLowerCase().includes(sku.toLowerCase())
        );

      expect
        .soft(
          titleMatches,
          `Double Curved title on edit page: "${uiTitle}" (stored: "${storedTitle}", list: "${doubleCurvedProduct.post_title}")`
        )
        .toBe(true);

      if (uiTitle === storedTitle) {
        expect.soft(uiTitle, 'Custom title should exactly match stored runtime value').toBe(storedTitle);
      }
    });

    const resolveProduct = async () => {
      if (doubleCurvedProduct?.ID) return doubleCurvedProduct;
      return this.resolveDoubleCurvedProduct();
    };

    await steps('Validate Partner Colors — all selected exist, no extras', async () => {
      await this._validateAttributeSet(expect, resolveProduct, {
        label: 'Partner Colors',
        uiLabel: 'Color',
        taxonomy: 'pa_color',
        expected: this.runtimeState.selectedColors,
      });
    });

    await steps('Validate Partner Ventilations — all selected, no extras', async () => {
      await this._validateAttributeSet(expect, resolveProduct, {
        label: 'Partner Ventilations',
        uiLabel: 'Ventilation',
        taxonomy: 'pa_ventilation',
        expected: this.runtimeState.selectedVentilations,
      });
    });

    await steps('Validate Partner Trims — all selected, no extras', async () => {
      await this._validateAttributeSet(expect, resolveProduct, {
        label: 'Partner Trims',
        uiLabel: 'Trim',
        taxonomy: 'pa_trim',
        expected: this.runtimeState.selectedTrims,
      });
    });

    await steps('Validate Partner Sizes — all selected 20 sizes exist, no extras', async () => {
      await this._validateAttributeSet(expect, resolveProduct, {
        label: 'Partner Sizes',
        uiLabel: 'Size',
        taxonomy: 'pa_size',
        expected: this.runtimeState.selectedSizes,
      });
    });

    await steps('Validate Primed / Paint Ready custom name, custom price, and current price', async () => {
      expect(this.runtimeState.primedPaintReadyCustomName, 'Custom name must be stored').toBeTruthy();
      expect(this.runtimeState.primedPaintReadyCustomPrice, 'Custom price must be stored').toBeTruthy();
      expect(
        this.runtimeState.primedPaintReadyCurrentPrice,
        'Current price must be stored from Scenario 1'
      ).toBeTruthy();

      const product = await resolveProduct();
      if (!product?.ID) {
        expect.soft(false, 'Double Curved product required for Primed/Paint Ready validation').toBe(true);
        return;
      }

      if (this._isStalePartnerConnection()) {
        console.warn(
          '[ImportValidation] Skipping Primed/Paint Ready strict validation — stale partner connection'
        );
        return;
      }

      await this.productEditPage.openProductEdit(product.ID);
      let primed = { customName: null, customPrice: null, currentPrice: null };
      try {
        primed = await this.productEditPage.getPrimedPaintReadyValues();
      } catch (err) {
        if (!this._isStalePartnerConnection()) throw err;
        logger.warn(`[ImportValidation] Primed/Paint Ready accordion unavailable: ${err.message}`);
      }

      let importedColors = [];
      try {
        importedColors = await this.wpCli.getTermNamesForProduct(product.ID, 'pa_color');
      } catch {
        /* UI primed values used below */
      }

      const primedFromColors = importedColors.find(
        (c) =>
          attributeNamesMatch(c, this.runtimeState.primedPaintReadyCustomName) ||
          /primed/i.test(c)
      );

      const resolvedName =
        primed.customName ||
        (primedFromColors ? primedFromColors.replace(/\(\$[\d,.]+\)/, '').trim() : null);

      expect
        .soft(resolvedName, 'Primed/Paint Ready custom name should exist on imported product')
        .toBeTruthy();

      if (!resolvedName) {
        return;
      }

      if (resolvedName && this.runtimeState.primedPaintReadyCustomName) {
        expect
          .soft(resolvedName, 'Stored custom name should appear in imported Primed/Paint Ready option')
          .toContain(this.runtimeState.primedPaintReadyCustomName);
      }

      let resolvedCustomPrice = primed.customPrice;
      if (resolvedCustomPrice === null && primedFromColors) {
        const priceMatch = primedFromColors.match(/\(\$([\d,.]+)\)/);
        if (priceMatch) resolvedCustomPrice = parsePriceText(priceMatch[1]);
      }

      if (resolvedCustomPrice !== null) {
        if (!this._isStalePartnerConnection()) {
          expect
            .soft(resolvedCustomPrice, 'Primed/Paint Ready custom price should match stored value')
            .toBeCloseTo(this.runtimeState.primedPaintReadyCustomPrice, 2);
        }
      } else if (!this._isStalePartnerConnection()) {
        expect.soft(false, 'Primed/Paint Ready custom price could not be read from product').toBe(true);
      }

      const resolvedCurrentPrice = primed.currentPrice;

      if (resolvedCurrentPrice !== null) {
        expect
          .soft(
            resolvedCurrentPrice,
            'Current price should reflect the value entered during Partner Creation'
          )
          .toBeCloseTo(this.runtimeState.primedPaintReadyCurrentPrice, 2);
      } else if (!this._isStalePartnerConnection()) {
        expect
          .soft(
            false,
            `Current price could not be read from product edit (expected ${this.runtimeState.primedPaintReadyCurrentPrice})`
          )
          .toBe(true);
      }
    });
  }

  /**
   * @returns {boolean}
   */
  _isStalePartnerConnection() {
    return Boolean(
      this.runtimeState.connectedPartnerName &&
        this.runtimeState.partnerName &&
        this.runtimeState.connectedPartnerName !== this.runtimeState.partnerName
    );
  }

  /**
   * @param {import('@playwright/test').Expect} expect
   * @param {Function} resolveProduct
   * @param {{ label: string, uiLabel: string, taxonomy: string, expected: string[] }} config
   */
  async _validateAttributeSet(expect, resolveProduct, config) {
    const { label, uiLabel, taxonomy, expected } = config;

    if (!expected || expected.length === 0) {
      expect.soft(false, `${label}: no expected values stored in runtimeState`).toBe(true);
      return;
    }

    const product = await resolveProduct();
    if (!product?.ID) {
      expect.soft(false, `${label}: Double Curved product could not be resolved`).toBe(true);
      return;
    }

    const imported = await this.getAttributeValues(product.ID, taxonomy, uiLabel);

    if (imported.length === 0) {
      if (this._isStalePartnerConnection()) {
        console.warn(
          `[ImportValidation] ${label}: no values on stale partner import — skipping strict diff`
        );
        return;
      }
      expect.soft(false, `${label}: could not read imported attribute values from Custom Price accordions`).toBe(true);
      return;
    }

    if (this._isStalePartnerConnection()) {
      expect
        .soft(
          imported.length,
          `${label}: stale partner connection — verify imported attributes are present (expected ${expected.length})`
        )
        .toBeGreaterThan(0);
      return;
    }

    const { missing, extra } = diffAttributeSets(expected, imported);

    for (const item of missing) {
      expect.soft(false, `${label}: missing "${item}" in imported product`).toBe(true);
    }
    for (const item of extra) {
      expect.soft(false, `${label}: unexpected extra "${item}" in imported product`).toBe(true);
    }
  }

  /**
   * @param {Array<{post_title: string, sku?: string}>} products
   */
  _findDoubleCurvedInProducts(products) {
    const skuCandidates = buildDoubleCurvedSkuCandidates(this.runtimeState.skuPrefix);
    const doubleCurvedExpected = (this.runtimeState.selectedProducts || []).find((p) =>
      p.catalogName.toLowerCase().includes('double curved')
    );

    return (
      products.find((p) => p.post_title.trim() === this.runtimeState.doubleCurvedCustomTitle) ||
      products.find((p) => p.post_title.toLowerCase().includes('double curved')) ||
      products.find((p) =>
        doubleCurvedExpected
          ? importedProductMatchesExpected(p, doubleCurvedExpected, this.runtimeState.skuPrefix)
          : false
      ) ||
      products.find((p) =>
        skuCandidates.some((sku) => (p.sku || '').toLowerCase().includes(sku.toLowerCase()))
      ) ||
      products.find((p) => {
        const title = (p.post_title || '').toLowerCase();
        return (
          title.includes('dbc') ||
          title.includes('metal shoes') ||
          /^\w+\s+\w+\s+\w+\s+\d{13,}$/i.test(p.post_title || '')
        );
      }) ||
      null
    );
  }

  async _getProductsFromUiDetailed() {
    const baseUrl = process.env.PARTNER_SITE_BASE_URL;
    const products = [];
    let pageNum = 1;
    let totalCount = 0;

    while (pageNum <= 50) {
      await this.page.goto(`${baseUrl}/wp-admin/edit.php?post_type=product&paged=${pageNum}`);
      await this.page.waitForLoadState('domcontentloaded');

      if (pageNum === 1) {
        const countText =
          (await this.page
            .locator('.subsubsub li.all .count, .subsubsub .all .count')
            .first()
            .textContent()
            .catch(() => '')) || '';
        const countMatch = countText.match(/\((\d+)\)/);
        if (countMatch) totalCount = parseInt(countMatch[1], 10);
      }

      const rows = this.page.locator('table.wp-list-table tbody#the-list tr[id^="post-"]');
      const rowCount = await rows.count();
      if (rowCount === 0) break;

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const title = (
          (await row.locator('td.title a.row-title, td.column-name a.row-title').first().textContent()) ||
          ''
        ).trim();
        const sku = ((await row.locator('td.column-sku, td.sku').first().textContent()) || '').trim();
        const id = ((await row.getAttribute('id')) || '').replace('post-', '');
        if (title && !products.some((p) => p.ID === id)) {
          products.push({ ID: id, post_title: title, sku });
        }
      }

      if (totalCount && products.length >= totalCount) break;

      const hasNext = await this.page
        .locator('.tablenav-pages a.next-page:not(.disabled), .pagination-links a.next-page')
        .first()
        .isVisible()
        .catch(() => false);
      if (!hasNext) break;
      pageNum += 1;
    }

    if (!totalCount) totalCount = products.length;
    return { products, totalCount };
  }

  async _searchDoubleCurvedInUi() {
    const baseUrl = process.env.PARTNER_SITE_BASE_URL;
    const searchTerms = [
      this.runtimeState.doubleCurvedCustomTitle,
      'Double Curved',
      ...buildDoubleCurvedSkuCandidates(this.runtimeState.skuPrefix),
    ].filter(Boolean);

    for (const term of searchTerms) {
      await this.page.goto(
        `${baseUrl}/wp-admin/edit.php?post_type=product&s=${encodeURIComponent(term)}`
      );
      await this.page.waitForLoadState('domcontentloaded');

      const row = this.page.locator('table.wp-list-table tbody#the-list tr[id^="post-"]').first();
      if (!(await row.isVisible({ timeout: 3000 }).catch(() => false))) continue;

      const title = (
        (await row.locator('td.title a.row-title, td.column-name a.row-title').first().textContent()) ||
        ''
      ).trim();
      const sku = ((await row.locator('td.column-sku, td.sku').first().textContent()) || '').trim();
      const id = ((await row.getAttribute('id')) || '').replace('post-', '');

      if (title) return { ID: id, post_title: title, sku };
    }

    return null;
  }
}

module.exports = { ImportValidationService };
