'use strict';

/**
 * Barrel export for the common module.
 * Import common utilities from a single entry point.
 */

// Utils
const logger = require('./utils/logger');
const waitUtils = require('./utils/wait-utils');
const retryHandler = require('./utils/retry-handler');
const dataUtils = require('./utils/data-utils');

// API services
const { ApiClient } = require('./api/api-client');
const { ConnectorApiService } = require('./api/connector-api');
const { HubApiService } = require('./api/hub-api');

// Auth
const { authManager, AuthManager } = require('./auth/auth-manager');

// Actions
const wpActions = require('./actions/wp-actions');
const wooActions = require('./actions/woo-actions');
const formActions = require('./actions/form-actions');

module.exports = {
  logger,
  waitUtils,
  retryHandler,
  dataUtils,
  ApiClient,
  ConnectorApiService,
  HubApiService,
  authManager,
  AuthManager,
  wpActions,
  wooActions,
  formActions,
};
