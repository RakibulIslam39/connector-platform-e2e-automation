'use strict';

/**
 * Centralized URL constants.
 * All paths are relative to their respective baseURL environment variable.
 */

const WP_PATHS = {
  LOGIN: '/wp-login.php',
  ADMIN: '/wp-admin/',
  ADMIN_PLUGINS: '/wp-admin/plugins.php',
  ADMIN_SETTINGS: '/wp-admin/options-general.php',
};

const CONNECTOR_PATHS = {
  DASHBOARD: '/wp-admin/admin.php?page=connector-hub#/dashboard',
  PARTNERS: '/wp-admin/admin.php?page=connector-hub#/partners',
  PARTNER_CREATE: '/wp-admin/admin.php?page=connector-hub#/partners?action=add',
  PRODUCTS: '/wp-admin/admin.php?page=connector-hub#/products',
  ATTRIBUTE_MAPPING: '/wp-admin/admin.php?page=connector-hub#/attributes',
  SETTINGS: '/wp-admin/admin.php?page=connector-hub#/settings',
  LOGS: '/wp-admin/admin.php?page=connector-hub#/logs',
  PLATFORM_SETTINGS: '/wp-admin/admin.php?page=connector-hub#/platform-settings',
  PARTNER_ORDER_LOG: '/wp-admin/admin.php?page=connector-hub#/platform-settings/partner-order-log',
};

const HUB_PATHS = {
  DASHBOARD: '/wp-admin/',
  ORDERS: '/wp-admin/edit.php?post_type=shop_order',
  ORDER_PLACEMENT: '/wp-admin/admin.php?page=manual-placement',
  SETTINGS: '/wp-admin/admin.php?page=hoodslyhub-settings',
  PARTNER_SOURCE: '/wp-admin/admin.php?page=hoodslyhub-partner-source',
  DAMAGE_CLAIMS: '/wp-admin/admin.php?page=damage-claims',
  ROLES: '/wp-admin/users.php',
  WAREHOUSE: '/wp-admin/admin.php?page=warehouse-orders',
  FLOATING_SHELVES: '/wp-admin/admin.php?page=floating-shelves',
};

const WRH_PATHS = {
  ORDERS: '/wp-admin/edit.php?post_type=shop_order',
  DASHBOARD: '/wp-admin/',
};

const WIKS_PATHS = {
  ORDERS: '/wp-admin/edit.php?post_type=shop_order',
  DASHBOARD: '/wp-admin/',
};

const PARTNER_SITE_PATHS = {
  HOME: '/',
  SHOP: '/shop',
  CART: '/cart',
  CHECKOUT: '/checkout',
  MY_ACCOUNT: '/my-account',
  ORDER_TRACKING: '/my-account/orders',
};

const PARTNER_SITE_ADMIN_PATHS = {
  DASHBOARD: '/wp-admin/',
  PLUGINS: '/wp-admin/plugins.php',
  WOOCOMMERCE_ORDERS: '/wp-admin/admin.php?page=wc-orders',
};

module.exports = {
  WP_PATHS,
  CONNECTOR_PATHS,
  HUB_PATHS,
  WRH_PATHS,
  WIKS_PATHS,
  PARTNER_SITE_PATHS,
  PARTNER_SITE_ADMIN_PATHS,
};
