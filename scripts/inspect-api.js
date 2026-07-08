'use strict';

/**
 * Standalone API inspection script.
 * Run: node scripts/inspect-api.js
 * Run specific endpoint: node scripts/inspect-api.js attributes-mapping
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../environments/.env.local') });

const { request } = require('@playwright/test');

const ENDPOINTS = {
  products: '/wp-json/connector-platform/v1/products',
  'attributes-mapping': '/wp-json/connector-platform/v1/attributes-mapping',
  partners: '/wp-json/connector-platform/v1/partners',
};

const target = process.argv[2] || 'products';
const endpoint = ENDPOINTS[target];

if (!endpoint) {
  console.error(`Unknown endpoint: "${target}". Available: ${Object.keys(ENDPOINTS).join(', ')}`);
  process.exit(1);
}

(async () => {
  const ctx = await request.newContext({
    baseURL: process.env.CONNECTOR_API_BASE_URL,
    extraHTTPHeaders: {
      'api-signature': process.env.CONNECTOR_API_SIGNATURE,
      website: process.env.BASE_URL,
      'Content-Type': 'application/json',
    },
  });

  console.log(`\n📡 Calling: GET ${process.env.CONNECTOR_API_BASE_URL}${endpoint}`);
  console.log(`🔑 api-signature: ${process.env.CONNECTOR_API_SIGNATURE?.slice(0, 12)}...`);
  console.log(`🌐 website: ${process.env.BASE_URL}\n`);

  const response = await ctx.get(endpoint);
  const status = response.status();
  const body = await response.json().catch(() => response.text());

  console.log(`✅ Status: ${status}`);
  console.log(`📦 Response type: ${Array.isArray(body) ? 'Array' : typeof body}`);

  if (typeof body === 'object' && !Array.isArray(body)) {
    console.log(`🗝️  Top-level keys: ${Object.keys(body).join(', ')}`);
  } else if (Array.isArray(body)) {
    console.log(`📊 Items count: ${body.length}`);
  }

  console.log('\n--- Full Response (pretty-printed) ---\n');
  console.log(JSON.stringify(body, null, 2));

  await ctx.dispose();
})().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
