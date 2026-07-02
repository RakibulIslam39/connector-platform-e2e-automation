'use strict';

const { generateMasterSku, deriveShortSku, parseMasterSku } = require('../helpers/sku-helper');

const cases = [
  ['VEN-CCX',  { size: '36" x 36"',  color: 'Raw / Unfinished'                         }, 'VEN-CCX-3636-RAW'],
  ['VEN-MCX',  { size: '30" x 36"',  color: 'Primed / Paint Ready'                     }, 'VEN-MCX-3036-PRM'],
  ['VEN-ANBS', { size: '36" x 36"',  color: 'Shaker Antique White:USCD'                }, 'VEN-ANBS-3636-USCDSAW'],
  ['VEN-ANBS', { size: '36" x 36"',  color: 'Raw / Unfinished', reduceHeight: 'Remove 2"' }, 'VEN-ANBS-3636-RAW-RH2'],
  ['VEN-ANBS', { size: '36" x 36"',  color: 'Primed / Paint Ready', increaseDepth: 'Increase Interior Depth To 19.3125"' }, 'VEN-ANBS-3636-PRM-ID19-RSH'],
  ['VEN-CCX',  { size: '36" x 36"',  color: 'Antique White:Hoodsly', solidBottom: true }, 'VEN-CCX-3636-HOOANT00001-SB'],
  ['VEN-FLS',  { width: '30"',        color: 'Raw / Unfinished'                         }, 'VEN-FLS-FSW30-RAW'],
  ['VEN-CCX',  { size: '36" x 36"', color: 'Shaker White:USCD', crownMolding: 'Steel Crown Molding', crownMoldingFit: 'Installed' }, 'VEN-CCX-3636-USCDSHW-MSCI-INC'],
  ['VEN-ANBS', { size: '48" x 36"', color: 'Shaker Antique White:USCD', increaseDepth: 'Increase Interior Depth To 19.3125"', reduceHeight: 'Remove 2"', extendChimney: '6" Extension' }, 'VEN-ANBS-4836-USCDSAW-ID19-RSH-RH2-CH6'],
];

let pass = 0;
let fail = 0;

cases.forEach(function(c) {
  const baseSku = c[0];
  const sel = c[1];
  const expected = c[2];
  const result = generateMasterSku(baseSku, sel);
  const ok = result === expected;
  if (ok) {
    console.log('PASS | ' + result);
    pass++;
  } else {
    console.log('FAIL | got: ' + result + ' | expected: ' + expected);
    fail++;
  }
});

console.log('\n--- ' + pass + '/' + cases.length + ' passed ---');

const short = deriveShortSku('VEN-ANBS-3636-RAW-RH2', 'VEN-ANBS');
console.log('\nderiveShortSku: ' + short + ' (expected: 3636-RAW-RH2)');

const parsed = parseMasterSku('VEN-ANBS-4836-USCDSAW-ID19-RSH-RH2-CH6');
console.log('parseMasterSku: ' + JSON.stringify(parsed));
