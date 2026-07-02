'use strict';

/** Catalog SKU for Double Curved on Connector Platform. */
const DOUBLE_CURVED_CATALOG_SKU = 'VEN-DBC-DC';

/**
 * Parses hub "Add Products" button text into catalog name + SKU.
 * @param {string} text
 * @returns {{ catalogName: string, catalogSku: string }}
 */
function parseHubProductButtonText(text) {
  const normalized = String(text || '')
    .replace(/\s+/g, ' ')
    .trim();
  const skuMatch = normalized.match(/(VEN-[A-Z0-9-]+)/i);
  const catalogSku = skuMatch ? skuMatch[1].toUpperCase() : '';
  let catalogName = normalized;
  if (skuMatch) {
    catalogName = normalized.replace(skuMatch[0], '').trim();
  }
  return { catalogName, catalogSku };
}

/**
 * Normalizes product titles for comparison (HTML entities, whitespace).
 * @param {string} value
 * @returns {string}
 */
function normalizeProductTitle(value) {
  return String(value || '')
    .replace(/&#0?38;/g, '&')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Builds partner-site SKU from hub catalog SKU and partner prefix.
 * Example: CDJ- + DBC-DC (from VEN-DBC-DC) → CDJ-DBC-DC
 * @param {string} catalogSku
 * @param {string|null} skuPrefix
 * @returns {string}
 */
function buildPartnerSku(catalogSku, skuPrefix) {
  if (!catalogSku) return '';
  if (!skuPrefix) return catalogSku;
  const suffix = catalogSku.replace(/^VEN-/i, '');
  return `${skuPrefix}${suffix}`;
}

/**
 * Returns SKU search candidates for Double Curved resolution.
 * @param {string|null} skuPrefix
 * @returns {string[]}
 */
function buildDoubleCurvedSkuCandidates(skuPrefix) {
  return [
    skuPrefix ? `${skuPrefix}DBC-DC` : null,
    skuPrefix ? `${skuPrefix}DBC` : null,
    skuPrefix ? `${skuPrefix}${DOUBLE_CURVED_CATALOG_SKU}` : null,
    DOUBLE_CURVED_CATALOG_SKU,
    'DBC-DC',
    'DBC',
  ].filter(Boolean);
}

/**
 * Expected display title for an imported product.
 * @param {{ catalogName: string, customTitle?: string|null }} product
 * @returns {string}
 */
function getExpectedImportTitle(product) {
  return product.customTitle || product.catalogName;
}

/**
 * Checks whether an imported partner product matches a hub-selected product.
 * @param {{ post_title: string, sku?: string }} imported
 * @param {{ catalogName: string, catalogSku: string, customTitle?: string|null }} expected
 * @param {string|null} skuPrefix
 * @returns {boolean}
 */
function importedProductMatchesExpected(imported, expected, skuPrefix) {
  const partnerSku = buildPartnerSku(expected.catalogSku, skuPrefix);
  const expectedTitle = getExpectedImportTitle(expected);
  const importedSku = (imported.sku || '').toLowerCase();
  const importedTitle = normalizeProductTitle(imported.post_title);
  const normalizedExpectedTitle = normalizeProductTitle(expectedTitle);
  const normalizedCatalogName = normalizeProductTitle(expected.catalogName);

  if (partnerSku && importedSku === partnerSku.toLowerCase()) return true;
  if (partnerSku && importedSku.includes(partnerSku.toLowerCase())) return true;
  if (importedTitle === normalizedExpectedTitle) return true;
  if (expected.customTitle && importedTitle === normalizeProductTitle(expected.customTitle)) {
    return true;
  }
  if (normalizedCatalogName && importedTitle === normalizedCatalogName) return true;
  if (normalizedCatalogName && importedTitle.includes(normalizedCatalogName)) return true;
  return false;
}

module.exports = {
  DOUBLE_CURVED_CATALOG_SKU,
  parseHubProductButtonText,
  buildPartnerSku,
  buildDoubleCurvedSkuCandidates,
  getExpectedImportTitle,
  normalizeProductTitle,
  importedProductMatchesExpected,
};
