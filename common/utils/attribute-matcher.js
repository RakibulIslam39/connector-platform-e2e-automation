'use strict';

/**
 * Normalizes attribute labels for comparison (colors, sizes, trims, ventilations).
 * Strips price suffixes like " ($50.00)" from color option labels.
 * @param {string} value
 * @returns {string}
 */
function normalizeAttributeName(value) {
  if (!value) return '';
  return String(value)
    .replace(/\(\$[\d,.]+\)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Returns true when two attribute labels refer to the same option.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function attributeNamesMatch(a, b) {
  const na = normalizeAttributeName(a);
  const nb = normalizeAttributeName(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
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
  const extra = imported.filter(
    (imp) => !expected.some((exp) => attributeNamesMatch(exp, imp))
  );
  const matched = expected.length - missing.length;
  return { missing, extra, matched };
}

module.exports = {
  normalizeAttributeName,
  attributeNamesMatch,
  findMatchingImported,
  diffAttributeSets,
};
