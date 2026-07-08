'use strict';

/**
 * Product Onboarding — Full Flow
 *
 * Three scenarios run serially, sharing the module-level `runtimeState` singleton
 * (same pattern as partner-creation.spec.js):
 *
 *   TC-PC-001 — Create Product (Connector Hub → Products → Add Product)
 *               Fill Basic Info, select attributes (random pick per group, stored
 *               by index), enable required toggles, submit. Stores everything in
 *               runtimeState so 002/003 can consume it.
 *
 *   TC-PC-002 — Add the created product to a partner (Edit Partner → Products →
 *               Update Partner) and validate the "Partner updated." popup.
 *
 *   TC-PC-003 — Validate the created product + its attribute options on the
 *               partner site (mirrors partner-creation Scenario 3).
 *
 * Selectors are derived from the existing partner-form / partner-product-edit
 * page objects that already drive this SPA. A couple of product-page specifics
 * (the "Enable for this product" toggle role/name) should be confirmed on the
 * first live run — see inline notes.
 */

const { test, expect } = require('../../fixtures');
const { runtimeState } = require('../../common/runtime/runtime-state');
const { generateProductCreationDataSet } = require('../../common/utils/random-data-generator');
const { WpCliService } = require('../../common/utils/wp-cli-service');
const { PartnerProductEditPage } = require('../../pages/partner-site/partner-product-edit.page');
const { TAGS } = require('../../constants/test-tags');

const [productData] = generateProductCreationDataSet(1);

test.describe.serial(`${TAGS.CONNECTOR} ${TAGS.PRODUCT} Product Onboarding — Full Flow`, () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 1 — Create Product
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Scenario 1: Create Product', () => {
    test('TC-PC-001: should create a new product with random attributes and required toggles', async ({
      productCreationPage,
    }) => {
      // Selecting almost every option across ~51 groups is click-heavy.
      test.setTimeout(300_000);
      runtimeState.createdProduct = productData;

      await test.step('Navigate to Add Product via Connector Hub menu', async () => {
        await productCreationPage.navigateToAddProductViaMenu();
      });

      await test.step(`Fill Basic Info — "${productData.title}" (${productData.sku})`, async () => {
        await productCreationPage.fillTitle(productData.title);
        await productCreationPage.fillSku(productData.sku);
        await productCreationPage.selectStatus(productData.status);
        await productCreationPage.setDescription(productData.description);
        await productCreationPage.setDimensions(productData.dimensions);
        await productCreationPage.selectCategory(productData.category);
        await productCreationPage.setFeaturedImage(productData.imageName || 'test image', '9');
        await productCreationPage.addGalleryImage(productData.imageName || 'test image');
      });

      // ── Step 1 of 2: POST /products — creates the product (no attributes) ──
      // The SPA's Add Product form only sends basic fields on creation. It then
      // auto-redirects to the Edit Product page (#/products?action=edit&id={id})
      // where attributes are saved via a separate POST /products/{id}.
      await test.step('Submit product (POST) and confirm creation — SPA redirects to Edit page', async () => {
        await productCreationPage.submitProduct();
        await expect(productCreationPage.successMessage).toBeVisible();
        // Wait for the SPA to redirect to the Edit Product page
        await productCreationPage.waitForEditPage();
      });

      // ── Step 2 of 2: POST /products/{id} — save attributes on Edit page ───
      await test.step('Open Attributes tab (Edit page) and select attributes (random pick, stored by index)', async () => {
        await productCreationPage.openAttributesTab();
        // Random pick per group; each decision recorded with an ordinal `index`
        // so duplicate-named groups stay distinguishable for later validation.
        runtimeState.productSelectedAttributes = await productCreationPage.selectAllAttributes();
        expect(
          runtimeState.productSelectedAttributes.length,
          'At least one attribute group should be processed'
        ).toBeGreaterThan(0);
      });

      await test.step('Enable required toggles (Edit page — idempotent: enable if off, skip if on)', async () => {
        await productCreationPage.enableColorToggle();
        await productCreationPage.enableSherwinWilliamsColorCodeToggle();
        await productCreationPage.enablePhysicalSampleInstructionsToggle();
        runtimeState.productEnabledToggles = [
          'Color',
          'Please Enter Your Sherwin-Williams Color Code',
          'Physical Sample Instructions',
        ];
      });

      await test.step('Update product (POST /products/{id}) to persist attribute selections', async () => {
        await productCreationPage.updateProduct();
        await expect(productCreationPage.updateSuccessMessage).toBeVisible();
      });

      // eslint-disable-next-line no-console
      console.log('[TC-PC-001] Created product:', {
        product: runtimeState.createdProduct,
        attributeGroups: runtimeState.productSelectedAttributes.length,
        toggles: runtimeState.productEnabledToggles,
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 2 — Add Product to Partner
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Scenario 2: Add Product to Partner', () => {
    test('TC-PC-002: should add the created product to the partner and confirm "Partner updated."', async ({
      partnerFormPage,
    }) => {
      test.setTimeout(120_000);
      expect(runtimeState.createdProduct, 'Product must be created in TC-PC-001').toBeTruthy();

      // Resolve the partner by its website host (PARTNER_SITE_BASE_URL) — each
      // partner row shows its site URL, so this finds the correct partner
      // deterministically. Falls back to the created/env partner name.
      const siteHost = (process.env.PARTNER_SITE_BASE_URL || '')
        .replace(/^https?:\/\//i, '')
        .replace(/\/.*$/, '')
        .trim();
      const searchTerm = siteHost || runtimeState.partnerName || process.env.PARTNER_NAME || null;

      await test.step(`Search Partners by "${searchTerm}" and open Edit`, async () => {
        const resolved = await partnerFormPage.openPartnerForEdit(searchTerm);
        runtimeState.partnerName = resolved;
        expect(resolved, 'A partner must be found for the test site').toBeTruthy();
      });

      await test.step('Add the created product via the Products tab', async () => {
        await partnerFormPage.addProductToPartner(runtimeState.createdProduct.title);
      });

      await test.step('Click Update Partner and validate the "Partner updated." popup', async () => {
        const notice = await partnerFormPage.updatePartner();
        expect(notice).toContain('Partner updated.');
      });

      await test.step('Clear all Connector Hub caches after Update Partner', async () => {
        await partnerFormPage.clearAllCaches();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Scenario 3 — Validate Product on Partner Site
  // ═══════════════════════════════════════════════════════════════════════════
  test.describe('Scenario 3: Validate Product on Partner Site', () => {
    test('TC-PC-003: should validate the created product and its attributes on the partner site', async ({
      connectorSettingsPage,
    }) => {
      test.setTimeout(180_000);
      const product = runtimeState.createdProduct;
      expect(product, 'Product must be created in TC-PC-001').toBeTruthy();

      const wpCli = new WpCliService();

      await test.step('Login to partner site for product validation', async () => {
        await connectorSettingsPage.loginAsPartner();
        wpCli.setApiRequest(connectorSettingsPage.page.request);
      });

      await test.step('Import data from Connector Platform and validate "Product imported successfully."', async () => {
        await connectorSettingsPage.navigateToSettings();
        await connectorSettingsPage.enableImportToggle();
        await connectorSettingsPage.clickImport();
        await connectorSettingsPage.waitForImportSuccess();
      });

      const expectedTitle = (runtimeState.productCustomTitle || product.title).trim();
      let imported = null;

      await test.step(`Resolve imported product: "${expectedTitle}"`, async () => {
        const all = await wpCli.getProducts();
        imported =
          all.find((p) => (p.post_title || '').trim() === expectedTitle) ||
          all.find((p) =>
            (p.post_title || '').toLowerCase().includes(product.title.toLowerCase())
          ) ||
          (await wpCli.findProductBySku(product.sku));
        expect
          .soft(imported, `Product "${expectedTitle}" should exist on the partner site`)
          .toBeTruthy();
      });

      if (!imported || !imported.ID) {
        return;
      }

      await test.step('Validate imported product has a SKU', async () => {
        expect.soft((imported.sku || '').trim(), 'Imported product should have a SKU').toBeTruthy();
      });

      await test.step('Validate imported product identity + attribute presence', async () => {
        const editPage = new PartnerProductEditPage(connectorSettingsPage.page);
        await editPage.openProductEdit(imported.ID);

        // Product identity: the edit-page title matches the created product.
        const uiTitle = (await editPage.getProductTitle().catch(() => '')).trim();
        expect
          .soft(uiTitle, 'Imported product title should match the created product')
          .toContain(product.title);

        // Attribute options: connector-hub selection labels do NOT map 1:1 to the
        // partner-site taxonomy terms — hub config toggles ("Yes", "Removed",
        // "Our Color Options", "None") aren't terms, and sizes use exterior
        // dimensions ("31\" x 36\"") vs nominal ("30\" x 36\""). So exact per-option
        // matching is unreliable. Instead verify each configured category actually
        // imported values, and log selected-vs-imported counts for visibility.
        for (const uiLabel of ['Color', 'Size', 'Ventilation', 'Trim']) {
          const selectedCount = runtimeState.productSelectedAttributes
            .filter((g) => (g.group || '').toLowerCase().includes(uiLabel.toLowerCase()))
            .reduce((n, g) => n + (Array.isArray(g.values) ? g.values.length : 0), 0);
          const importedValues = await editPage.getAttributeValues(uiLabel).catch(() => []);

          // eslint-disable-next-line no-console
          console.log(
            `[TC-PC-003] ${uiLabel}: ~${selectedCount} selected in hub → ${importedValues.length} imported on product`
          );

          if (selectedCount > 0) {
            expect
              .soft(
                importedValues.length,
                `${uiLabel}: product should have imported ${uiLabel} options`
              )
              .toBeGreaterThan(0);
          }
        }
      });
    });
  });
});
