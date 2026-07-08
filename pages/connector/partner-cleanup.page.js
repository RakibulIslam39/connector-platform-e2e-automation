'use strict';

/**
 * PartnerCleanupPage — Connector Hub SPA  (/partners list)
 *
 * Encapsulates the "pre-creation cleanup" workflow:
 *
 *   1. Navigate to the Partners list
 *   2. Search for any partner whose Website URL matches PARTNER_SITE_BASE_URL
 *   3. If found (active status) → Move to Trash
 *   4. Switch to "Trash" status view
 *   5. Search again — if found in Trash → Delete Permanently
 *
 * This prevents the "Website may already exist" error when TC-CP-001 tries to
 * create a partner for a URL that was previously registered (or trashed).
 */

const { CONNECTOR_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');
const {
  assertPartnerMovedToTrash,
  assertPartnerPermanentlyDeleted,
} = require('../../common/utils/notification-validator');

class PartnerCleanupPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL;

    // ── Partners list — search input ────────────────────────────────────────
    this.searchInput = page.locator('input[placeholder="Search partners..."]');

    // ── Status filter ───────────────────────────────────────────────────────
    // The SPA renders a native <select> alongside an "All Platforms" select.
    // Identify the Status select by the presence of its "Trash" option — this
    // remains stable regardless of the currently selected value.
    this.statusSelect = page
      .locator('select')
      .filter({ has: page.locator('option', { hasText: 'Trash' }) })
      .first();

    // ── Per-row action buttons (resolved lazily inside each row locator) ─────
    // .moveToTrashBtnInRow(row) / .deletePermBtnInRow(row) are helper methods below.
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════

  async navigateToPartnersList() {
    await this.page.goto(`${this.baseUrl}${CONNECTOR_PATHS.PARTNERS}`);
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the SPA to render the search input before interacting
    await this.searchInput.waitFor({ state: 'visible', timeout: 20000 });
    logger.info('[PartnerCleanupPage] Partners list loaded');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Search helpers
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Types the given text into the search box and waits for the SPA to filter.
   * @param {string} query
   */
  async searchPartners(query) {
    await this.searchInput.clear();
    await this.searchInput.fill(query);
    // Allow the SPA's debounce / real-time filter to run
    await this.page.waitForTimeout(1200);
    logger.info(`[PartnerCleanupPage] Searched partners for: "${query}"`);
  }

  /** Clears the search so all partners show again. */
  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(800);
  }

  /**
   * Returns URL variants used to match partner rows (full URL, host, etc.).
   * @param {string} websiteUrl
   * @returns {string[]}
   */
  _urlMatchVariants(websiteUrl) {
    const trimmed = websiteUrl.trim();
    const withoutSlash = trimmed.replace(/\/$/, '');
    return [...new Set([trimmed, withoutSlash, `${withoutSlash}/`])].filter(Boolean);
  }

  /**
   * Returns a locator for table rows that visually contain the given text.
   * @param {string} text
   */
  _rowsContaining(text) {
    return this.page.locator('table tbody tr').filter({ hasText: text });
  }

  /**
   * Returns a locator for rows matching any URL variant.
   * @param {string} websiteUrl
   */
  _rowsMatchingWebsiteUrl(websiteUrl) {
    const variants = this._urlMatchVariants(websiteUrl);
    let rows = this.page.locator('table tbody tr').filter({ hasText: variants[0] });

    for (let i = 1; i < variants.length; i += 1) {
      rows = rows.or(this.page.locator('table tbody tr').filter({ hasText: variants[i] }));
    }

    return rows;
  }

  /**
   * Returns visible data rows (excludes the "No partners found" placeholder).
   */
  _visibleDataRows() {
    return this.page.locator('table tbody tr').filter({ hasNotText: 'No partners found' });
  }

  /**
   * Applies the best matching website URL search term and returns true when rows are visible.
   * @param {string} websiteUrl
   */
  async _applyWebsiteSearch(websiteUrl) {
    for (const term of this._urlMatchVariants(websiteUrl)) {
      await this.searchPartners(term);
      const count = await this._visibleDataRows().count();
      if (count > 0) {
        logger.info(`[PartnerCleanupPage] Search matched ${count} row(s) for "${term}"`);
        return true;
      }
    }

    await this.clearSearch();
    return false;
  }

  async _applySearch(query) {
    await this.searchPartners(query);
    const count = await this._visibleDataRows().count();
    if (count > 0) {
      logger.info(`[PartnerCleanupPage] Search matched ${count} row(s) for "${query}"`);
      return true;
    }

    await this.clearSearch();
    return false;
  }

  /**
   * Returns rows whose visible text contains `query`.
   * @param {string} query
   */
  _rowsMatchingQuery(query) {
    return this.page.locator('table tbody tr').filter({ hasText: query });
  }

  /**
   * Moves every partner row matching `query` to Trash across active status views.
   * @param {string} query
   * @returns {Promise<number>}
   */
  async moveMatchingPartnersToTrashByQuery(query) {
    let moved = 0;

    await this._forEachStatusView(async (statusLabel) => {
      if (statusLabel === 'Trash') {
        return;
      }

      const hasMatches = await this._applySearch(query);
      if (!hasMatches) {
        return;
      }

      while ((await this._visibleDataRows().count()) > 0) {
        const remaining = await this._visibleDataRows().count();
        logger.info(
          `[PartnerCleanupPage] Moving partner to trash from "${statusLabel}" view (${remaining} remaining) for "${query}"`
        );

        const row = this._firstVisibleRow();
        const trashBtn = row
          .getByRole('button', { name: /move to trash/i })
          .or(row.locator('button').filter({ hasText: /trash/i }))
          .first();

        await row.hover().catch(() => {});
        await trashBtn.waitFor({ state: 'visible', timeout: 5000 });
        await trashBtn.click();
        await this._confirmDialog('Move to Trash', 'Move to Trash');
        await assertPartnerMovedToTrash(this.page);
        await this.page.waitForTimeout(800);
        moved += 1;
      }

      await this.clearSearch();
    });

    if (moved === 0) {
      logger.info(`[PartnerCleanupPage] No active partners found for search: "${query}"`);
    }

    return moved;
  }

  /**
   * Permanently deletes partner rows matching `query` from the Trash view.
   * @param {string} query
   * @returns {Promise<number>}
   */
  async permanentlyDeleteByQuery(query) {
    let deleted = 0;
    let hasMatches = await this._applySearch(query);

    if (!hasMatches) {
      await this.clearSearch();
      const queryRowCount = await this._rowsMatchingQuery(query).count();
      hasMatches = queryRowCount > 0;
      if (hasMatches) {
        logger.info(
          `[PartnerCleanupPage] Found ${queryRowCount} trashed row(s) for "${query}" by scanning list text`
        );
      }
    }

    while (
      (await this._visibleDataRows().count()) > 0 ||
      (await this._rowsMatchingQuery(query).count()) > 0
    ) {
      const remaining =
        (await this._visibleDataRows().count()) || (await this._rowsMatchingQuery(query).count());
      logger.info(
        `[PartnerCleanupPage] Permanently deleting partner (${remaining} remaining) for "${query}"`
      );

      const row =
        (await this._visibleDataRows().count()) > 0
          ? this._firstVisibleRow()
          : this._rowsMatchingQuery(query).first();

      const deleteBtn = row
        .getByRole('button', { name: /delete permanently/i })
        .or(row.locator('button').filter({ hasText: /delete permanently/i }))
        .first();

      await row.hover().catch(() => {});
      await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
      await deleteBtn.click();
      await this._confirmDialog('Delete Permanently', 'Delete Permanently');
      await assertPartnerPermanentlyDeleted(this.page);
      await this.page.waitForTimeout(800);
      deleted += 1;

      await this._applySearch(query).catch(() => false);
    }

    if (deleted === 0) {
      logger.info(`[PartnerCleanupPage] No trashed partners found for search: "${query}"`);
    }

    return deleted;
  }

  /**
   * Removes all partners whose list row matches `query` (active + trash).
   * @param {string} query
   */
  async ensureNoPartnersMatchingSearch(query) {
    logger.info(`[PartnerCleanupPage] ── Cleanup start for search: "${query}" ──`);
    await this.navigateToPartnersList();

    const movedToTrash = await this.moveMatchingPartnersToTrashByQuery(query);

    await this.clearSearch();
    await this.filterByTrash();
    await this.page.waitForTimeout(1000);

    const permanentlyDeleted = await this.permanentlyDeleteByQuery(query);

    await this.clearSearch();
    await this.filterByAll();

    logger.info(
      `[PartnerCleanupPage] ── Search cleanup done for "${query}" — moved ${movedToTrash}, permanently deleted ${permanentlyDeleted} ──`
    );

    return { movedToTrash, permanentlyDeleted };
  }

  /**
   * Returns the first row targeted for cleanup from the current filtered list.
   */
  _firstVisibleRow() {
    return this._visibleDataRows().first();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Status filter
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Switches the Partners list to show only trashed partners.
   * Tries a <select> drop-down first, then clickable tabs/links.
   */
  async filterByTrash() {
    // Strategy 1 — native <select> drop-down with option "Trash"
    // DOM confirmed: combobox with options "All Status" (default) and "Trash"
    const selectVisible = await this.statusSelect.isVisible({ timeout: 2000 }).catch(() => false);
    if (selectVisible) {
      await this.statusSelect.selectOption('Trash');
      await this.page.waitForTimeout(800);
      logger.info('[PartnerCleanupPage] Switched to Trash via <select>');
      return;
    }

    // Strategy 2 — filter tab / link (text "Trash")
    const trashTab = this.page
      .getByRole('button', { name: /^trash$/i })
      .or(this.page.getByRole('link', { name: /^trash$/i }))
      .first();
    if (await trashTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await trashTab.click();
      await this.page.waitForTimeout(800);
      logger.info('[PartnerCleanupPage] Switched to Trash via tab/link');
      return;
    }

    // Strategy 3 — try native JS click on any element that says "Trash"
    const clicked = await this.page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('a, button, li, span')).find(
        (e) => e.textContent.trim() === 'Trash'
      );
      if (el) {
        el.click();
        return true;
      }
      return false;
    });
    if (clicked) {
      await this.page.waitForTimeout(800);
      logger.info('[PartnerCleanupPage] Switched to Trash via JS click fallback');
      return;
    }

    logger.warn(
      '[PartnerCleanupPage] Could not locate Trash filter — proceeding without status change'
    );
  }

  /**
   * Iterates all status filter values and runs a callback for each view.
   * @param {(statusLabel: string) => Promise<void>} callback
   */
  async _forEachStatusView(callback) {
    const statusLabels = ['All Status', 'Trash'];

    for (const label of statusLabels) {
      const selectVisible = await this.statusSelect.isVisible({ timeout: 2000 }).catch(() => false);
      if (!selectVisible) {
        break;
      }

      await this.statusSelect.selectOption(label).catch(() => {});
      await this.page.waitForTimeout(800);
      await callback(label);
    }
  }

  /**
   * Resets the status filter back to "All" (or "All Status").
   */
  async filterByAll() {
    const selectVisible = await this.statusSelect.isVisible({ timeout: 2000 }).catch(() => false);
    if (selectVisible) {
      // Select the first option ("All Status") to reset the filter
      await this.statusSelect.selectOption('All Status').catch(async () => {
        // Fallback: select by index if label doesn't match exactly
        await this.statusSelect.selectOption({ index: 0 }).catch(() => {});
      });
      await this.page.waitForTimeout(600);
      return;
    }

    const allTab = this.page
      .getByRole('button', { name: /^all$/i })
      .or(this.page.getByRole('link', { name: /^all$/i }))
      .or(this.page.getByRole('button', { name: /all status/i }))
      .first();
    if (await allTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await allTab.click();
      await this.page.waitForTimeout(600);
      logger.info('[PartnerCleanupPage] Reset filter to All');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Confirmation dialogs (Headless UI modals — NOT native browser confirm)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Returns the open Headless UI confirmation dialog by accessible name.
   * @param {string} dialogTitle e.g. "Move to Trash" | "Delete Permanently"
   */
  _confirmationDialog(dialogTitle) {
    return this.page.getByRole('dialog', { name: dialogTitle, exact: true });
  }

  /**
   * Confirms a Headless UI modal by clicking its primary action button.
   * @param {string} dialogTitle
   * @param {string} confirmButtonLabel
   */
  async _confirmDialog(dialogTitle, confirmButtonLabel) {
    const dialog = this._confirmationDialog(dialogTitle);
    await dialog.waitFor({ state: 'visible', timeout: 8000 });
    logger.info(`[PartnerCleanupPage] Confirming dialog: "${dialogTitle}"`);

    await dialog.getByRole('button', { name: confirmButtonLabel, exact: true }).click();
    await dialog.waitFor({ state: 'hidden', timeout: 15000 });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Trash / Delete actions
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * For every visible row containing `websiteUrl`, clicks the "Move to Trash" button.
   * Returns the number of partners moved.
   * @param {string} websiteUrl
   * @returns {Promise<number>}
   */
  async moveMatchingPartnersToTrash(websiteUrl) {
    let moved = 0;

    await this._forEachStatusView(async (statusLabel) => {
      if (statusLabel === 'Trash') {
        return;
      }

      const hasMatches = await this._applyWebsiteSearch(websiteUrl);
      if (!hasMatches) {
        return;
      }

      while ((await this._visibleDataRows().count()) > 0) {
        const remaining = await this._visibleDataRows().count();
        logger.info(
          `[PartnerCleanupPage] Moving partner to trash from "${statusLabel}" view (${remaining} remaining)`
        );

        const row = this._firstVisibleRow();
        const trashBtn = row
          .getByRole('button', { name: /move to trash/i })
          .or(row.locator('button').filter({ hasText: /trash/i }))
          .first();

        await row.hover().catch(() => {});
        await trashBtn.waitFor({ state: 'visible', timeout: 5000 });
        await trashBtn.click();
        await this._confirmDialog('Move to Trash', 'Move to Trash');
        await assertPartnerMovedToTrash(this.page);
        await this.page.waitForTimeout(800);
        moved += 1;
      }

      await this.clearSearch();
    });

    if (moved === 0) {
      logger.info(`[PartnerCleanupPage] No active partners found containing: "${websiteUrl}"`);
    }

    return moved;
  }

  /**
   * For every visible row containing `websiteUrl`, clicks the "Delete Permanently" button.
   * Must be called while the Trash status filter is active.
   * Returns the number of partners permanently deleted.
   * @param {string} websiteUrl
   * @returns {Promise<number>}
   */
  async permanentlyDeleteMatchingPartners(websiteUrl) {
    let deleted = 0;
    let hasMatches = await this._applyWebsiteSearch(websiteUrl);

    if (!hasMatches) {
      await this.clearSearch();
      const urlRowCount = await this._rowsMatchingWebsiteUrl(websiteUrl).count();
      hasMatches = urlRowCount > 0;
      if (hasMatches) {
        logger.info(
          `[PartnerCleanupPage] Found ${urlRowCount} trashed row(s) by scanning list text`
        );
      }
    }

    while (
      (await this._visibleDataRows().count()) > 0 ||
      (await this._rowsMatchingWebsiteUrl(websiteUrl).count()) > 0
    ) {
      const remaining =
        (await this._visibleDataRows().count()) ||
        (await this._rowsMatchingWebsiteUrl(websiteUrl).count());
      logger.info(
        `[PartnerCleanupPage] Permanently deleting partner (${remaining} remaining) for URL "${websiteUrl}"`
      );

      const row =
        (await this._visibleDataRows().count()) > 0
          ? this._firstVisibleRow()
          : this._rowsMatchingWebsiteUrl(websiteUrl).first();

      const deleteBtn = row
        .getByRole('button', { name: /delete permanently/i })
        .or(row.locator('button').filter({ hasText: /delete permanently/i }))
        .first();

      await row.hover().catch(() => {});
      await deleteBtn.waitFor({ state: 'visible', timeout: 5000 });
      await deleteBtn.click();
      await this._confirmDialog('Delete Permanently', 'Delete Permanently');
      await assertPartnerPermanentlyDeleted(this.page);
      await this.page.waitForTimeout(800);
      deleted += 1;

      if ((await this._visibleDataRows().count()) === 0 && hasMatches) {
        await this._applyWebsiteSearch(websiteUrl);
      }
    }

    await this.clearSearch();

    if (deleted === 0) {
      logger.info(`[PartnerCleanupPage] No trashed partners found containing: "${websiteUrl}"`);
    }

    return deleted;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Main orchestration
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Ensures no partner with the given website URL exists — either active or in Trash.
   *
   * Flow:
   *   1. Navigate to Partners list
   *   2. Search by websiteUrl in the active view
   *   3. Move any found partners to Trash
   *   4. Switch to Trash view (via "All Status" → "Trash" filter)
   *   5. Search by websiteUrl in the Trash view
   *   6. Permanently delete any found partners
   *   7. Reset filter to All
   *
   * @param {string} websiteUrl  e.g. "https://justifypicture.s2-tastewp.com"
   * @returns {Promise<{movedToTrash: number, permanentlyDeleted: number}>}
   */
  async ensureNoPartnerWithUrl(websiteUrl) {
    logger.info(`[PartnerCleanupPage] ── Cleanup start for: ${websiteUrl} ──`);

    // ── Step 1: Navigate + remove active/draft/inactive partners ──────────
    await this.navigateToPartnersList();
    const movedToTrash = await this.moveMatchingPartnersToTrash(websiteUrl);

    // ── Step 2: Permanently delete from Trash view ────────────────────────
    await this.clearSearch();
    await this.filterByTrash();
    await this.page.waitForTimeout(1000);

    const permanentlyDeleted = await this.permanentlyDeleteMatchingPartners(websiteUrl);

    // ── Step 3: Reset filter so subsequent tests see the full list ─────────
    await this.clearSearch();
    await this.filterByAll();

    logger.info(
      `[PartnerCleanupPage] ── Cleanup done — moved ${movedToTrash} to Trash, permanently deleted ${permanentlyDeleted} ──`
    );
    return { movedToTrash, permanentlyDeleted };
  }
}

module.exports = { PartnerCleanupPage };
