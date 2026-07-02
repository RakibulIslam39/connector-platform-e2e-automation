'use strict';

const { BasePage } = require('../base.page');
const { HUB_PATHS } = require('../../constants/urls');
const { HUB_SELECTORS } = require('../../constants/selectors');
const { waitForWpNotice } = require('../../common/utils/wait-utils');
const logger = require('../../common/utils/logger');

class DamageClaimPage extends BasePage {
  constructor(page) {
    super(page);
    this.claimsList = page.locator('.damage-claims-list, .wp-list-table');
    this.fileClaimBtn = page.locator(HUB_SELECTORS.DAMAGE_CLAIM_BTN);
    this.claimTypeSelect = page.locator('[name="claim_type"]');
    this.claimDescriptionTextarea = page.locator('[name="claim_description"]');
    this.claimImageUpload = page.locator('[name="claim_images[]"]');
    this.submitClaimBtn = page.locator('[name="submit_claim"], [data-action="submit-claim"]');
    this.pickupWeekInput = page.locator('[name="pickup_week"]');
    this.pickupDateInput = page.locator('[name="pickup_date"]');
    this.completedStatusBtn = page.locator('[data-action="complete-claim"]');
  }

  async goto() {
    await this.navigate(HUB_PATHS.DAMAGE_CLAIMS);
  }

  /**
   * Files a damage claim from an order detail page.
   * @param {object} claimData - { type, description, imagePaths? }
   */
  async fileDamageClaim(claimData) {
    logger.info('[DamageClaimPage] Filing damage claim');

    if (await this.fileClaimBtn.isVisible()) {
      await this.fileClaimBtn.click();
      await this.waitForPageLoad();
    }

    await this.claimTypeSelect.selectOption(claimData.type || 'overall_damage');
    await this.claimDescriptionTextarea.fill(claimData.description);

    if (claimData.imagePaths && claimData.imagePaths.length > 0) {
      await this.claimImageUpload.setInputFiles(claimData.imagePaths);
    }

    await this.submitClaimBtn.click();
    await this.waitForPageLoad();

    const notice = await waitForWpNotice(this.page, 'success').catch(() => null);
    logger.info('[DamageClaimPage] Damage claim filed successfully');
    return notice;
  }

  /**
   * Confirms the pickup week and date for a damage claim.
   */
  async confirmPickup(pickupWeek, pickupDate) {
    logger.info(`[DamageClaimPage] Confirming pickup: week=${pickupWeek}, date=${pickupDate}`);

    if (await this.pickupWeekInput.isVisible()) {
      await this.pickupWeekInput.fill(pickupWeek);
    }
    if (await this.pickupDateInput.isVisible()) {
      await this.pickupDateInput.fill(pickupDate);
    }

    await this.page.locator('[name="confirm_pickup"]').click();
    return await waitForWpNotice(this.page, 'success').catch(() => null);
  }

  /**
   * Marks a damage claim as completed.
   */
  async completeClaim(claimId) {
    logger.info(`[DamageClaimPage] Completing claim: ${claimId}`);
    const claimRow = this.claimsList.locator('tr').filter({ hasText: String(claimId) });
    await claimRow.locator('[data-action="complete-claim"]').click();
    await this.page.waitForLoadState('domcontentloaded');
    return await waitForWpNotice(this.page, 'success').catch(() => null);
  }

  async getClaimCount() {
    await this.goto();
    return await this.claimsList.locator('tbody tr').count();
  }
}

module.exports = { DamageClaimPage };
