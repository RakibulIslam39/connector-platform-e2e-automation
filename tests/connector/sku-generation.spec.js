'use strict';

const { test, expect } = require('../../fixtures');
const {
  generateMasterSku,
  deriveShortSku,
  validateSkuFormat,
  parseMasterSku,
  generateHubOrderId,
  applyReduceHeight,
} = require('../../helpers/sku-helper');
const { loadJsonConfig } = require('../../common/utils/data-utils');

const skuData = loadJsonConfig('sku-data.json');

test.describe('SKU Generation Logic', () => {
  test('SKU management page loads', async ({ skuManagementPage }) => {
    await skuManagementPage.goto();
    await expect(skuManagementPage.page).toHaveURL(/connector-sku/);
  });

  test('generate master SKU — Raw finish, 36x36', () => {
    const sku = generateMasterSku('VEN-CCX', {
      size: '36" x 36"',
      color: 'Raw / Unfinished',
    });
    expect(sku).toBe('VEN-CCX-3636-RAW');
    expect(validateSkuFormat(sku)).toBe(true);
  });

  test('generate master SKU — Primed finish, 30x36', () => {
    const sku = generateMasterSku('VEN-MCX', {
      size: '30" x 36"',
      color: 'Primed / Paint Ready',
    });
    expect(sku).toBe('VEN-MCX-3036-PRM');
  });

  test('generate master SKU — USCD partner color', () => {
    const sku = generateMasterSku('VEN-ANBS', {
      size: '36" x 36"',
      color: 'Shaker Antique White:USCD',
    });
    expect(sku).toBe('VEN-ANBS-3636-USCDSAW');
  });

  test('generate master SKU — with Reduce Height modifier', () => {
    const sku = generateMasterSku('VEN-ANBS', {
      size: '36" x 36"',
      color: 'Raw / Unfinished',
      reduceHeight: 'Remove 2"',
    });
    expect(sku).toBe('VEN-ANBS-3636-RAW-RH2');
  });

  test('generate master SKU — with Increase Depth modifier', () => {
    const sku = generateMasterSku('VEN-ANBS', {
      size: '36" x 36"',
      color: 'Primed / Paint Ready',
      increaseDepth: 'Increase Interior Depth To 19.3125"',
    });
    expect(sku).toBe('VEN-ANBS-3636-PRM-ID19-RSH');
  });

  test('generate master SKU — Floating Shelf uses Select Width', () => {
    const sku = generateMasterSku('VEN-FLS', {
      width: '30"',
      color: 'Raw / Unfinished',
    });
    expect(sku).toBe('VEN-FLS-FSW30-RAW');
  });

  test('generate master SKU — full modifier stack', () => {
    const sku = generateMasterSku('VEN-ANBS', {
      size: '48" x 36"',
      color: 'Shaker Antique White:USCD',
      increaseDepth: 'Increase Interior Depth To 19.3125"',
      reduceHeight: 'Remove 2"',
      extendChimney: '6" Extension',
    });
    expect(sku).toBe('VEN-ANBS-4836-USCDSAW-ID19-RSH-RH2-CH6');
  });

  test('derive short SKU strips the product base prefix', () => {
    expect(deriveShortSku('VEN-ANBS-3636-RAW', 'VEN-ANBS')).toBe('3636-RAW');
    expect(deriveShortSku('VEN-ANBS-3636-RAW-RH2', 'VEN-ANBS')).toBe('3636-RAW-RH2');
    expect(deriveShortSku('VEN-FLS-FSW30-RAW', 'VEN-FLS')).toBe('FSW30-RAW');
  });

  test('parse master SKU into components', () => {
    const parsed = parseMasterSku('VEN-ANBS-4836-USCDSAW-ID19-RSH-RH2-CH6');
    expect(parsed.productBaseSku).toBe('VEN-ANBS');
    expect(parsed.sizeCode).toBe('4836');
    expect(parsed.colorCode).toBe('USCDSAW');
    expect(parsed.modifiers).toEqual(['ID19', 'RSH', 'RH2', 'CH6']);
  });

  test('apply reduce height logic', () => {
    expect(applyReduceHeight(36, 2)).toBe(34);
    expect(applyReduceHeight(36, 6)).toBe(30);
  });

  test('apply reduce height throws for invalid result', () => {
    expect(() => applyReduceHeight(2, 5)).toThrow('Reduce height result is invalid');
  });

  test('validate SKU format', () => {
    expect(validateSkuFormat('VEN-ANBS-3636-RAW')).toBe(true);
    expect(validateSkuFormat('VEN-FLS-FSW30-RAW')).toBe(true);
    expect(validateSkuFormat('')).toBe(false);
    expect(validateSkuFormat(null)).toBe(false);
  });

  test('generate hub order ID for single item', () => {
    expect(generateHubOrderId('12345', 0)).toBe('12345');
  });

  test('generate hub order ID for multi-item order', () => {
    expect(generateHubOrderId('12345', 1)).toBe('12345-1');
    expect(generateHubOrderId('12345', 2)).toBe('12345-2');
  });

  test('SKU validation rules are defined in config', () => {
    const rules = skuData.validationRules;
    expect(rules.minLength).toBeGreaterThan(0);
    expect(rules.maxLength).toBeGreaterThan(rules.minLength);
    expect(rules.pattern).toBeTruthy();
    expect(rules.knownSizeSegments).toContain('3636');
    expect(rules.knownWidthSegments).toContain('FSW30');
  });
});
