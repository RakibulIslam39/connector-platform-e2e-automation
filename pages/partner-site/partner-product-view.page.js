'use strict';

const { BasePage } = require('../base.page');
const logger = require('../../common/utils/logger');

/**
 * PartnerProductViewPage — the PUBLIC product page on the partner WordPress site
 * (the storefront "view product" page, not the wp-admin editor).
 *
 * Confirmed DOM — each attribute option renders as:
 *   <div class="variation">
 *     <input type="radio" name="{type-slug}" value="{Value Name} ($54)"> <label>…</label>
 *   </div>
 * The control's `name` is the attribute type slug; its element/type reflects the
 * Type chosen at creation (Radio→radio, Dropdown→select, Checkbox→checkbox); the
 * value's Base Price is embedded in the option value/label as "($54)".
 */
class PartnerProductViewPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   * @param {string} [baseUrl]
   */
  constructor(page, baseUrl = process.env.PARTNER_SITE_BASE_URL) {
    super(page);
    this.baseUrl = baseUrl;
  }

  /** Maps a Connector Hub attribute Type to the control it renders on the frontend. */
  static expectedControlForType(type) {
    return (
      {
        radio: 'radio',
        dropdown: 'select',
        select: 'select',
        color: 'select', // Color renders as a <select> on the storefront
        checkbox: 'checkbox',
        text: 'text',
        textarea: 'text',
      }[String(type).trim().toLowerCase()] || null
    );
  }

  /** Attribute type name → control `name` slug (matches the frontend input name). */
  _slug(name) {
    return String(name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /** All option controls for an attribute (radio/checkbox/select share name=slug). */
  _controls(name) {
    return this.page.locator(`[name="${this._slug(name)}"]`);
  }

  /**
   * Opens the product's public page by post ID. `?p=ID` resolves any post by id
   * and redirects to its canonical permalink, so we don't need the slug.
   * @param {number|string} productId
   */
  async openById(productId) {
    // Cache-buster: the public product page is edge/full-page cached (Kinsta), so a
    // freshly imported attribute can be missing from a cached render even though it
    // exists in the DB (the admin editor shows it). A unique query param forces a
    // fresh, uncached response.
    const url = `${this.baseUrl}/?p=${productId}&nocache=${Date.now()}`;
    logger.info(`[PartnerProductViewPage] Opening product view: ${productId}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    await this.page
      .locator('.product, form.cart, body.single-product')
      .first()
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => {});
  }

  /**
   * Opens a WooCommerce product-data tab by its (partial) name and returns its
   * panel. Tabs render as role="tab" (e.g. "Shipping & Return", "FAQ Video").
   * @param {string|RegExp} name
   * @returns {Promise<import('@playwright/test').Locator>} the tab panel
   */
  async openTab(name) {
    const tab = this.page.getByRole('tab', { name }).first();
    await tab.waitFor({ state: 'visible', timeout: 15000 });
    await tab.click();
    const panel = this.page.getByRole('tabpanel').filter({ visible: true }).first();
    await panel.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    return panel;
  }

  /**
   * Validates the partner-specific Shipping & Returns policy TITLE is visible on
   * the product page. Content renders in `.hoodsly-partners-connector-accordion`
   * (the `.accordion-content` body is lazy/empty, so the title is the reliable
   * signal). Partner-scoped — only shown on this partner's product pages.
   * @param {string} title
   * @returns {Promise<boolean>}
   */
  async hasShippingPolicy(title) {
    await this.openTab(/shipping/i).catch(() => {});
    return this.page
      .locator('.hoodsly-partners-connector-accordion .accordion-title')
      .filter({ hasText: title })
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(
        () => true,
        () => false
      );
  }

  /**
   * Validates the partner-specific FAQ TITLE is visible on the product page.
   * FAQ renders in `.hoodsly-partners-connector-faq-video` (the `.faq_video-title`
   * carries the created question; the content body is lazy/empty). Partner-scoped.
   * @param {string} title
   * @returns {Promise<boolean>}
   */
  async hasFaq(title) {
    await this.openTab(/faq/i).catch(() => {});
    return this.page
      .locator('.hoodsly-partners-connector-faq-video .faq_video-title')
      .filter({ hasText: title })
      .first()
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(
        () => true,
        () => false
      );
  }

  /**
   * @param {string} name - attribute type name
   * @returns {Promise<boolean>} whether the attribute renders on the product page
   */
  async hasAttribute(name) {
    return this._controls(name)
      .first()
      .waitFor({ state: 'attached', timeout: 15000 })
      .then(
        () => true,
        () => false
      );
  }

  /**
   * Detects the rendered control kind for an attribute so it can be matched to
   * the Type chosen at creation.
   * @param {string} name
   * @returns {Promise<'select'|'radio'|'checkbox'|'text'|null>}
   */
  async getControlKind(name) {
    const control = this._controls(name).first();
    const info = await control
      .evaluate((el) => ({
        tag: el.tagName.toLowerCase(),
        type: (el.getAttribute('type') || '').toLowerCase(),
      }))
      .catch(() => null);
    if (!info) {
      return null;
    }
    if (info.tag === 'select') {
      return 'select';
    }
    if (info.tag === 'input') {
      if (info.type === 'radio') {
        return 'radio';
      }
      if (info.type === 'checkbox') {
        return 'checkbox';
      }
      if (info.type === 'text' || info.type === 'number') {
        return 'text';
      }
    }
    return null;
  }

  /**
   * @param {string} name - attribute type name (scope)
   * @param {number|string} basePrice - the value's Base Price
   * @returns {Promise<boolean>} whether that price appears for the attribute
   *
   * The price is embedded per Type: a <select> shows it in the <option> TEXT
   * ("… ($68)"); a radio/checkbox shows it in the input `value`/adjacent label
   * ("… ($54)"). Collect both in one DOM pass and match.
   */
  async hasOptionPrice(name, basePrice) {
    const amount = String(basePrice).replace(/[^0-9.]/g, '');
    const slug = this._slug(name);
    const controls = this.page.locator(`[name="${slug}"]`);
    if ((await controls.count()) === 0) {
      return false;
    }
    const texts = await controls.evaluateAll((els) => {
      const out = [];
      for (const el of els) {
        if (el.tagName.toLowerCase() === 'select') {
          for (const opt of el.querySelectorAll('option')) {
            out.push(opt.textContent || '');
          }
        } else {
          out.push(el.getAttribute('value') || '');
          const label =
            el.closest('label') || (el.parentElement && el.parentElement.querySelector('label'));
          if (label) {
            out.push(label.textContent || '');
          }
        }
      }
      return out;
    });
    const priceRe = new RegExp(`\\$\\s?${amount}(\\.0+)?\\b`);
    return texts.some((t) => priceRe.test(t));
  }
}

module.exports = { PartnerProductViewPage };
