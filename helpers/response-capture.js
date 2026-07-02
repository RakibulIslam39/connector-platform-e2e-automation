'use strict';

/**
 * ResponseCapture — file-based API response store.
 *
 * HOW IT WORKS (cross-process safe):
 *   Each Playwright worker runs in its own process. To bridge the gap,
 *   every captured response is immediately appended as a single JSON line
 *   to a shared temp file:  reports/api-responses/.capture-temp.ndjson
 *
 *   After all tests finish, globalTeardown calls `consolidate()` which:
 *     1. Reads every line from the temp file
 *     2. Builds a structured report object
 *     3. Writes reports/api-responses/api-responses-<timestamp>.json
 *     4. Deletes the temp file
 *
 * Usage (automatic — no test changes needed):
 *   ApiClient._handleResponse() calls ResponseCapture.record() on every call.
 *
 * Manual usage inside a test:
 *   const { ResponseCapture } = require('../../helpers/response-capture');
 *   ResponseCapture.record({ method, url, status, body });
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(process.cwd(), 'reports', 'api-responses');
const TEMP_FILE = path.join(OUTPUT_DIR, '.capture-temp.ndjson');

/** Ensure the output directory exists. */
function ensureDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Strips the host from a URL, leaving only the path.
 * @param {string} url
 */
function stripHost(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/**
 * Builds a compact per-endpoint summary from a list of entries.
 * @param {Array} entries
 */
function buildSummary(entries) {
  const map = {};
  for (const e of entries) {
    const key = `${e.method} ${stripHost(e.url)}`;
    if (!map[key]) {
      map[key] = { method: e.method, path: stripHost(e.url), calls: 0, statuses: [] };
    }
    map[key].calls++;
    if (!map[key].statuses.includes(e.status)) {
      map[key].statuses.push(e.status);
    }
  }
  return Object.values(map);
}

const ResponseCapture = {
  /**
   * Record a single API response.
   * Appends one JSON line to the shared temp NDJSON file (cross-process safe).
   *
   * @param {object} params
   * @param {string} params.method   HTTP method
   * @param {string} params.url      Full URL
   * @param {number} params.status   HTTP status code
   * @param {*}      params.body     Parsed response body (object or string)
   */
  record({ method, url, status, body }) {
    try {
      ensureDir();
      const entry = {
        method,
        url,
        status,
        ok: status >= 200 && status < 300,
        capturedAt: new Date().toISOString(),
        body,
      };
      // Append one line — this is atomic enough for our purposes
      fs.appendFileSync(TEMP_FILE, JSON.stringify(entry) + '\n', 'utf8');
    } catch {
      // Never fail a test because of capture issues
    }
  },

  /**
   * Reads all captured entries from the temp file.
   * @returns {Array}
   */
  readAll() {
    if (!fs.existsSync(TEMP_FILE)) return [];
    const lines = fs.readFileSync(TEMP_FILE, 'utf8').trim().split('\n').filter(Boolean);
    return lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  },

  /**
   * Consolidates the temp NDJSON into a final timestamped JSON report.
   * Called by globalTeardown after all workers have finished.
   *
   * @returns {string|null}  Absolute path to the written file, or null if nothing captured.
   */
  consolidate() {
    const entries = this.readAll();
    if (entries.length === 0) return null;

    ensureDir();

    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');

    const filename = `api-responses-${timestamp}.json`;
    const filePath = path.join(OUTPUT_DIR, filename);

    // Add sequential numbers now that we have all entries in order
    const numbered = entries.map((e, i) => ({ seq: i + 1, ...e }));

    const report = {
      runAt: numbered[0]?.capturedAt ?? new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      totalRequests: numbered.length,
      totalFailed: numbered.filter((e) => !e.ok).length,
      summary: buildSummary(numbered),
      responses: numbered,
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');

    // Clean up temp file
    try { fs.unlinkSync(TEMP_FILE); } catch { /* ignore */ }

    return filePath;
  },

  /**
   * Deletes the temp file — called by globalSetup to start fresh each run.
   */
  reset() {
    try { if (fs.existsSync(TEMP_FILE)) fs.unlinkSync(TEMP_FILE); } catch { /* ignore */ }
  },
};

module.exports = { ResponseCapture };
