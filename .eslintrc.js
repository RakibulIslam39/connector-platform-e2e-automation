'use strict';

module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'commonjs',
  },
  extends: ['eslint:recommended', 'plugin:playwright/recommended'],
  plugins: ['playwright'],
  rules: {
    // Playwright-specific rules
    'playwright/no-wait-for-timeout': 'warn',
    'playwright/no-element-handle': 'error',
    'playwright/no-eval': 'warn',
    'playwright/prefer-web-first-assertions': 'error',
    'playwright/valid-expect': 'error',
    'playwright/no-conditional-expect': 'warn',
    'playwright/no-skipped-test': 'warn',
    'playwright/no-focused-test': 'error',

    // General rules
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
  overrides: [
    {
      // Relax rules for test spec files
      files: ['tests/**/*.spec.js', 'tests/**/*.setup.js'],
      rules: {
        'no-console': 'off',
        'playwright/no-wait-for-timeout': 'off',
      },
    },
    {
      // Allow console in hooks and utilities
      files: ['hooks/**/*.js', 'common/utils/logger.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'reports/',
    'test-results/',
    'playwright-report/',
    'auth-state/',
  ],
};
