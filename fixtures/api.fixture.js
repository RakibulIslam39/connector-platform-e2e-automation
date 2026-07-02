'use strict';

const { test: base } = require('@playwright/test');
const { ConnectorApiService } = require('../common/api/connector-api');
const { HubApiService } = require('../common/api/hub-api');

/**
 * API fixture — injects pre-configured API service instances into tests.
 */
const apiFixture = base.extend({
  /**
   * Connector Platform API service.
   * Uses Playwright's built-in request context.
   */
  connectorApi: async ({ request }, use) => {
    const connectorApi = new ConnectorApiService(request);
    await use(connectorApi);
  },

  /**
   * HoodslyHub API service.
   */
  hubApi: async ({ request }, use) => {
    const hubApi = new HubApiService(request);
    await use(hubApi);
  },

  /**
   * WRHHub API service (uses same base class, different base URL).
   */
  wrhApi: async ({ request }, use) => {
    const { HubApiService } = require('../common/api/hub-api');
    const wrhApi = new HubApiService(request, process.env.WRH_HUB_BASE_URL);
    await use(wrhApi);
  },

  /**
   * WiksHub API service.
   */
  wiksApi: async ({ request }, use) => {
    const { HubApiService } = require('../common/api/hub-api');
    const wiksApi = new HubApiService(request, process.env.WIKS_HUB_BASE_URL);
    await use(wiksApi);
  },
});

module.exports = { apiFixture };
