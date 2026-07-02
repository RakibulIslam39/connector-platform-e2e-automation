'use strict';

/**
 * Partner Onboarding — Full Flow (V2)
 *
 * Three scenarios executed serially so each can consume data produced by the previous:
 *
 *   Scenario 1 — Create Partner
 *     Connector Hub SPA → Dashboard → Quick Actions → Add Partner
 *     Fills all form sections, stores generated values in runtimeState.
 *
 *   Scenario 2 — Partner Site Configuration
 *     Partner WordPress site → Settings → Hoodsly Partners Connector
 *     Uses API key and partner name from Scenario 1.
 *
 *   Scenario 3 — Imported Product & Attribute Validation
 *     Validates every imported product and attribute against stored runtimeState.
 *     Uses expect.soft() throughout — all checks run even when individual ones fail.
 *
 * Runtime data flows through the module-level `runtimeState` singleton.
 * No file I/O is needed since test.describe.serial() runs everything in one worker.
 */

const { test, expect } = require('../../fixtures');
const { runtimeState } = require('../../common/runtime/runtime-state');
const {
  generatePartnerName,
  generateSkuPrefix,
  generateCustomTitle,
  generateCustomPrice,
  parsePriceText,
  generateFaqTitle,
  generateFaqAnswer,
  generatePolicyTitle,
  generatePolicyDescription,
  pickRandom,
} = require('../../common/utils/random-data-generator');
const { WpCliService } = require('../../common/utils/wp-cli-service');
const { ImportValidationService } = require('../../common/services/import-validation.service');
const { WP_PATHS } = require('../../constants/urls');

// ── Attribute option pools ──────────────────────────────────────────────────
const ALL_VENTILATIONS = ['Zline', 'Broan', 'TradeWinds', 'Vent-A-Hood', 'Hauslane'];
const ALL_TRIMS = ['Classic Trim', 'Block Trim', 'Flat Trim'];

test.describe.serial('Partner Onboarding — Full Flow', () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 1: Create Partner
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Scenario 1: Create Partner', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`${process.env.BASE_URL}${WP_PATHS.ADMIN}`);
      await page.waitForLoadState('domcontentloaded');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // TC-CP-000 — Pre-condition: clean up any existing partner for the test URL
    //
    // Prevents "Failed to create partner. Website may already exist." errors by
    // ensuring the Partners list contains no active or trashed entry for
    // PARTNER_SITE_BASE_URL before TC-CP-001 attempts to create one.
    //
    // Flow:
    //   1. Search active partners for the URL → Move to Trash if found
    //   2. Switch to "Trash" status view → search again → Delete Permanently
    //   3. Reset filter so subsequent tests start with a clean list view
    // ─────────────────────────────────────────────────────────────────────────
    test(
      'TC-CP-000: should remove any existing partner for the test website URL',
      async ({ partnerCleanupPage }) => {
        test.setTimeout(120_000);

        const websiteUrl = process.env.PARTNER_SITE_BASE_URL;
        expect(websiteUrl, 'PARTNER_SITE_BASE_URL must be set in environment').toBeTruthy();

        await test.step(
          `Ensure no partner exists for ${websiteUrl}`,
          async () => {
            const urlCleanup = await partnerCleanupPage.ensureNoPartnerWithUrl(websiteUrl);

            console.log(
              `[TC-CP-000] URL cleanup — moved to trash: ${urlCleanup.movedToTrash}, permanently deleted: ${urlCleanup.permanentlyDeleted}`
            );
          }
        );
      }
    );

    test(
      'TC-CP-001: should create a new partner with all required configurations',
      async ({ page, partnerFormPage }) => {
        // This test fills a large multi-tab form (44 products, 20 sizes, attributes, FAQ,
        // shipping policy) that routinely takes 60–90 seconds. Override the global 60s limit.
        test.setTimeout(180_000);

        // ── Step 1: Navigate via Dashboard Quick Actions ───────────────────────
        await test.step('Navigate to Add Partner via Quick Actions', async () => {
          await partnerFormPage.navigateToAddPartnerViaQuickActions();
        });

        // ── Step 2: Partner Name ──────────────────────────────────────────────
        await test.step('Fill Partner Name', async () => {
          runtimeState.partnerName = generatePartnerName();
          await partnerFormPage.fillPartnerName(runtimeState.partnerName);
        });

        // ── Step 3: Partner Type ──────────────────────────────────────────────
        await test.step('Select Partner Type: B2C', async () => {
          await partnerFormPage.selectPartnerType('B2C');
        });

        // ── Step 4: Website URL ───────────────────────────────────────────────
        await test.step('Fill Website URL from env', async () => {
          const partnerSiteUrl = process.env.PARTNER_SITE_BASE_URL;
          expect(partnerSiteUrl, 'PARTNER_SITE_BASE_URL must be set').toBeTruthy();
          await partnerFormPage.fillWebsiteUrl(partnerSiteUrl);
        });

        // ── Step 5: Generate and copy API Key ─────────────────────────────────
        await test.step('Generate API Key, click Copy, validate clipboard toast', async () => {
          runtimeState.apiKey = await partnerFormPage.generateAndCopyApiKey();
          expect(runtimeState.apiKey, 'API key must be non-empty').toBeTruthy();
        });

        // ── Step 6: Status ────────────────────────────────────────────────────
        await test.step('Select Status: Active', async () => {
          await partnerFormPage.selectStatus('Active');
        });

        // ── Step 7: Partner Colors Style ──────────────────────────────────────
        await test.step('Select Color Style: Select (skip if already selected)', async () => {
          await partnerFormPage.selectColorStyle('Select');
        });

        // ── Step 8: SKU Prefix ────────────────────────────────────────────────
        await test.step('Generate and fill SKU Prefix', async () => {
          runtimeState.skuPrefix = generateSkuPrefix();
          await partnerFormPage.fillSkuPrefix(runtimeState.skuPrefix);
        });

        // ── Step 9: Platform Type ─────────────────────────────────────────────
        await test.step('Select Platform Type: WordPress', async () => {
          await partnerFormPage.selectPlatformType('WordPress');
        });

        // ── Step 10: Hub API Key ──────────────────────────────────────────────
        await test.step('Fill Hub API Key from env', async () => {
          const hubApiKey = process.env.HUB_API_KEY;
          expect(hubApiKey, 'HUB_API_KEY must be set').toBeTruthy();
          await partnerFormPage.fillHubApiKey(hubApiKey);
        });

        // ── Step 11: Environment ──────────────────────────────────────────────
        await test.step('Select Environment: Staging', async () => {
          await partnerFormPage.selectEnvironment('Staging');
        });

        // ── Step 12: Add All Products ─────────────────────────────────────────
        await test.step('Add ALL available products', async () => {
          const { count, products } = await partnerFormPage.addAllProducts();
          runtimeState.selectedProducts = products;
          runtimeState.expectedProductCount = count;
          expect.soft(count, 'At least 44 products should be added on hub').toBeGreaterThanOrEqual(44);
        });

        // ── Step 13: Double Curved — Custom Title ─────────────────────────────
        await test.step('Set Double Curved custom title', async () => {
          runtimeState.doubleCurvedCustomTitle = generateCustomTitle();
          await partnerFormPage.setProductCustomTitle('Double Curved', runtimeState.doubleCurvedCustomTitle);
          runtimeState.selectedProducts = runtimeState.selectedProducts.map((product) =>
            product.catalogName.toLowerCase().includes('double curved')
              ? { ...product, customTitle: runtimeState.doubleCurvedCustomTitle }
              : product
          );
        });

        // ── Step 14: Partner Colors — Custom Color Match + Select All ──────────
        await test.step('Open Partner Colors, enable Custom Color Match, click Select All', async () => {
          await partnerFormPage.openPartnerColorsSection();
          await partnerFormPage.enableCustomColorMatch();
          runtimeState.selectedColors = await partnerFormPage.clickSelectAllColors();
        });

        // ── Step 15: Catalog Filter Validation ────────────────────────────────
        await test.step('Validate Filter by Catalog — all options', async () => {
          await partnerFormPage.validateCatalogFilter(expect);
        });

        // ── Step 16: Primed / Paint Ready ────────────────────────────────────
        await test.step('Primed / Paint Ready — read current price, generate valid custom price, fill values', async () => {
          const currentPriceText = await partnerFormPage.getPrimedRowCurrentPrice();
          runtimeState.primedPaintReadyCurrentPrice = parsePriceText(currentPriceText);

          // B2C rule: custom price MUST be >= current price
          runtimeState.primedPaintReadyCustomPrice = generateCustomPrice(
            runtimeState.primedPaintReadyCurrentPrice
          );

          expect(
            runtimeState.primedPaintReadyCustomPrice,
            'Custom price must be >= current price (B2C rule)'
          ).toBeGreaterThanOrEqual(runtimeState.primedPaintReadyCurrentPrice);

          runtimeState.primedPaintReadyCustomName = generateCustomTitle();

          await partnerFormPage.fillPrimedCustomName(runtimeState.primedPaintReadyCustomName);
          await partnerFormPage.fillPrimedCustomPrice(runtimeState.primedPaintReadyCustomPrice);
        });

        // ── Step 17: Partner Ventilations (randomly pick 4) ──────────────────
        await test.step('Select 4 random Partner Ventilations', async () => {
          runtimeState.selectedVentilations = pickRandom(ALL_VENTILATIONS, 4);
          await partnerFormPage.selectVentilations(runtimeState.selectedVentilations);
        });

        // ── Step 18: Partner Trims (randomly pick 2) ──────────────────────────
        await test.step('Select 2 random Partner Trims', async () => {
          runtimeState.selectedTrims = pickRandom(ALL_TRIMS, 2);
          await partnerFormPage.selectTrims(runtimeState.selectedTrims);
        });

        // ── Step 19: Partner Sizes (randomly pick 20) ─────────────────────────
        await test.step('Select 20 random Partner Sizes', async () => {
          const allSizes = await partnerFormPage.getAllSizeOptions();
          runtimeState.selectedSizes = pickRandom(allSizes, 20);
          await partnerFormPage.selectSizes(runtimeState.selectedSizes);
        });

        // ── Step 20: Billing Model ────────────────────────────────────────────
        await test.step('Select Billing Model: Distro', async () => {
          await partnerFormPage.selectBillingModel('Distro');
        });

        // ── Step 21: Shipping Paid By ─────────────────────────────────────────
        await test.step('Ensure Partner pays shipping (own RL account)', async () => {
          await partnerFormPage.ensurePartnerPaysShipping();
        });

        // ── Step 22: FAQ ──────────────────────────────────────────────────────
        await test.step('Add FAQ with generated title and answer', async () => {
          runtimeState.faqTitle = generateFaqTitle();
          runtimeState.faqAnswer = generateFaqAnswer();
          await partnerFormPage.addFaq(runtimeState.faqTitle, runtimeState.faqAnswer);
        });

        // ── Step 23: Shipping Policy ──────────────────────────────────────────
        await test.step('Add Shipping & Returns policy', async () => {
          runtimeState.policyTitle = generatePolicyTitle();
          runtimeState.policyDescription = generatePolicyDescription();
          await partnerFormPage.addPolicy(runtimeState.policyTitle, runtimeState.policyDescription);
        });

        // ── Step 24: Create Partner ───────────────────────────────────────────
        await test.step('Click Create Partner and validate success popup', async () => {
          await partnerFormPage.clickCreatePartner();
        });

        // ── Step 25: Re-read persisted API key from edit form ─────────────────
        await test.step('Read stored API key from created partner edit form', async () => {
          runtimeState.apiKey = await partnerFormPage.readStoredApiKeyForPartner(
            runtimeState.partnerName
          );
          expect(runtimeState.apiKey, 'Stored API key must be non-empty').toBeTruthy();
        });

        // ── Final: Log stored runtime values ─────────────────────────────────
        console.log('[Scenario 1] Runtime state stored:', {
          partnerName: runtimeState.partnerName,
          apiKey: runtimeState.apiKey ? `${runtimeState.apiKey.substring(0, 8)}...` : null,
          skuPrefix: runtimeState.skuPrefix,
          doubleCurvedCustomTitle: runtimeState.doubleCurvedCustomTitle,
          primedPaintReadyCustomName: runtimeState.primedPaintReadyCustomName,
          primedPaintReadyCustomPrice: runtimeState.primedPaintReadyCustomPrice,
          selectedColors: runtimeState.selectedColors.length,
          selectedProducts: runtimeState.selectedProducts.length,
          expectedProductCount: runtimeState.expectedProductCount,
          selectedVentilations: runtimeState.selectedVentilations,
          selectedTrims: runtimeState.selectedTrims,
          selectedSizes: runtimeState.selectedSizes.length,
        });
      }
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 2: Partner Site Configuration
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Scenario 2: Partner Site Configuration', () => {
    test(
      'TC-CP-002: should configure connector plugin on partner site using stored API key',
      async ({ connectorSettingsPage }) => {
        // Verify runtime state carries over from Scenario 1
        expect(runtimeState.apiKey, 'API key must be available from Scenario 1').toBeTruthy();
        expect(runtimeState.partnerName, 'Partner name must be available from Scenario 1').toBeTruthy();

        // ── Step 1: Login to partner WordPress site ───────────────────────────
        await test.step('Login to partner site as WP admin', async () => {
          await connectorSettingsPage.loginAsPartner();
        });

        // ── Step 2: Navigate to Connector Plugin Settings ─────────────────────
        await test.step('Navigate to Settings → Hoodsly Partners Connector', async () => {
          await connectorSettingsPage.navigateToSettings();
          await connectorSettingsPage.page.reload({ waitUntil: 'domcontentloaded' });
          await connectorSettingsPage.apiKeyInput.waitFor({ state: 'visible', timeout: 20000 });
        });

        // ── Step 3: Input API Key and submit ────────────────────────────────
        await test.step('Input stored API key and submit', async () => {
          await connectorSettingsPage.inputApiKey(runtimeState.apiKey);
          const connectedName = await connectorSettingsPage.submitApiKey();
          runtimeState.connectedPartnerName =
            connectedName || (await connectorSettingsPage.readConnectedPartnerName());
          if (
            runtimeState.connectedPartnerName &&
            runtimeState.connectedPartnerName !== runtimeState.partnerName
          ) {
            console.warn(
              `[Scenario 2] Connected partner "${runtimeState.connectedPartnerName}" differs from created "${runtimeState.partnerName}" — attribute validation uses imported site data`
            );
          }
        });

        // ── Step 4: Enable auto-publish toggle ───────────────────────────────
        await test.step('Enable "Publish products automatically upon import?"', async () => {
          await connectorSettingsPage.enableAutoPublish();
        });

        // ── Step 5: Save settings ─────────────────────────────────────────────
        await test.step('Click Save and validate success notification', async () => {
          await connectorSettingsPage.saveSettings();
          await connectorSettingsPage.waitForSettingsSaved();
        });

        // ── Step 6: Accept import terms ────────────────────────────────────────
        await test.step('Accept Terms and Conditions on Import tab', async () => {
          await connectorSettingsPage.enableImportToggle();
        });

        // ── Step 7: Click Import ──────────────────────────────────────────────
        await test.step('Click Import and validate product import success', async () => {
          await connectorSettingsPage.clickImport();
          await connectorSettingsPage.waitForImportSuccess();
        });
      }
    );
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 3: Imported Product & Attribute Validation
  // ═══════════════════════════════════════════════════════════════════════════

  test.describe('Scenario 3: Imported Product & Attribute Validation', () => {
    /**
     * WP-CLI service shared across all Scenario 3 steps.
     * Initialized once here; isCliAvailable() determines whether to use CLI or REST.
     */
    let wpCli;

    test.beforeAll(async () => {
      wpCli = new WpCliService();
    });

    test(
      'TC-CP-003: should validate all imported products exist and match stored configurations',
      async ({ connectorSettingsPage }) => {
        test.setTimeout(180000);
        expect(runtimeState.partnerName, 'partnerName must be set').toBeTruthy();
        expect(runtimeState.doubleCurvedCustomTitle, 'doubleCurvedCustomTitle must be set').toBeTruthy();
        expect(
          runtimeState.selectedProducts.length,
          'selectedProducts must be captured in Scenario 1'
        ).toBeGreaterThan(0);

        await test.step('Login to partner site for product validation', async () => {
          await connectorSettingsPage.loginAsPartner();
          wpCli.setApiRequest(connectorSettingsPage.page.request);
        });

        const importValidation = new ImportValidationService(
          wpCli,
          runtimeState,
          connectorSettingsPage.page
        );

        await importValidation.runAllValidations(expect, test.step.bind(test));
      }
    );
  });
});
