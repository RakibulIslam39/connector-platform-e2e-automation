'use strict';

/**
 * WpCliService — WP-CLI execution wrapper for product and attribute validation.
 *
 * Execution modes (auto-detected from environment variables):
 *
 *   1. SSH remote  — WP_CLI_SSH_HOST is set
 *      ssh <WP_CLI_SSH_USER>@<WP_CLI_SSH_HOST> "cd <WP_CLI_PATH> && wp ..."
 *
 *   2. Local CLI   — WP_CLI_SSH_HOST is NOT set, WP_CLI_PATH is set
 *      cd <WP_CLI_PATH> && wp ...
 *
 *   3. REST API fallback — neither SSH nor local CLI available
 *      Uses the WordPress REST API to read products and metadata.
 *
 * Required env vars for SSH mode:
 *   WP_CLI_SSH_HOST   — remote server hostname/IP
 *   WP_CLI_SSH_USER   — SSH username (default: "wordpress")
 *   WP_CLI_PATH       — absolute path to WordPress root on remote (default: "/var/www/html")
 *   WP_CLI_SSH_KEY    — path to SSH private key file (optional, uses default if omitted)
 *
 * Required env vars for REST API fallback:
 *   PARTNER_SITE_BASE_URL  — base URL of the partner WordPress site
 *   WP_PARTNER_USER        — WordPress username
 *   WP_PARTNER_PASS        — WordPress application password or user password
 */

const { execSync } = require('child_process');
const logger = require('./logger');

class WpCliService {
  constructor(apiRequest = null) {
    this.apiRequest = apiRequest;
    this.sshHost = process.env.WP_CLI_SSH_HOST || null;
    this.sshUser = process.env.WP_CLI_SSH_USER || 'wordpress';
    this.wpPath = process.env.WP_CLI_PATH || '/var/www/html';
    this.sshKey = process.env.WP_CLI_SSH_KEY || null;
    this.partnerSiteUrl = process.env.PARTNER_SITE_BASE_URL || null;
    this.wpUser = process.env.WP_PARTNER_USER || null;
    this.wpPass = process.env.WP_PARTNER_PASS || null;

    this.mode = this._detectMode();
    logger.info(`[WpCliService] Running in mode: ${this.mode}`);
  }

  /**
   * Attach a Playwright APIRequestContext (typically page.request) so REST calls
   * reuse the authenticated WP admin session cookies.
   * @param {import('@playwright/test').APIRequestContext|null} apiRequest
   */
  setApiRequest(apiRequest) {
    this.apiRequest = apiRequest;
  }

  async _restFetchJson(url) {
    if (this.apiRequest) {
      const response = await this.apiRequest.get(url);
      if (!response.ok()) {
        throw new Error(`[WpCliService] REST request failed: ${response.status()}`);
      }
      return response.json();
    }

    const credentials = Buffer.from(`${this.wpUser}:${this.wpPass}`).toString('base64');
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`[WpCliService] REST request failed: ${response.status}`);
    }
    return response.json();
  }

  /**
   * @param {string} url
   * @returns {Promise<{data: any, totalPages: number, total: number}>}
   */
  async _restFetchPaged(url) {
    if (this.apiRequest) {
      const response = await this.apiRequest.get(url);
      if (!response.ok()) {
        throw new Error(`[WpCliService] REST request failed: ${response.status()}`);
      }
      const headers = response.headers();
      return {
        data: await response.json(),
        totalPages: parseInt(headers['x-wp-totalpages'] || '1', 10),
        total: parseInt(headers['x-wp-total'] || '0', 10),
      };
    }

    const credentials = Buffer.from(`${this.wpUser}:${this.wpPass}`).toString('base64');
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`[WpCliService] REST request failed: ${response.status}`);
    }
    return {
      data: await response.json(),
      totalPages: parseInt(response.headers.get('x-wp-totalpages') || '1', 10),
      total: parseInt(response.headers.get('x-wp-total') || '0', 10),
    };
  }

  // ─── Mode detection ─────────────────────────────────────────────────────────

  _detectMode() {
    if (this.sshHost) {
      return 'ssh';
    }
    if (this.wpPath && process.env.WP_CLI_LOCAL === 'true') {
      return 'local';
    }
    return 'rest-api';
  }

  // ─── Command execution ───────────────────────────────────────────────────────

  /**
   * Executes a raw WP-CLI command string and returns parsed JSON output.
   * @param {string} wpCmd - WP-CLI command WITHOUT the leading "wp" keyword
   * @returns {any} Parsed JSON result
   */
  _exec(wpCmd) {
    const fullCmd = this._buildCommand(wpCmd);
    logger.info(`[WpCliService] Executing: ${fullCmd}`);
    try {
      const output = execSync(fullCmd, { encoding: 'utf8', timeout: 30000 });
      return JSON.parse(output.trim());
    } catch (err) {
      logger.error(`[WpCliService] Command failed: ${err.message}`);
      throw new Error(`WP-CLI command failed: ${wpCmd}\n${err.message}`);
    }
  }

  /**
   * Executes a WP-CLI command and returns raw string output (non-JSON).
   * @param {string} wpCmd
   * @returns {string}
   */
  _execRaw(wpCmd) {
    const fullCmd = this._buildCommand(wpCmd);
    logger.info(`[WpCliService] Executing (raw): ${fullCmd}`);
    try {
      return execSync(fullCmd, { encoding: 'utf8', timeout: 30000 }).trim();
    } catch (err) {
      logger.error(`[WpCliService] Command failed: ${err.message}`);
      throw new Error(`WP-CLI command failed: ${wpCmd}\n${err.message}`);
    }
  }

  /**
   * Builds the full shell command based on execution mode.
   * @param {string} wpCmd - WP-CLI subcommand (without "wp" prefix)
   * @returns {string} Full shell command
   */
  _buildCommand(wpCmd) {
    const wp = `wp ${wpCmd}`;

    if (this.mode === 'ssh') {
      const keyArg = this.sshKey ? `-i "${this.sshKey}" ` : '';
      const remote = `cd "${this.wpPath}" && ${wp}`;
      return `ssh ${keyArg}-o StrictHostKeyChecking=no ${this.sshUser}@${this.sshHost} "${remote.replace(/"/g, '\\"')}"`;
    }

    if (this.mode === 'local') {
      return `cd "${this.wpPath}" && ${wp}`;
    }

    throw new Error(
      '[WpCliService] Cannot build CLI command in REST API mode — use REST methods instead'
    );
  }

  // ─── Product queries ─────────────────────────────────────────────────────────

  /**
   * Returns all WooCommerce products as an array of objects.
   * @returns {Promise<Array<{ID: string, post_title: string, post_status: string}>>}
   */
  async getProducts() {
    if (this.mode === 'rest-api') {
      return this._restGetProducts();
    }
    return this._exec(
      'post list --post_type=product --post_status=any --fields=ID,post_title,post_status --format=json'
    );
  }

  /**
   * Finds a product by its exact title. Returns the first match or null.
   * @param {string} title
   * @returns {Promise<{ID: string, post_title: string}|null>}
   */
  async getProductByTitle(title) {
    const products = await this.getProducts();
    const normalized = title.toLowerCase().trim();
    const match = products.find((p) => p.post_title.toLowerCase().trim() === normalized);
    return match || null;
  }

  /**
   * Finds a product whose title contains the given substring (case-insensitive).
   * @param {string} substring
   * @returns {Promise<{ID: string, post_title: string}|null>}
   */
  async findProductByTitleContains(substring) {
    const products = await this.getProducts();
    const normalized = substring.toLowerCase().trim();
    const match = products.find((p) => p.post_title.toLowerCase().includes(normalized));
    return match || null;
  }

  /**
   * Returns all published product titles as an array of strings.
   * @returns {Promise<string[]>}
   */
  async getProductTitles() {
    const products = await this.getProducts();
    return products.map((p) => p.post_title.trim());
  }

  // ─── Meta queries ────────────────────────────────────────────────────────────

  /**
   * Retrieves a single post meta value.
   * @param {string|number} postId
   * @param {string} metaKey
   * @returns {Promise<string>}
   */
  async getProductMeta(postId, metaKey) {
    if (this.mode === 'rest-api') {
      return this._restGetMeta(postId, metaKey);
    }
    return this._execRaw(`post meta get ${postId} ${metaKey}`);
  }

  // ─── Term/Taxonomy queries ───────────────────────────────────────────────────

  /**
   * Returns all taxonomy terms assigned to a product.
   * @param {string|number} postId
   * @param {string} taxonomy - e.g. 'pa_color', 'pa_size'
   * @returns {Promise<Array<{term_id: string, name: string, slug: string}>>}
   */
  async getTermsForProduct(postId, taxonomy) {
    if (this.mode === 'rest-api') {
      return this._restGetTermsForProduct(postId, taxonomy);
    }
    return this._exec(
      `post term list ${postId} ${taxonomy} --fields=term_id,name,slug --format=json`
    );
  }

  /**
   * Returns all terms registered for a taxonomy (not filtered by product).
   * @param {string} taxonomy
   * @returns {Promise<Array<{term_id: string, name: string, slug: string, count: string}>>}
   */
  async getTaxonomyTerms(taxonomy) {
    if (this.mode === 'rest-api') {
      return this._restGetTaxonomyTerms(taxonomy);
    }
    return this._exec(`term list ${taxonomy} --fields=term_id,name,slug,count --format=json`);
  }

  /**
   * Returns term names assigned to a product for a given taxonomy.
   * Convenience wrapper around getTermsForProduct().
   * @param {string|number} postId
   * @param {string} taxonomy
   * @returns {Promise<string[]>}
   */
  async getTermNamesForProduct(postId, taxonomy) {
    const terms = await this.getTermsForProduct(postId, taxonomy);
    return terms.map((t) => t.name);
  }

  // ─── REST API fallback ───────────────────────────────────────────────────────

  /**
   * Fetches products via WP REST API.
   * Paginates up to 100 products per request.
   * @returns {Promise<Array>}
   */
  async _restGetProducts() {
    if (!this.partnerSiteUrl) {
      throw new Error('[WpCliService] PARTNER_SITE_BASE_URL is required for REST API mode');
    }

    try {
      return await this._restGetWcV3Products();
    } catch (err) {
      if (!String(err.message).includes('401')) {
        throw err;
      }
      // WC v3 needs auth (keys/nonce). The WC Store API is public and DOES return
      // `sku`, so prefer it over the WP v2 fallback (which has no sku field).
      const storeProducts = await this._restGetStoreApiProducts().catch(() => []);
      if (storeProducts.length > 0) {
        return storeProducts;
      }
      return this._restGetWpV2Products();
    }
  }

  /**
   * Fetches products via the public WooCommerce Store API (no auth required).
   * Unlike WP v2, this exposes `sku`.
   * @returns {Promise<Array>}
   */
  async _restGetStoreApiProducts() {
    const allProducts = [];
    let pageNum = 1;
    let totalPages = 1;

    while (pageNum <= totalPages && pageNum <= 50) {
      const url = `${this.partnerSiteUrl}/wp-json/wc/store/v1/products?per_page=100&page=${pageNum}`;
      const { data: products, totalPages: headerPages } = await this._restFetchPaged(url);

      if (!Array.isArray(products) || products.length === 0) {
        break;
      }
      allProducts.push(...products);
      totalPages = headerPages || 1;
      pageNum += 1;
    }

    return allProducts.map((p) => ({
      ID: String(p.id),
      post_title: p.name,
      post_status: 'publish',
      sku: p.sku || '',
    }));
  }

  async _restGetWcV3Products() {
    const allProducts = [];
    let pageNum = 1;
    let totalPages = 1;

    while (pageNum <= totalPages && pageNum <= 50) {
      const url = `${this.partnerSiteUrl}/wp-json/wc/v3/products?per_page=100&page=${pageNum}`;
      const { data: products, totalPages: headerPages } = await this._restFetchPaged(url);

      if (!Array.isArray(products) || products.length === 0) {
        break;
      }
      allProducts.push(...products);
      totalPages = headerPages || 1;
      pageNum += 1;
    }

    return allProducts.map((p) => ({
      ID: String(p.id),
      post_title: p.name,
      post_status: p.status,
      sku: p.sku || '',
    }));
  }

  async _restGetWpV2Products() {
    const allProducts = [];
    let pageNum = 1;
    let totalPages = 1;

    while (pageNum <= totalPages && pageNum <= 50) {
      const url = `${this.partnerSiteUrl}/wp-json/wp/v2/product?per_page=100&page=${pageNum}`;
      const { data: products, totalPages: headerPages } = await this._restFetchPaged(url);

      if (!Array.isArray(products) || products.length === 0) {
        break;
      }
      allProducts.push(...products);
      totalPages = headerPages || 1;
      pageNum += 1;
    }

    return allProducts.map((p) => ({
      ID: String(p.id),
      post_title: typeof p.title === 'string' ? p.title : p.title?.rendered || '',
      post_status: p.status,
      sku: p.meta?.sku || p.sku || '',
    }));
  }

  /**
   * Finds a product by SKU (exact or partial match).
   * @param {string} sku
   * @returns {Promise<{ID: string, post_title: string, sku: string}|null>}
   */
  async findProductBySku(sku) {
    const products = await this.getProducts();
    const normalized = sku.toLowerCase().trim();
    const match = products.find(
      (p) =>
        (p.sku || '').toLowerCase() === normalized ||
        (p.sku || '').toLowerCase().includes(normalized)
    );
    return match || null;
  }

  /**
   * Fetches post meta via WP REST API (requires Application Passwords or cookie auth).
   */
  async _restGetMeta(postId, metaKey) {
    if (!this.partnerSiteUrl) {
      throw new Error('[WpCliService] PARTNER_SITE_BASE_URL is required for REST API mode');
    }
    const url = `${this.partnerSiteUrl}/wp-json/wp/v2/product/${postId}?context=edit`;
    const data = await this._restFetchJson(url);
    return data.meta?.[metaKey] ?? null;
  }

  /**
   * Fetches taxonomy terms for a product via WC REST API.
   */
  async _restGetTermsForProduct(postId, taxonomy) {
    if (!this.partnerSiteUrl) {
      throw new Error('[WpCliService] PARTNER_SITE_BASE_URL is required for REST API mode');
    }
    const url = `${this.partnerSiteUrl}/wp-json/wc/v3/products/${postId}`;
    let product;
    try {
      product = await this._restFetchJson(url);
    } catch (err) {
      if (!String(err.message).includes('401')) {
        throw err;
      }
      return [];
    }
    const attr = (product.attributes || []).find(
      (a) =>
        a.slug === taxonomy ||
        `pa_${a.slug}` === taxonomy ||
        a.name?.toLowerCase() === taxonomy.replace(/^pa_/, '').replace(/_/g, ' ')
    );
    if (!attr) {
      return [];
    }
    return (attr.options || []).map((name, i) => ({
      term_id: String(i),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
    }));
  }

  /**
   * Fetches all terms for a taxonomy via WP REST API.
   */
  async _restGetTaxonomyTerms(taxonomy) {
    if (!this.partnerSiteUrl) {
      throw new Error('[WpCliService] PARTNER_SITE_BASE_URL is required for REST API mode');
    }
    const endpoint = taxonomy.startsWith('pa_')
      ? `${this.partnerSiteUrl}/wp-json/wc/v3/products/attributes`
      : `${this.partnerSiteUrl}/wp-json/wp/v2/${taxonomy}`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`[WpCliService] REST terms request failed: ${response.status}`);
    }
    return await response.json();
  }

  // ─── Convenience: availability check ────────────────────────────────────────

  /**
   * Returns true if WP-CLI execution (SSH or local) is available.
   * Falls back gracefully to UI-based validation when this returns false.
   */
  isCliAvailable() {
    return this.mode === 'ssh' || this.mode === 'local';
  }
}

module.exports = { WpCliService };
