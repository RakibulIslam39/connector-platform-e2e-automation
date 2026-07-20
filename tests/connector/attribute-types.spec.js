'use strict';

/**
 * Attribute Types & Values — Connector Hub SPA (Attributes).
 *
 * Serial suite so TC-AT-002 adds a value into the type created by TC-AT-001.
 * All input data is randomized (and returned by the POM) so the tests are
 * re-runnable and validate exactly what was entered.
 */

const { test, expect } = require('../../fixtures');
const { generateAttributeValueData } = require('../../common/utils/random-data-generator');
const { TAGS } = require('../../constants/test-tags');

test.describe.serial(`${TAGS.CONNECTOR} ${TAGS.MAPPING} Attribute Types & Values`, () => {
  let createdTypeName = null;
  let attributeValueData = null;
  // "Show in Partner Page" state chosen randomly at creation; drives the filter
  // assertions in TC-AT-005 (own filter) and TC-AT-006 (opposite filter).
  let createdShowInPartnerPage = null;

  test('TC-AT-001: should create an attribute type and show it in the list', async ({
    attributeTypesPage,
    page,
  }) => {
    test.setTimeout(120_000);

    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    createdTypeName = `Test Attribute Type ${suffix}`;
    const expectedSlug = createdTypeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let selectedType;

    await test.step('Open Connector Hub → Attributes → Attribute Types', async () => {
      await attributeTypesPage.openAttributeTypes();
    });

    await test.step(`Create attribute type "${createdTypeName}" (random type + random Show in Partner Page)`, async () => {
      ({ type: selectedType, showInPartnerPage: createdShowInPartnerPage } =
        await attributeTypesPage.createAttributeType({
          name: createdTypeName,
          type: 'random',
          description: 'test description',
          status: 'Active',
          showInPartnerPage: 'random', // randomly ON/OFF; stored for TC-AT-005/006
        }));
      await expect(attributeTypesPage.successMessage).toBeVisible();
      expect(typeof createdShowInPartnerPage, 'Toggle state must be stored').toBe('boolean');
    });

    await test.step('Search and validate the created type + its details', async () => {
      await attributeTypesPage.searchType(createdTypeName);
      await expect.soft(page.getByText(createdTypeName).first()).toBeVisible();
      await expect.soft(page.getByText(selectedType, { exact: true }).first()).toBeVisible();
      await expect.soft(page.getByText('Active').first()).toBeVisible();
      await expect.soft(page.getByText(expectedSlug).first()).toBeVisible();
    });
  });

  test('TC-AT-002: should add an attribute value with random data and validate it', async ({
    attributeTypesPage,
    page,
  }) => {
    test.setTimeout(120_000);
    expect(createdTypeName, 'Attribute type must be created in TC-AT-001').toBeTruthy();

    const data = (attributeValueData = generateAttributeValueData());

    await test.step(`Open values view for type "${createdTypeName}"`, async () => {
      await attributeTypesPage.openAttributeTypeValues(createdTypeName);
    });

    await test.step('Add an attribute value with random data', async () => {
      await attributeTypesPage.addAttributeValue(data);
      await expect(attributeTypesPage.attributeCreatedMessage).toBeVisible();
    });

    await test.step('Validate the created value + its details', async () => {
      await expect(page.getByText(data.name).first()).toBeVisible();
      await expect(page.getByText(data.sku).first()).toBeVisible();
      await expect(
        page.getByRole('cell', { name: `$${data.basePrice}.00`, exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('cell', { name: `$${data.distroPrice}.00`, exact: true })
      ).toBeVisible();
      await expect(page.getByText('Active').first()).toBeVisible();
    });
  });

  test('TC-AT-003: should edit the attribute type and validate the change', async ({
    attributeTypesPage,
    page,
  }) => {
    test.setTimeout(120_000);
    expect(createdTypeName, 'Attribute type must be created in TC-AT-001').toBeTruthy();

    const newName = `${createdTypeName} Edited`;

    await test.step(`Edit attribute type name → "${newName}"`, async () => {
      await attributeTypesPage.editAttributeType(createdTypeName, {
        name: newName,
        description: 'edited description',
        status: 'Active',
      });
    });

    await test.step('Search and validate the edited type', async () => {
      await attributeTypesPage.openAttributeTypes();
      await attributeTypesPage.searchType(newName);
      await expect(page.getByText(newName).first()).toBeVisible();
      await expect(page.getByText('Active').first()).toBeVisible();
    });

    // Subsequent scenarios must reference the type by its new name.
    createdTypeName = newName;
  });

  test('TC-AT-004: should edit the attribute value and validate the change', async ({
    attributeTypesPage,
    page,
  }) => {
    test.setTimeout(120_000);
    expect(createdTypeName, 'Attribute type must exist').toBeTruthy();
    expect(attributeValueData, 'Attribute value must be created in TC-AT-002').toBeTruthy();

    const newValueName = `${attributeValueData.name} Edited`;
    const newBasePrice = attributeValueData.basePrice + 5;
    const newDistroPrice = attributeValueData.distroPrice + 1;

    await test.step('Edit the attribute value', async () => {
      await attributeTypesPage.editAttributeValue(createdTypeName, attributeValueData.name, {
        name: newValueName,
        basePrice: newBasePrice,
        distroPrice: newDistroPrice,
        status: 'Active',
      });
    });

    await test.step('Validate the edited value + its details', async () => {
      await expect(page.getByText(newValueName).first()).toBeVisible();
      await expect(
        page.getByRole('cell', { name: `$${newBasePrice}.00`, exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole('cell', { name: `$${newDistroPrice}.00`, exact: true })
      ).toBeVisible();
      await expect(page.getByText('Active').first()).toBeVisible();
    });

    // Keep shared state consistent for any later scenarios.
    attributeValueData = {
      ...attributeValueData,
      name: newValueName,
      basePrice: newBasePrice,
      distroPrice: newDistroPrice,
    };
  });

  test('TC-AT-005: should show the type under its OWN filter per the stored toggle', async ({
    attributeTypesPage,
  }) => {
    test.setTimeout(120_000);
    expect(createdTypeName, 'Attribute type must be created in TC-AT-001').toBeTruthy();
    expect(typeof createdShowInPartnerPage, 'Toggle state stored in TC-AT-001').toBe('boolean');

    // Reuse the TC-AT-001 type; its filter classification follows the stored
    // "Show in Partner Page" state (ON → Partner, OFF → Product).
    const ownFilter = createdShowInPartnerPage ? 'partner' : 'product';

    await test.step(`"${ownFilter}" filter → the type IS visible`, async () => {
      await attributeTypesPage.openAttributeTypes();
      await attributeTypesPage.filterByAttributeType(ownFilter);
      await attributeTypesPage.searchType(createdTypeName);
      await expect(attributeTypesPage.attributeTypeRow(createdTypeName).first()).toBeVisible();
    });
  });

  test('TC-AT-006: should hide the type from the OPPOSITE filter per the stored toggle', async ({
    attributeTypesPage,
  }) => {
    test.setTimeout(120_000);
    expect(createdTypeName, 'Attribute type must be created in TC-AT-001').toBeTruthy();
    expect(typeof createdShowInPartnerPage, 'Toggle state stored in TC-AT-001').toBe('boolean');

    // Inverse of TC-AT-005: the type must NOT appear under the opposite filter.
    const oppositeFilter = createdShowInPartnerPage ? 'product' : 'partner';

    await test.step(`"${oppositeFilter}" filter → the type is NOT displayed`, async () => {
      await attributeTypesPage.openAttributeTypes();
      await attributeTypesPage.filterByAttributeType(oppositeFilter);
      await attributeTypesPage.searchType(createdTypeName);
      await expect(attributeTypesPage.attributeTypeRow(createdTypeName)).toHaveCount(0);
    });
  });
});
