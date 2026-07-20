'use strict';

const { BasePage } = require('../base.page');
const { parsePriceText } = require('../../common/utils/random-data-generator');
const { normalizeAttributeName } = require('../../common/utils/attribute-matcher');
const logger = require('../../common/utils/logger');

/**
 * PartnerProductEditPage — WooCommerce product edit on the partner WordPress site.
 *
 * Hoodsly connector Custom Price panel (#custom_price_data) uses Bootstrap-style accordions:
 *   h5.accordion-header[data-target="#accordion-{slug}"] → div#accordion-{slug} table.widefat
 */
class PartnerProductEditPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} [baseUrl]
   */
  constructor(page, baseUrl = process.env.PARTNER_SITE_BASE_URL) {
    super(page);
    this.baseUrl = baseUrl;
  }

  /** @returns {import('@playwright/test').Locator} */
  _customPricePanel() {
    return this.page.locator('#custom_price_data');
  }

  async openProductEdit(productId) {
    const url = `${this.baseUrl}/wp-admin/post.php?post=${productId}&action=edit`;
    logger.info(`[PartnerProductEditPage] Opening product edit: ${productId}`);
    // Wait for DOM readiness, not the full 'load' event — this heavy WooCommerce
    // admin page (remote widgets/iframes) can exceed goto's default 'load' wait
    // even though the editor is already usable. Element waits below gate readiness.
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page.locator('#title').waitFor({ state: 'visible', timeout: 20000 });
    await this.page
      .locator('#woocommerce-product-data')
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  async getProductTitle() {
    return (await this.page.locator('#title').inputValue()).trim();
  }

  /**
   * @param {string|RegExp} name - the attribute type name / accordion header label
   * @returns {Promise<boolean>} whether an accordion for that attribute exists in
   *   the Product data → Custom Price panel (i.e. the attribute was imported).
   */
  async hasCustomPriceSection(name) {
    await this.openCustomPriceTab();
    const header = this._accordionHeader(this._customPricePanel(), { label: name });
    return header.waitFor({ state: 'visible', timeout: 10000 }).then(
      () => true,
      () => false
    );
  }

  async openCustomPriceTab() {
    const panel = this.page.locator('#woocommerce-product-data');
    await panel.waitFor({ state: 'visible', timeout: 15000 });
    await panel.locator('ul.wc-tabs li a[href="#custom_price_data"]').first().click();
    await this._customPricePanel().waitFor({ state: 'visible', timeout: 10000 });
    logger.info('[PartnerProductEditPage] Opened Product Data → Custom Price');
  }

  /**
   * Locates an accordion header inside #custom_price_data.
   * Live DOM uses h5[data-target]; class accordion-header may be absent.
   */
  _accordionHeader(panel, { targetId = null, label = null } = {}) {
    if (targetId) {
      return panel
        .locator(`h5[data-target="#${targetId}"], h5.accordion-header[data-target="#${targetId}"]`)
        .first();
    }
    const headers = panel.locator('h5[data-target], h5.accordion-header');
    if (label instanceof RegExp) {
      return headers.filter({ hasText: label }).first();
    }
    return headers.filter({ hasText: new RegExp(`^\\s*${label}\\s*$`, 'i') }).first();
  }

  /**
   * Expands an accordion by its header label or CSS target id.
   * @param {string|RegExp} headerLabel - e.g. "Color Options", "Size", /^Ventilation Options/
   * @param {string} [targetId] - e.g. "accordion-color_options"
   */
  async expandAccordion(headerLabel, targetId = null) {
    await this.openCustomPriceTab();
    const panel = this._customPricePanel();

    const header = targetId
      ? this._accordionHeader(panel, { targetId })
      : this._accordionHeader(panel, {
          label: headerLabel instanceof RegExp ? headerLabel : headerLabel,
        });

    await header.waitFor({ state: 'visible', timeout: 10000 });
    const target = (await header.getAttribute('data-target')) || '';
    const collapse = panel.locator(target);

    const expanded = await header.getAttribute('aria-expanded');
    if (expanded !== 'true') {
      await header.click();
      await collapse.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      await this.page.waitForTimeout(300);
    }

    logger.info(`[PartnerProductEditPage] Expanded accordion: ${target || headerLabel}`);
    return collapse;
  }

  /**
   * Reads option rows from an expanded accordion body's pricing table.
   * @param {import('@playwright/test').Locator} accordionCollapse
   * @returns {Promise<Array<{ optionName: string, currentPrice: number|null, customPrice: number|null }>>}
   */
  async _readAccordionTable(accordionCollapse) {
    // Extract every row's cells in ONE DOM pass. Reading per-row via locators
    // costs several remote round-trips each (and an isVisible wait), which is
    // ~2.5 min for 87 colors on a remote host; a single evaluate is ~1 round-trip.
    const raw = await accordionCollapse.evaluate((root) => {
      const out = [];
      for (const row of root.querySelectorAll('table.widefat tbody tr')) {
        const cells = row.querySelectorAll('td');
        if (cells.length < 2) {
          continue;
        }
        const optionName = (cells[0].textContent || '').replace(/\s+/g, ' ').trim();
        if (!optionName || /option name/i.test(optionName)) {
          continue;
        }
        const input = cells[2]
          ? cells[2].querySelector('input[type="number"], input[type="text"]')
          : null;
        out.push({
          optionName,
          currentText: (cells[1].textContent || '').trim(),
          customText: input ? input.value || '' : '',
        });
      }
      return out;
    });

    return raw.map((r) => ({
      optionName: r.optionName,
      currentPrice: r.currentText ? parsePriceText(r.currentText) : null,
      customPrice: r.customText ? parsePriceText(r.customText) : null,
    }));
  }

  /**
   * @param {string} targetId - accordion id without #, e.g. "accordion-size"
   * @returns {Promise<Array<{ optionName: string, currentPrice: number|null, customPrice: number|null }>>}
   */
  async getAccordionTableRows(targetId) {
    const collapse = await this.expandAccordion(null, targetId);
    return this._readAccordionTable(collapse);
  }

  /**
   * Reads EVERY Custom Price accordion in a single DOM pass. The option tables
   * are present in the markup even while the accordion is collapsed, so no
   * per-section expand/click is needed (fast + reliable on remote hosts).
   *
   * Each section is keyed by its stable `slug` (from the accordion's id /
   * `data-target`, e.g. "ventilation_options_36", "non-duct_kit_broan"), which
   * uniquely identifies a group even when the visible header repeats
   * ("Non-Duct Kit" appears 5×). `header` is the visible label; `options` are the
   * Option Name cells.
   * @returns {Promise<Array<{ slug: string, header: string, options: string[] }>>}
   */
  async getAllCustomPriceSections() {
    await this.openCustomPriceTab();
    return this._customPricePanel().evaluate((panel) => {
      const sections = [];
      for (const item of panel.querySelectorAll('.accordion-item')) {
        const header = (item.querySelector('.accordion-header')?.textContent || '')
          .replace(/\s+/g, ' ')
          .trim();
        const collapse = item.querySelector('.accordion-collapse, [id^="accordion-"]');
        const slug = (collapse?.id || '').replace(/^accordion-/, '');
        const options = [];
        for (const row of item.querySelectorAll('table.widefat tbody tr')) {
          const cell = row.querySelector('td');
          const name = (cell?.textContent || '').replace(/\s+/g, ' ').trim();
          if (name && !/option name/i.test(name)) {
            options.push(name);
          }
        }
        sections.push({ slug, header, options });
      }
      return sections;
    });
  }

  /**
   * Reads the option names under a Custom Price accordion, located by its exact
   * header label (e.g. "Ventilation Options 36", "Trim Options"). Reusable
   * building block for exact per-group validation. Returns [] if not present.
   * @param {string|RegExp} headerLabel
   * @returns {Promise<string[]>}
   */
  async getSectionOptionNames(headerLabel) {
    try {
      const collapse = await this.expandAccordion(headerLabel);
      const rows = await this._readAccordionTable(collapse);
      return rows.map((r) => r.optionName).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Color Options accordion — Our Color Options, Custom Color Match Options, Primed/Paint Ready.
   */
  async getColorOptionsPricingTable() {
    try {
      // Fast existence check — many products have no separate Color Options
      // accordion, so skip the 10s header wait inside expandAccordion.
      await this.openCustomPriceTab();
      const header = this._accordionHeader(this._customPricePanel(), {
        targetId: 'accordion-color_options',
      });
      if ((await header.count()) === 0) {
        return [];
      }
      const rows = await this.getAccordionTableRows('accordion-color_options');
      logger.info(`[PartnerProductEditPage] Color Options rows: ${rows.length}`);
      return rows;
    } catch (err) {
      logger.warn(`[PartnerProductEditPage] Color Options accordion unavailable: ${err.message}`);
      return [];
    }
  }

  /**
   * Partner Colors from #accordion-color table rows.
   */
  async getPartnerColorNames() {
    const collapse = await this.expandAccordion('Color', 'accordion-color');
    await collapse
      .locator('table.widefat tbody tr')
      .first()
      .waitFor({ state: 'attached', timeout: 5000 })
      .catch(() => {});

    const rows = await this._readAccordionTable(collapse);
    const names = rows.map((r) => r.optionName).filter(Boolean);

    logger.info(`[PartnerProductEditPage] Partner colors: ${names.length}`);
    return names;
  }

  /**
   * Partner Sizes from #accordion-size.
   */
  async getPartnerSizeNames() {
    const rows = await this.getAccordionTableRows('accordion-size');
    const names = rows.map((r) => r.optionName).filter(Boolean);
    logger.info(`[PartnerProductEditPage] Partner sizes: ${names.length}`);
    return names;
  }

  /**
   * Partner Ventilations — union of brand names across Ventilation Options 36/42/48/54/60 accordions.
   */
  async getPartnerVentilationNames() {
    await this.openCustomPriceTab();
    const panel = this._customPricePanel();
    const headers = panel.locator(
      'h5[data-target^="#accordion-ventilation_options_"], h5.accordion-header[data-target^="#accordion-ventilation_options_"]'
    );
    const count = await headers.count();
    const vents = new Set();

    for (let i = 0; i < count; i++) {
      const header = headers.nth(i);
      const target = ((await header.getAttribute('data-target')) || '').replace('#', '');
      const collapse = panel.locator(`#${target}`);
      const expanded = await header.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await header.click();
        await collapse.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
      const rows = await this._readAccordionTable(collapse);

      for (const row of rows) {
        if (!row.optionName || /^none$/i.test(row.optionName)) {
          continue;
        }
        vents.add(row.optionName.trim());
      }
    }

    const result = [...vents];
    logger.info(`[PartnerProductEditPage] Partner ventilations: ${result.length}`);
    return result;
  }

  /**
   * Partner Trims — the "Trim Options" accordion (Classic Trim, Flat Trim, …).
   *
   * A product can also render a separate "How would you like your trim?" accordion
   * (options: Installed / Removed / Remove Side Trim). That is a DIFFERENT attribute,
   * not the partner Trims taxonomy, so it must be excluded — otherwise its options
   * leak in as false "extra" trims. Match "trim" headers but drop the question form.
   */
  async getPartnerTrimNames() {
    await this.openCustomPriceTab();
    const panel = this._customPricePanel();
    const headers = panel
      .locator('h5[data-target], h5.accordion-header')
      .filter({ hasText: /trim/i })
      .filter({ hasNotText: /how would you like/i });
    const count = await headers.count();
    const trims = new Set();

    for (let i = 0; i < count; i++) {
      const header = headers.nth(i);
      const target = ((await header.getAttribute('data-target')) || '').replace('#', '');
      if (!target) {
        continue;
      }
      const collapse = panel.locator(`#${target}`);
      if ((await header.getAttribute('aria-expanded')) !== 'true') {
        await header.click();
        await collapse.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
      const rows = await this._readAccordionTable(collapse);
      for (const row of rows) {
        if (!row.optionName || /^none$/i.test(row.optionName)) {
          continue;
        }
        trims.add(row.optionName.trim());
      }
    }

    const result = [...trims];
    logger.info(`[PartnerProductEditPage] Partner trims: ${result.length}`);
    return result;
  }

  /**
   * @param {string} attributeLabel - Color | Ventilation | Trim | Size
   */
  async getAttributeValues(attributeLabel) {
    const normalized = normalizeAttributeName(attributeLabel);

    if (normalized.includes('color')) {
      return this.getPartnerColorNames();
    }
    if (normalized.includes('ventilation')) {
      return this.getPartnerVentilationNames();
    }
    if (normalized.includes('trim')) {
      return this.getPartnerTrimNames();
    }
    if (normalized.includes('size')) {
      return this.getPartnerSizeNames();
    }

    logger.warn(`[PartnerProductEditPage] Unknown attribute label: ${attributeLabel}`);
    return [];
  }

  /**
   * Primed / Paint Ready — from Color Options table or Color accordion row.
   */
  async getPrimedPaintReadyValues(customName = null) {
    // During Partner Creation the "Primed / Paint Ready" option is renamed to a
    // custom name, so match either the original label OR the stored custom name.
    const wanted = (customName || '').trim().toLowerCase();
    const matchRow = (r) =>
      /primed.*paint.*ready/i.test(r.optionName) ||
      (wanted && r.optionName.trim().toLowerCase() === wanted);

    const colorOptions = await this.getColorOptionsPricingTable();
    let primedRow = colorOptions.find(matchRow);

    if (!primedRow) {
      const colorRows = await this.getAccordionTableRows('accordion-color');
      primedRow = colorRows.find(matchRow);
    }

    if (primedRow) {
      return {
        customName: primedRow.optionName,
        customPrice: primedRow.customPrice,
        currentPrice: primedRow.currentPrice,
      };
    }

    logger.info(
      '[PartnerProductEditPage] Primed/Paint Ready row not found in Custom Price accordions'
    );
    return { customName: null, customPrice: null, currentPrice: null };
  }
}

module.exports = { PartnerProductEditPage };
