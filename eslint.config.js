'use strict';

/**
 * ESLint v9 flat config (migrated from legacy .eslintrc.js).
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 */

const js = require('@eslint/js');
const globals = require('globals');
const playwright = require('eslint-plugin-playwright');

module.exports = [
  // ── Ignore generated / vendored paths ──────────────────────────────────────
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**',
      'auth-state/**',
      '.playwright-mcp/**',
    ],
  },

  // ── Base recommended rule sets ─────────────────────────────────────────────
  js.configs.recommended,
  playwright.configs['flat/recommended'],

  // ── Project defaults ───────────────────────────────────────────────────────
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      // Node globals for the framework itself + browser globals for the code
      // that runs inside page.evaluate() callbacks (document, window, ...).
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      // Playwright-specific
      'playwright/no-wait-for-timeout': 'warn',
      'playwright/no-element-handle': 'error',
      'playwright/no-eval': 'warn',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/valid-expect': 'error',
      'playwright/no-conditional-expect': 'warn',
      'playwright/no-skipped-test': 'warn',
      'playwright/no-focused-test': 'error',

      // General
      'no-console': 'warn',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      'no-duplicate-imports': 'error',
      'no-trailing-spaces': 'error',
      semi: ['error', 'always'],
    },
  },

  // ── Browser globals for page.evaluate() callbacks ──────────────────────────
  // Page objects and wait utilities run code inside the browser via
  // page.evaluate(), where `document`, `window`, and the WP editor global
  // `tinymce` are legitimately available.
  {
    files: ['pages/**/*.js', 'common/utils/wait-utils.js'],
    languageOptions: {
      globals: { ...globals.browser, tinymce: 'readonly' },
    },
  },

  // ── Relax rules for spec / setup files ─────────────────────────────────────
  {
    files: ['tests/**/*.spec.js', 'tests/**/*.setup.js'],
    rules: {
      'no-console': 'off',
      'playwright/no-wait-for-timeout': 'off',
    },
  },

  // ── Allow console in hooks and the logger utility ──────────────────────────
  {
    files: ['hooks/**/*.js', 'common/utils/logger.js', 'scripts/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
];
