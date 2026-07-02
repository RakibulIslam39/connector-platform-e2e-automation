'use strict';

const { ApiClient } = require('./api-client');
const { CONNECTOR_API } = require('../../constants/api-endpoints');
const logger = require('../utils/logger');

/**
 * Connector Platform API service.
 * Provides typed methods for all Connector Platform endpoints.
 */
class ConnectorApiService extends ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    super(request, CONNECTOR_API.BASE, {
      'api-signature': process.env.CONNECTOR_API_SIGNATURE,
      website: process.env.BASE_URL,
    });
  }

  // ─── Products ────────────────────────────────────────────────────────────────

  /**
   * Fetches all products from the Connector Platform.
   * GET /wp-json/connector-platform/v1/products
   *
   * API response shape: { success: true, partner_type: "b2c", data: [...] }
   * Returns the raw body so callers can access both .data and .partner_type.
   * Use getProductsList() to get just the products array.
   */
  async getProducts(params = {}) {
    logger.info('[ConnectorAPI] Fetching products');
    const { body } = await this.get(CONNECTOR_API.PRODUCTS, { params });
    return body;
  }

  /**
   * Fetches only the products array from the response (convenience wrapper).
   * @returns {Array} Products array from body.data
   */
  async getProductsList(params = {}) {
    const body = await this.getProducts(params);
    if (Array.isArray(body)) {
      return body;
    }
    if (body && Array.isArray(body.data)) {
      return body.data;
    }
    return [];
  }

  /**
   * Fetches a single product by ID.
   */
  async getProductById(productId) {
    logger.info(`[ConnectorAPI] Fetching product: ${productId}`);
    const { body } = await this.get(`${CONNECTOR_API.PRODUCTS}/${productId}`);
    // Handle wrapped response if needed
    return body && body.data ? body.data : body;
  }

  /**
   * Validates that a specific product exists and has required fields.
   */
  async validateProduct(productId, requiredFields = []) {
    const product = await this.getProductById(productId);
    const missing = requiredFields.filter((field) => !product[field]);
    if (missing.length > 0) {
      throw new Error(`Product ${productId} missing fields: ${missing.join(', ')}`);
    }
    return product;
  }

  // ─── Attributes Mapping ──────────────────────────────────────────────────────

  /**
   * Fetches the complete attributes mapping configuration.
   * GET /wp-json/connector-platform/v1/attributes-mapping
   */
  async getAttributesMapping() {
    logger.info('[ConnectorAPI] Fetching attributes mapping');
    const { body } = await this.get(CONNECTOR_API.ATTRIBUTES_MAPPING);
    return body;
  }

  /**
   * Fetches mapping for a specific attribute.
   */
  async getAttributeMapping(attributeKey) {
    const mappings = await this.getAttributesMapping();
    const mapping = mappings.find(
      (m) => m.key === attributeKey || m.attribute === attributeKey
    );
    if (!mapping) {
      throw new Error(`Attribute mapping not found for key: ${attributeKey}`);
    }
    return mapping;
  }

  // ─── Partners ────────────────────────────────────────────────────────────────

  /**
   * Fetches all partners.
   */
  async getPartners() {
    logger.info('[ConnectorAPI] Fetching partners');
    const { body } = await this.get(CONNECTOR_API.PARTNERS);
    return body;
  }

  /**
   * Fetches a partner's color catalog.
   */
  async getPartnerColors(partnerId) {
    logger.info(`[ConnectorAPI] Fetching colors for partner: ${partnerId}`);
    const { body } = await this.get(`${CONNECTOR_API.PARTNER_COLORS}?partner_id=${partnerId}`);
    return body;
  }

  // ─── SKU ─────────────────────────────────────────────────────────────────────

  /**
   * Validates SKU generation for given product attributes.
   */
  async validateSkuGeneration(attributes) {
    logger.info('[ConnectorAPI] Validating SKU generation', { attributes });
    const { body } = await this.post(CONNECTOR_API.SKU, attributes);
    return body;
  }

  // ─── Sync ────────────────────────────────────────────────────────────────────

  /**
   * Checks sync status between Connector Platform and partner site.
   */
  async getSyncStatus(partnerId) {
    logger.info(`[ConnectorAPI] Checking sync status for partner: ${partnerId}`);
    const { body } = await this.get(`${CONNECTOR_API.SYNC_STATUS}?partner_id=${partnerId}`);
    return body;
  }

  // ─── Health check ────────────────────────────────────────────────────────────

  /**
   * Verifies the API is responsive and authenticated.
   */
  async healthCheck() {
    try {
      await this.getProducts({ per_page: 1 });
      logger.info('[ConnectorAPI] Health check passed');
      return true;
    } catch (err) {
      logger.error('[ConnectorAPI] Health check failed', err);
      return false;
    }
  }
}

module.exports = { ConnectorApiService };
