'use strict';

const logger = require('./logger');

/**
 * Executes an async function with configurable retry logic.
 *
 * @param {Function} fn - async function to execute
 * @param {object} options
 * @param {number} options.retries - number of retry attempts (default: 3)
 * @param {number} options.delay - delay between retries in ms (default: 1000)
 * @param {number} options.backoff - multiplier applied to delay after each failure (default: 1.5)
 * @param {string} options.label - descriptive label for logging
 * @param {Function} options.shouldRetry - predicate to decide if error is retryable
 * @returns {Promise<*>}
 */
async function withRetry(fn, options = {}) {
  const {
    retries = 3,
    delay = 1000,
    backoff = 1.5,
    label = 'operation',
    shouldRetry = () => true,
  } = options;

  let lastError;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await fn();
      if (attempt > 1) {
        logger.info(`[retry] ${label} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      if (attempt <= retries && shouldRetry(error)) {
        logger.warn(
          `[retry] ${label} failed on attempt ${attempt}/${retries + 1}: ${error.message}. Retrying in ${currentDelay}ms...`
        );
        await sleep(currentDelay);
        currentDelay = Math.floor(currentDelay * backoff);
      } else {
        logger.error(`[retry] ${label} failed after ${attempt} attempt(s): ${error.message}`);
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Retries a Playwright action that may fail due to flakiness.
 * Specifically handles TimeoutError and ElementNotFoundError.
 *
 * @param {Function} action - async Playwright action
 * @param {number} retries
 */
async function retryAction(action, retries = 2) {
  return withRetry(action, {
    retries,
    delay: 500,
    label: 'playwright-action',
    shouldRetry: (err) => {
      const retryableErrors = ['TimeoutError', 'Error: elementHandle', 'strict mode violation'];
      return retryableErrors.some((msg) => err.message.includes(msg) || err.name === msg);
    },
  });
}

/**
 * Retries an API call.
 * @param {Function} apiFn - async function returning an API response
 * @param {number} retries
 */
async function retryApiCall(apiFn, retries = 3) {
  return withRetry(apiFn, {
    retries,
    delay: 2000,
    backoff: 2,
    label: 'api-call',
    shouldRetry: (err) => {
      // Retry on network errors or 5xx status codes
      return err.message.includes('network') || (err.status && err.status >= 500);
    },
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { withRetry, retryAction, retryApiCall };
