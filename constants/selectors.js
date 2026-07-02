'use strict';

/**
 * Connector Hub SPA selectors.
 *
 * The Connector Platform 2.0 uses a modern SPA (Vue/React) embedded in
 * /wp-admin/admin.php?page=connector-hub. All partner and product management
 * happens inside this SPA — NOT in the native WordPress CPT editor.
 *
 * Use these constants with page.locator() in page objects.
 * For role-based selectors (radio, button) prefer page.getByRole() in page objects.
 */

const CONNECTOR_SELECTORS = {
  // ── Partner List page (#/partners) ───────────────────────────────────────
  PARTNER_SEARCH_INPUT: 'input[placeholder="Search partners..."]',
  PARTNER_PLATFORM_FILTER: 'select option[value=""]',   // first combobox near "All Platforms"
  PARTNER_TABLE_ROWS: 'table tbody tr',
  ADD_PARTNER_LINK: 'a[href*="action=add"]',

  // ── Partner form — Basic Info tab ─────────────────────────────────────────
  PARTNER_NAME_INPUT: 'input[placeholder="Enter partner name"]',
  SKU_PREFIX_INPUT: 'input[placeholder="e.g., HS-"]',
  WEBSITE_URL_INPUT: 'input[placeholder="https://example.com"]',
  API_KEY_INPUT: 'input[placeholder="API key will be auto-generated"]',
  GENERATE_API_KEY_BTN: 'button:has-text("Generate")',
  UPDATE_PARTNER_BTN: 'button:has-text("Update Partner")',
  CANCEL_LINK: 'a:has-text("Cancel")',

  // ── Partner form — tab navigation ─────────────────────────────────────────
  BASIC_INFO_TAB: 'button:has-text("Basic Info")',
  PRODUCTS_TAB: 'button:has-text("Products")',
  ATTRIBUTES_TAB: 'button:has-text("Attributes")',
  FAQS_SHIPPING_TAB: 'button:has-text("FAQs & Shipping")',

  // ── Partner form — Products tab ───────────────────────────────────────────
  ADD_PRODUCTS_BTN: 'button:has-text("Add Products")',

  // ── Partner form — Attributes tab ─────────────────────────────────────────
  AVAILABLE_ATTRIBUTES_HEADING: 'text=Available Attributes',
  COLORS_ACCORDION_LABEL: 'text=Partner Colors',
  VENTILATIONS_ACCORDION_LABEL: 'text=Partner Ventilations',
  TRIMS_ACCORDION_LABEL: 'text=Partner Trims',
  SIZES_ACCORDION_LABEL: 'text=Partner Sizes',

  // ── Product List page (#/products) ────────────────────────────────────────
  PRODUCT_SEARCH_INPUT: 'input[placeholder="Search products..."]',
  PRODUCT_TABLE_ROWS: 'table tbody tr',
  ADD_PRODUCT_LINK: 'a[href*="action=add"]',

  // ── Product form — tab navigation ─────────────────────────────────────────
  PRODUCT_BASIC_INFO_TAB: 'button:has-text("Basic Info")',
  PRODUCT_ATTRIBUTES_TAB: 'button:has-text("Attributes")',
  PRODUCT_PARTNERS_TAB: 'button:has-text("Partners")',

  // ── Product form — Basic Info tab ─────────────────────────────────────────
  PRODUCT_TITLE_INPUT: 'input[placeholder="Enter product title"]',
  PRODUCT_SKU_INPUT: 'input[placeholder="e.g., VEN-001"]',
  UPDATE_PRODUCT_BTN: 'button:has-text("Update Product")',

  // ── Shared / legacy (kept for backward compatibility) ─────────────────────
  SAVE_PARTNER_BTN: 'button:has-text("Update Partner")',
  IMPORT_PRODUCTS_BTN: '[data-action="import-products"]',
  SYNC_STATUS_BADGE: '.sync-status-badge',
};

/**
 * Partner WordPress / WooCommerce site selectors.
 *
 * Used by partner-site page objects (plugin settings, products admin, orders).
 * Prefer scoping connector-plugin interactions to #hoodsly-partners-connector
 * in page objects when the element lives inside the React app shell.
 */
const PARTNER_SITE_SELECTORS = {
  // ── WP Admin — Plugins page ───────────────────────────────────────────────
  PLUGINS_MENU: '#menu-plugins',
  PLUGIN_SEARCH_INPUT: '#plugin-search-input',

  // ── Connector settings page ─────────────────────────────────────────────────
  API_KEY_FIELD:
    '#hoodsly-partners-connector input[type="text"], ' +
    'input[name*="api_key"], input[id*="api_key"], input[placeholder*="API key" i]',
  IMPORT_TERMS_CHECKBOX:
    '#hoodsly-partners-connector input[type="checkbox"], ' +
    'label:has-text("I accept the Terms and Conditions and MAP Policy") input[type="checkbox"]',
  IMPORT_SUCCESS_MSG: ':text("Product imported successfully.")',
  CONNECTED_PARTNER_LABEL: ':text("Connected Partner:")',
  SETTINGS_SUCCESS_MSG: ':text("Settings updated successfully.")',

  // ── Settings tab — BOL creation ─────────────────────────────────────────────
  BOL_CREATION_TEXT: ':text("BOL")',
  BOL_COMPANY_NAME_FIELD:
    'input[name*="company_name" i], input[placeholder*="Company Name" i]',
  BOL_COMPANY_EMAIL_FIELD:
    'input[name*="company_email" i], input[type="email"]',
  BOL_COMPANY_PHONE_FIELD:
    'input[name*="company_phone" i], input[type="tel"]',
  BOL_COMPANY_NAME_LABEL: ':text("Company Name")',

  // ── WooCommerce Products admin ──────────────────────────────────────────────
  PRODUCT_SEARCH_INPUT: '#post-search-input',

  // ── Product frontend attribute selectors ────────────────────────────────────
  COLOR_OPTION_RADIO:
    'input[type="radio"][name*="color" i], input[type="radio"][value*="color" i]',
  COLOR_DROPDOWN: 'select#pa_color, select[name="attribute_pa_color"]',
  SIZE_DROPDOWN: 'select#pa_size, select[name="attribute_pa_size"]',
  TRIM_DROPDOWN: 'select#pa_trim, select[name="attribute_pa_trim"]',

  // ── WooCommerce Orders admin ────────────────────────────────────────────────
  WC_ORDERS_MENU: 'a[href*="page=wc-orders"], a[href*="post_type=shop_order"]',
  ORDER_SEARCH_INPUT: '#post-search-input, input[name="s"]',
  ORDER_STATUS_SELECT: '#order_status, select[name="order_status"]',
};

module.exports = { CONNECTOR_SELECTORS, PARTNER_SITE_SELECTORS };
