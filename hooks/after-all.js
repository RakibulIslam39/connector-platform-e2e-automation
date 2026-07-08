'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../common/utils/logger');
const { ResponseCapture } = require('../common/api/response-capture');

/**
 * Global Teardown — runs once after all tests complete.
 *
 * Writes all API response bodies captured during the run to:
 *   reports/api-responses/api-responses-<timestamp>.json
 *
 * NOTE: We do NOT call logTestSummary() here because the JSON reporter writes
 * its file concurrently with teardown, so the on-disk file may still contain
 * results from the previous run. The HTML/JSON reports are accurate — open
 * them with `npm run report` after the run finishes.
 */
module.exports = async function globalTeardown() {
  console.log('\n[globalTeardown] Running global teardown...');

  // ── Consolidate API response captures from all workers ──────────────────────
  const writtenFile = ResponseCapture.consolidate();
  if (writtenFile) {
    const rel = path.relative(path.resolve(__dirname, '..'), writtenFile);
    console.log(`\n[globalTeardown] API response bodies saved → ${rel}`);
    logger.info(`[globalTeardown] API response capture written to ${rel}`);
  } else {
    logger.info('[globalTeardown] No API responses captured (no API tests ran).');
  }

  // ── HTML report location ─────────────────────────────────────────────────────
  const reportPath = path.resolve(__dirname, '../reports/html/index.html');
  if (fs.existsSync(reportPath)) {
    logger.info(`[globalTeardown] HTML report available at: reports/html/index.html`);
  }

  logger.info('[globalTeardown] Global teardown complete.');
};
