'use strict';

/**
 * TC-AT-007 — Product Attribute Type → Product → Partner Import (self-contained).
 *
 * Flow:
 *   1. Create an attribute type (+ one value) with a RANDOM "Show in Partner Page"
 *      toggle, so it lands as either a Product or Partner Attribute Type.
 *   2. Ensure it is a **Product Attribute Type** — if the filter shows it only as
 *      a Partner Attribute Type, edit it and disable "Show in Partner Page".
 *   3. Add the attribute to the "Double Curved" product (Connector Hub product
 *      Edit → Attributes) and Update Product.
 *   4. On the partner site, import from Connector Platform.
 *   5. Open the imported Double Curved product in WooCommerce and validate the
 *      attribute imported as a Custom Price accordion.
 */

const { test, expect } = require('../../fixtures');
const { generateAttributeValueData } = require('../../common/utils/random-data-generator');
const { WpCliService } = require('../../common/utils/wp-cli-service');
const { buildDoubleCurvedSkuCandidates } = require('../../common/utils/product-sku-utils');
const { PartnerProductEditPage } = require('../../pages/partner-site/partner-product-edit.page');
const { PartnerProductViewPage } = require('../../pages/partner-site/partner-product-view.page');
const { TAGS } = require('../../constants/test-tags');

const DOUBLE_CURVED = 'Double Curved';

test.describe.serial(`${TAGS.CONNECTOR} ${TAGS.MAPPING} Attribute → Product → Import`, () => {
  test('TC-ATV-001: a Product Attribute Type added to a product imports to the partner and validate attribute, Type, and Base Price on the product view page', async ({
    attributeTypesPage,
    productCreationPage,
    connectorSettingsPage,
  }) => {
    test.setTimeout(300_000);

    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    const typeName = `Test Attr Type ${suffix}`;
    const valueData = generateAttributeValueData();
    let chosenType = null; // the randomly selected input Type (Radio/Dropdown/…)

    await test.step('Create attribute type + value (random Show in Partner Page)', async () => {
      await attributeTypesPage.openAttributeTypes();
      // Exclude Text/Textarea: they render a free text input with no selectable
      // value or Base Price, so they can't satisfy this scenario's value + price
      // validation. Keep the pick random across option-based types.
      ({ type: chosenType } = await attributeTypesPage.createAttributeType({
        name: typeName,
        type: 'random',
        excludeTypes: ['Text', 'Textarea'],
        status: 'Active',
        showInPartnerPage: 'random',
      }));
      await expect(attributeTypesPage.successMessage).toBeVisible();
      expect(chosenType, 'Chosen attribute Type must be captured').toBeTruthy();

      await attributeTypesPage.openAttributeTypeValues(typeName);
      await attributeTypesPage.addAttributeValue(valueData);
      await expect(attributeTypesPage.attributeCreatedMessage).toBeVisible();
    });

    await test.step('Ensure it is a Product Attribute Type (disable toggle if Partner-only)', async () => {
      await attributeTypesPage.ensureProductAttributeType(typeName);
      // Confirm it now appears under the Product filter.
      await attributeTypesPage.openAttributeTypes();
      await attributeTypesPage.filterByAttributeType('product');
      await attributeTypesPage.searchType(typeName);
      await expect(attributeTypesPage.attributeTypeRow(typeName).first()).toBeVisible();
    });

    await test.step(`Add "${typeName}" to the "${DOUBLE_CURVED}" product and Update`, async () => {
      const selected = await productCreationPage.addAttributeTypeToProduct(
        DOUBLE_CURVED,
        typeName,
        valueData.name
      );
      expect(selected.length, 'At least one attribute value must be selected').toBeGreaterThan(0);
    });

    await test.step('Import the product on the partner site', async () => {
      await connectorSettingsPage.loginAsPartner();
      await connectorSettingsPage.navigateToSettings();
      await connectorSettingsPage.enableImportToggle();
      await connectorSettingsPage.clickImport();
      await connectorSettingsPage.waitForImportSuccess();
    });

    let doubleCurvedId = null;

    await test.step('Resolve the imported Double Curved product on the partner', async () => {
      const wpCli = new WpCliService();
      wpCli.setApiRequest(connectorSettingsPage.page.request);
      // Double Curved imports under the partner's CUSTOM title, so resolve it by
      // its SKU. Reuse buildDoubleCurvedSkuCandidates (DBC/DBC-DC + prefixes);
      // the partner SKU prefix is unknown here, so match on the DBC suffix.
      const products = await wpCli.getProducts();
      const skuCandidates = buildDoubleCurvedSkuCandidates(null).map((s) => s.toLowerCase());
      const match =
        products.find((p) =>
          skuCandidates.some((sku) => (p.sku || '').toLowerCase().includes(sku))
        ) || products.find((p) => (p.post_title || '').toLowerCase().includes('double curved'));
      expect(match, `"${DOUBLE_CURVED}" product must exist on the partner site`).toBeTruthy();
      doubleCurvedId = match.ID;
    });

    await test.step(`Validate "${typeName}" imported as a Custom Price accordion`, async () => {
      const editPage = new PartnerProductEditPage(connectorSettingsPage.page);
      await editPage.openProductEdit(doubleCurvedId);
      expect(
        await editPage.hasCustomPriceSection(typeName),
        `Imported product should expose the "${typeName}" attribute section`
      ).toBe(true);
    });

    await test.step('Validate attribute, Type, and Base Price on the product view page', async () => {
      const viewPage = new PartnerProductViewPage(connectorSettingsPage.page);
      await viewPage.openById(doubleCurvedId);

      // Attribute is rendered on the storefront.
      expect(
        await viewPage.hasAttribute(typeName),
        `Product page should render the "${typeName}" attribute`
      ).toBe(true);

      // Its control matches the Type chosen at creation (exact per business rule).
      const expectedControl = PartnerProductViewPage.expectedControlForType(chosenType);
      expect(
        await viewPage.getControlKind(typeName),
        `"${typeName}" should render as a ${chosenType} control (${expectedControl})`
      ).toBe(expectedControl);

      // The attribute value's Base Price is shown.
      expect(
        await viewPage.hasOptionPrice(typeName, valueData.basePrice),
        `Base Price $${valueData.basePrice} should appear for "${typeName}"`
      ).toBe(true);
    });
  });
});
