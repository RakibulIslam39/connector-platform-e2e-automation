'use strict';

/**
 * RuntimeState — module-level singleton for cross-scenario data persistence.
 *
 * All three scenarios (Create Partner → Partner Site Config → Attribute Validation)
 * run inside a single test.describe.serial() block and share the same Node.js
 * module instance, so this object persists across tests without any file I/O.
 *
 * Usage:
 *   const { runtimeState } = require('../../common/runtime/runtime-state');
 *   runtimeState.partnerName = 'QA Partner XYZ123';
 */

const runtimeState = {
  // ── Partner Basic Info ───────────────────────────────────────────────────
  partnerName: null,
  connectedPartnerName: null,
  apiKey: null,
  skuPrefix: null,

  // ── Products ─────────────────────────────────────────────────────────────
  /** @type {Array<{ catalogName: string, catalogSku: string, customTitle?: string|null }>} */
  selectedProducts: [],
  expectedProductCount: 0,
  doubleCurvedCustomTitle: null,

  // ── Primed / Paint Ready ─────────────────────────────────────────────────
  primedPaintReadyCustomName: null,
  primedPaintReadyCustomPrice: null,
  primedPaintReadyCurrentPrice: null,

  // ── Attributes ───────────────────────────────────────────────────────────
  selectedColors: [],
  selectedVentilations: [],
  selectedTrims: [],
  selectedSizes: [],

  // ── FAQs & Shipping ──────────────────────────────────────────────────────
  faqTitle: null,
  faqAnswer: null,
  policyTitle: null,
  policyDescription: null,
};

/**
 * Resets all runtime state values to their initial defaults.
 * Useful for test isolation if the suite needs to be rerun.
 */
function resetRuntimeState() {
  runtimeState.partnerName = null;
  runtimeState.connectedPartnerName = null;
  runtimeState.apiKey = null;
  runtimeState.skuPrefix = null;
  runtimeState.selectedProducts = [];
  runtimeState.expectedProductCount = 0;
  runtimeState.doubleCurvedCustomTitle = null;
  runtimeState.primedPaintReadyCustomName = null;
  runtimeState.primedPaintReadyCustomPrice = null;
  runtimeState.primedPaintReadyCurrentPrice = null;
  runtimeState.selectedColors = [];
  runtimeState.selectedVentilations = [];
  runtimeState.selectedTrims = [];
  runtimeState.selectedSizes = [];
  runtimeState.faqTitle = null;
  runtimeState.faqAnswer = null;
  runtimeState.policyTitle = null;
  runtimeState.policyDescription = null;
}

/**
 * Returns a snapshot of the current runtime state for logging/debugging.
 */
function getRuntimeSnapshot() {
  return JSON.parse(JSON.stringify(runtimeState));
}

module.exports = { runtimeState, resetRuntimeState, getRuntimeSnapshot };
