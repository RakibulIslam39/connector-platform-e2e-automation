'use strict';

const { mergeTests, expect } = require('@playwright/test');
const { pageFixture } = require('./page.fixture');
const { apiFixture } = require('./api.fixture');
const { authFixture } = require('./auth.fixture');

/**
 * Merged test fixture — the single entry point for all specs.
 * Composes page-object, API-service, and auth fixtures with Playwright's
 * official `mergeTests` helper (no manual re-implementation).
 *
 * @example
 *   const { test, expect } = require('../../fixtures');
 *   test('partner creation', async ({ partnerFormPage, connectorApi }) => { ... });
 */
const test = mergeTests(pageFixture, apiFixture, authFixture);

module.exports = { test, expect };
