'use strict';

/**
 * API endpoint constants for Connector Platform and Hub APIs.
 */

const CONNECTOR_API = {
  BASE: process.env.CONNECTOR_API_BASE_URL || 'https://hoodslypartnersconnector3.kinsta.cloud',
  PRODUCTS: '/wp-json/connector-platform/v1/products',
  ATTRIBUTES_MAPPING: '/wp-json/connector-platform/v1/attributes-mapping',
  PARTNERS: '/wp-json/connector-platform/v1/partners',
  PARTNER_COLORS: '/wp-json/connector-platform/v1/partner-colors',
  SKU: '/wp-json/connector-platform/v1/sku',
  SYNC_STATUS: '/wp-json/connector-platform/v1/sync-status',
};

const HUB_API = {
  BASE: process.env.HUB_BASE_URL || '',
  ORDERS: '/wp-json/hoodslyhub/v1/orders',
  ORDER_STATUS: '/wp-json/hoodslyhub/v1/order-status',
  PARTNERS: '/wp-json/hoodslyhub/v1/partners',
  SHIPPING: '/wp-json/hoodslyhub/v1/shipping',
  TRACKING: '/wp-json/hoodslyhub/v1/tracking',
};

const WP_REST_API = {
  POSTS: '/wp-json/wp/v2/posts',
  PRODUCTS_WOO: '/wp-json/wc/v3/products',
  ORDERS_WOO: '/wp-json/wc/v3/orders',
  CATEGORIES: '/wp-json/wc/v3/products/categories',
  ATTRIBUTES: '/wp-json/wc/v3/products/attributes',
};

module.exports = {
  CONNECTOR_API,
  HUB_API,
  WP_REST_API,
};
