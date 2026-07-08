'use strict';

const logger = require('../common/utils/logger');
const attributeMapping = require('../json-data/attribute-mapping.json');

/**
 * SKU generation and validation helpers.
 *
 * Master SKU formula (from Connector Platform API):
 *   {product_base_sku}-{size_sku}-{color_sku}[-modifier_skus_in_order]
 *
 * Examples:
 *   VEN-ANBS-3636-RAW
 *   VEN-CCX-3036-USCDSAW-ID19-RSH-RH2-CH6
 *   VEN-FLS-FSW30-RAW              ← Floating Shelves use SelectWidth, not Size
 *
 * Short SKU (used in HoodslyHub order validation):
 *   Everything after the product base prefix:  3636-RAW  or  3036-USCDSAW-RH2
 */

/**
 * Resolves a value to its SKU code using the attribute mapping.
 * @param {string} groupName  e.g. "Size", "PartnerColors", "IncreaseDepth"
 * @param {string} value      e.g. "36\" x 36\""
 * @returns {string|null}
 */
function resolveSku(groupName, value) {
  const group = attributeMapping[groupName];
  if (!group) return null;
  const entry = group.find((e) => e.value === value);
  return entry ? entry.sku : null;
}

/**
 * Generates the Master SKU for an order line item.
 *
 * @param {string} productBaseSku  e.g. "VEN-ANBS"
 * @param {object} selections
 *   @param {string}  selections.size        e.g. "36\" x 36\""  (required for Wood Hoods)
 *   @param {string}  [selections.width]     e.g. "30\""          (Floating Shelves only)
 *   @param {string}  selections.color       e.g. "Raw / Unfinished" or "Shaker White:USCD"
 *   @param {string}  [selections.increaseDepth]    e.g. "Increase Interior Depth To 19.3125\""
 *   @param {string}  [selections.reduceHeight]     e.g. "Remove 2\""
 *   @param {string}  [selections.crownMolding]     e.g. "Steel Crown Molding"
 *   @param {string}  [selections.crownMoldingFit]  e.g. "Installed" | "Loose (Not Installed)"
 *   @param {string}  [selections.extendChimney]    e.g. "6\" Extension"
 *   @param {boolean} [selections.solidBottom]      true = adds "SB" modifier
 * @returns {string} Master SKU
 */
function generateMasterSku(productBaseSku, selections) {
  const segments = [productBaseSku];

  // ── Size / Width segment ────────────────────────────────────────────────────
  if (selections.width) {
    // Floating Shelves use SelectWidth
    const widthSku = resolveSku('SelectWidth', selections.width);
    if (!widthSku) {
      logger.warn(`[sku-helper] No SelectWidth mapping for: "${selections.width}"`);
    } else {
      segments.push(widthSku);
    }
  } else if (selections.size) {
    // Try Size first, fall back to PartnerSizes
    const sizeSku =
      resolveSku('Size', selections.size) || resolveSku('PartnerSizes', selections.size);
    if (!sizeSku) {
      logger.warn(`[sku-helper] No Size mapping for: "${selections.size}"`);
    } else {
      segments.push(sizeSku);
    }
  }

  // ── Color segment ───────────────────────────────────────────────────────────
  if (selections.color) {
    // Base colors (RAW / PRM) sit directly in PartnerColors
    const colorSku = resolveSku('PartnerColors', selections.color);
    if (!colorSku) {
      logger.warn(`[sku-helper] No PartnerColors mapping for: "${selections.color}"`);
    } else {
      segments.push(colorSku);
    }
  }

  // ── Optional modifier segments (appended in fixed order) ───────────────────

  if (selections.increaseDepth) {
    const sku = resolveSku('IncreaseDepth', selections.increaseDepth);
    if (sku) segments.push(sku);
    else logger.warn(`[sku-helper] No IncreaseDepth mapping for: "${selections.increaseDepth}"`);
  }

  if (selections.reduceHeight) {
    const sku = resolveSku('ReduceHeight', selections.reduceHeight);
    if (sku) segments.push(sku);
    else logger.warn(`[sku-helper] No ReduceHeight mapping for: "${selections.reduceHeight}"`);
  }

  if (selections.crownMolding) {
    const sku = resolveSku('CrownMolding', selections.crownMolding);
    if (sku) segments.push(sku);
    else logger.warn(`[sku-helper] No CrownMolding mapping for: "${selections.crownMolding}"`);
  }

  if (selections.crownMoldingFit) {
    const sku = resolveSku('CrownMolding', selections.crownMoldingFit);
    if (sku) segments.push(sku);
    else logger.warn(`[sku-helper] No CrownMolding fit mapping for: "${selections.crownMoldingFit}"`);
  }

  if (selections.extendChimney) {
    const sku = resolveSku('ExtendYourChimney', selections.extendChimney);
    if (sku) segments.push(sku);
    else logger.warn(`[sku-helper] No ExtendYourChimney mapping for: "${selections.extendChimney}"`);
  }

  if (selections.solidBottom === true) {
    segments.push('SB');
  }

  const masterSku = segments.join('-');
  logger.debug(`[sku-helper] generateMasterSku → ${masterSku}`);
  return masterSku;
}

/**
 * Derives the Short SKU from a Master SKU by stripping the product base prefix.
 * Short SKU is used when validating the order in HoodslyHub.
 *
 * @param {string} masterSku  e.g. "VEN-ANBS-3636-RAW"
 * @param {string} productBaseSku  e.g. "VEN-ANBS"
 * @returns {string}  e.g. "3636-RAW"
 */
function deriveShortSku(masterSku, productBaseSku) {
  if (!masterSku.startsWith(productBaseSku + '-')) {
    logger.warn(
      `[sku-helper] masterSku "${masterSku}" does not start with productBaseSku "${productBaseSku}"`
    );
    return masterSku;
  }
  const shortSku = masterSku.slice(productBaseSku.length + 1);
  logger.debug(`[sku-helper] deriveShortSku → ${shortSku}`);
  return shortSku;
}

/**
 * Validates a SKU against the expected format.
 * @param {string} sku
 * @returns {boolean}
 */
function validateSkuFormat(sku) {
  if (!sku || typeof sku !== 'string') return false;
  // Must start and end with alphanumeric, may contain hyphens in between
  return /^[A-Z0-9]([A-Z0-9-]*[A-Z0-9])?$/i.test(sku);
}

/**
 * Validates that a Master SKU contains a known size segment.
 * Useful for smoke-checking a SKU without calling the full API.
 * @param {string} masterSku
 * @returns {boolean}
 */
function hasSizeSegment(masterSku) {
  const skuData = require('../json-data/sku-data.json');
  const parts = masterSku.split('-');
  const allSizeSkus = [
    ...skuData.validationRules.knownSizeSegments,
    ...skuData.validationRules.knownWidthSegments,
  ];
  return parts.some((p) => allSizeSkus.includes(p));
}

/**
 * Parses a Master SKU into its component parts.
 * @param {string} masterSku  e.g. "VEN-ANBS-3636-RAW-RH2"
 * @returns {{ productPrefix: string, productStyle: string, sizeCode: string, colorCode: string, modifiers: string[] }}
 */
function parseMasterSku(masterSku) {
  const skuData = require('../json-data/sku-data.json');
  const parts = masterSku.split('-');
  const allSizeSkus = [
    ...skuData.validationRules.knownSizeSegments,
    ...skuData.validationRules.knownWidthSegments,
  ];

  const sizeIdx = parts.findIndex((p) => allSizeSkus.includes(p));
  const productParts = sizeIdx > 0 ? parts.slice(0, sizeIdx) : [];
  const afterSize = sizeIdx > 0 ? parts.slice(sizeIdx) : parts;

  return {
    raw: masterSku,
    productBaseSku: productParts.join('-'),
    sizeCode: afterSize[0] || '',
    colorCode: afterSize[1] || '',
    modifiers: afterSize.slice(2),
  };
}

/**
 * Generates the Hub-specific unique order line ID.
 * Multi-item orders get suffix numbers: orderId-1, orderId-2, etc.
 * @param {string} baseOrderId
 * @param {number} itemIndex - 0-based index (0 = no suffix for the first item)
 * @returns {string}
 */
function generateHubOrderId(baseOrderId, itemIndex = 0) {
  if (itemIndex === 0) return String(baseOrderId);
  return `${baseOrderId}-${itemIndex}`;
}

/**
 * Legacy wrapper — accepts an attribute-map array in the old format.
 * Prefer generateMasterSku() for new tests.
 * @deprecated
 */
function generateShortSku(masterSku, selectedAttributes, attributeMappingArray, skuPrefix = '') {
  const shortCodes = [];
  for (const [attr, value] of Object.entries(selectedAttributes)) {
    const mapping = attributeMappingArray.find(
      (m) =>
        m.attribute?.toLowerCase() === attr.toLowerCase() &&
        m.value?.toLowerCase() === value.toLowerCase()
    );
    if (mapping) {
      shortCodes.push(mapping.shortCode || mapping.sku);
    } else {
      logger.warn(`[sku-helper] No mapping found for attribute: ${attr}=${value}`);
    }
  }
  const sku = `${skuPrefix}${masterSku}-${shortCodes.join('-')}`;
  logger.debug(`[sku-helper] generateShortSku (legacy): ${sku}`);
  return sku;
}

/**
 * Applies Reduce Height logic to a height value.
 * @param {number} originalHeight
 * @param {number} reductionAmount
 * @returns {number}
 */
function applyReduceHeight(originalHeight, reductionAmount) {
  const reduced = originalHeight - reductionAmount;
  if (reduced <= 0) {
    throw new Error(
      `Reduce height result is invalid: ${originalHeight} - ${reductionAmount} = ${reduced}`
    );
  }
  logger.debug(`[sku-helper] Reduce height: ${originalHeight} → ${reduced}`);
  return reduced;
}

module.exports = {
  generateMasterSku,
  deriveShortSku,
  validateSkuFormat,
  hasSizeSegment,
  parseMasterSku,
  generateHubOrderId,
  resolveSku,
  // legacy
  generateShortSku,
  applyReduceHeight,
};
