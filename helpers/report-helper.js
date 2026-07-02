'use strict';

const path = require('path');
const fs = require('fs');
const logger = require('../common/utils/logger');

/**
 * Test reporting utilities.
 */

const REPORTS_DIR = path.resolve(__dirname, '../reports');

/**
 * Reads the latest JSON test results.
 */
function readJsonReport(reportPath = path.join(REPORTS_DIR, 'json/results.json')) {
  if (!fs.existsSync(reportPath)) {
    logger.warn('[report-helper] No JSON report found at:', reportPath);
    return null;
  }
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

/**
 * Summarizes test results from a JSON report.
 * @returns {{ total, passed, failed, skipped, duration }}
 */
function summarizeResults(report) {
  if (!report) {
    return { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
  }

  // Playwright JSON reporter uses different keys depending on version:
  // v1.x: report.stats.{ expected, unexpected, skipped, duration }
  // Fallback: count suites > specs > results
  const stats = report.stats || {};

  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const skipped = stats.skipped ?? 0;
  const total = passed + failed + skipped || stats.total || 0;

  return {
    total,
    passed,
    failed,
    skipped,
    duration: Math.round((stats.duration || 0) / 1000),
  };
}

/**
 * Logs a test summary to the console.
 */
function logTestSummary() {
  const report = readJsonReport();
  if (!report) {
    return;
  }

  const summary = summarizeResults(report);
  const icon = summary.failed === 0 ? 'PASS' : 'FAIL';

  logger.info(`\n${'='.repeat(50)}`);
  logger.info(`TEST SUMMARY [${icon}]`);
  logger.info(`${'='.repeat(50)}`);
  logger.info(`Total:    ${summary.total}`);
  logger.info(`Passed:   ${summary.passed}`);
  logger.info(`Failed:   ${summary.failed}`);
  logger.info(`Skipped:  ${summary.skipped}`);
  logger.info(`Duration: ${summary.duration}s`);
  logger.info(`${'='.repeat(50)}\n`);
}

/**
 * Cleans old report files before a fresh test run.
 */
function cleanReports() {
  const dirs = ['json', 'html'];
  dirs.forEach((dir) => {
    const dirPath = path.join(REPORTS_DIR, dir);
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        fs.unlinkSync(path.join(dirPath, file));
      });
      logger.info(`[report-helper] Cleaned reports/${dir}`);
    }
  });
}

module.exports = {
  readJsonReport,
  summarizeResults,
  logTestSummary,
  cleanReports,
};
