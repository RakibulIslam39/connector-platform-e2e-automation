'use strict';

const logger = require('../utils/logger');
const { retryApiCall } = require('../utils/retry-handler');
const { ResponseCapture } = require('../../helpers/response-capture');

/**
 * Base API client wrapping Playwright's `request` context.
 * All API service classes extend or use this client.
 */
class ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {string} baseURL
   * @param {object} defaultHeaders
   */
  constructor(request, baseURL, defaultHeaders = {}) {
    this.request = request;
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...defaultHeaders,
    };
  }

  /**
   * Builds full URL from endpoint path.
   */
  buildUrl(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  /**
   * Executes a GET request.
   * @param {string} endpoint
   * @param {object} options - additional request options (headers, params, etc.)
   */
  async get(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    logger.debug(`GET ${url}`);

    const response = await retryApiCall(() =>
      this.request.get(url, {
        headers: { ...this.defaultHeaders, ...options.headers },
        params: options.params,
        timeout: options.timeout || 30000,
      })
    );

    return this._handleResponse(response, 'GET', url);
  }

  /**
   * Executes a POST request.
   */
  async post(endpoint, body = {}, options = {}) {
    const url = this.buildUrl(endpoint);
    logger.debug(`POST ${url}`, { body });

    const response = await retryApiCall(() =>
      this.request.post(url, {
        headers: { ...this.defaultHeaders, ...options.headers },
        data: body,
        timeout: options.timeout || 30000,
      })
    );

    return this._handleResponse(response, 'POST', url);
  }

  /**
   * Executes a PUT request.
   */
  async put(endpoint, body = {}, options = {}) {
    const url = this.buildUrl(endpoint);
    logger.debug(`PUT ${url}`, { body });

    const response = await retryApiCall(() =>
      this.request.put(url, {
        headers: { ...this.defaultHeaders, ...options.headers },
        data: body,
        timeout: options.timeout || 30000,
      })
    );

    return this._handleResponse(response, 'PUT', url);
  }

  /**
   * Executes a DELETE request.
   */
  async delete(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    logger.debug(`DELETE ${url}`);

    const response = await retryApiCall(() =>
      this.request.delete(url, {
        headers: { ...this.defaultHeaders, ...options.headers },
        timeout: options.timeout || 30000,
      })
    );

    return this._handleResponse(response, 'DELETE', url);
  }

  /**
   * Handles the response: validates status, parses body, logs errors,
   * and records the response body into ResponseCapture for JSON export.
   */
  async _handleResponse(response, method, url) {
    const status = response.status();
    let body;

    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    // Auto-capture every response — written to reports/api-responses/ on teardown
    ResponseCapture.record({ method, url, status, body });

    if (!response.ok()) {
      logger.error(`[API] ${method} ${url} → ${status}`, { body });
      const err = new Error(`API request failed: ${method} ${url} → ${status}`);
      err.status = status;
      err.body = body;
      throw err;
    }

    logger.debug(`[API] ${method} ${url} → ${status}`);
    return { status, body, response };
  }
}

module.exports = { ApiClient };
