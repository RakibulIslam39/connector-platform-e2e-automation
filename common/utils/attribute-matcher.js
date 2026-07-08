'use strict';

/**
 * Normalizes attribute labels for comparison (colors, sizes, trims, ventilations).
 * Strips ANY parenthetical suffix — price tags like " ($50.00)" on colors AND
 * descriptions like " (Adds 1.5\" To Overall Width)" on trims — then compares the
 * remaining label text only. Case- and whitespace-insensitive.
 * @param {string} value
 * @returns {string}
 */
function normalizeAttributeName(value) {
  if (!value) {
    return '';
  }
  return String(value)
    .replace(/\([^)]*\)/g, '') // drop everything inside parentheses (price or description)
    .replace(/\s*:\s*[^:]+$/, '') // drop trailing ":Catalog" qualifier (e.g. "Shaker Gray:USCD")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Returns true only when two attribute labels are the SAME option after
 * normalization. Exact equality — no substring/partial matching, so "30" never
 * matches "3036" and mismatches are surfaced rather than masked.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function attributeNamesMatch(a, b) {
  const na = normalizeAttributeName(a);
  const nb = normalizeAttributeName(b);
  if (!na || !nb) {
    return false;
  }
  return na === nb;
}

/**
 * Finds the best imported match for an expected attribute name.
 * @param {string} expected
 * @param {string[]} imported
 * @returns {string|null}
 */
function findMatchingImported(expected, imported) {
  return imported.find((item) => attributeNamesMatch(expected, item)) || null;
}

/**
 * Bidirectional set comparison result.
 * @typedef {{ missing: string[], extra: string[], matched: number }} AttributeDiff
 */

/**
 * Compares expected vs imported attribute sets.
 * @param {string[]} expected
 * @param {string[]} imported
 * @returns {AttributeDiff}
 */
function diffAttributeSets(expected, imported) {
  const missing = expected.filter((exp) => !findMatchingImported(exp, imported));
  const extra = imported.filter((imp) => !expected.some((exp) => attributeNamesMatch(exp, imp)));
  const matched = expected.length - missing.length;
  return { missing, extra, matched };
}

module.exports = {
  normalizeAttributeName,
  attributeNamesMatch,
  findMatchingImported,
  diffAttributeSets,
};
