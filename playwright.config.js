// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

// Load environment-specific .env file
const ENV = process.env.ENV || 'local';
require('dotenv').config({ path: path.resolve(__dirname, `environments/.env.${ENV}`) });

// Validate critical environment variables
const { validateEnv } = require('./environments/env.schema');
validateEnv();

const isCI = !!process.env.CI;

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  /* Run tests in parallel */
  fullyParallel: false,

  /* Fail the build on CI if test.only is left in source */
  forbidOnly: isCI,

  /* Retry on CI only */
  retries: isCI ? 2 : 0,

  /* Parallel workers */
  workers: isCI ? 2 : 1,

  /* Global timeout */
  timeout: 60_000,

  /* Expect timeout */
  expect: {
    timeout: 10_000,
  },

  /* Global setup / teardown */
  globalSetup: require.resolve('./hooks/before-all'),
  globalTeardown: require.resolve('./hooks/after-all'),

  /* Reporter configuration */
  reporter: isCI
    ? [
        ['github'],
        ['json', { outputFile: './reports/json/results.json' }],
        ['html', { outputFolder: './reports/html', open: 'never' }],
      ]
    : [
        ['list'],
        ['html', { outputFolder: './reports/html', open: 'on-failure' }],
        ['json', { outputFile: './reports/json/results.json' }],
      ],

  /* Shared settings for all the projects */
  use: {
    /* Base URL — set in environment file */
    baseURL: process.env.BASE_URL,

    /* Collect trace on first retry */
    trace: 'on-first-retry',

    /* Screenshots only on failure */
    screenshot: 'only-on-failure',

    /* Video retained on failure */
    video: 'retain-on-failure',

    /* Viewport */
    viewport: { width: 1280, height: 720 },

    /* Action timeout */
    actionTimeout: 15_000,

    /* Navigation timeout */
    navigationTimeout: 30_000,

    /* Ignore HTTPS errors for staging */
    ignoreHTTPSErrors: true,
  },

  /* Projects — named browser configurations */
  projects: [
    /* === Setup project: authenticate and store state === */
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      use: { ...devices['Desktop Chrome'] },
    },

    /* === UI Tests === */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './auth-state/admin.json',
      },
      dependencies: ['setup'],
      testIgnore: /tests\/api\/.*/,
    },
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: './auth-state/admin.json',
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: /tests\/api\/.*/,
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: './auth-state/admin.json',
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: /tests\/api\/.*/,
    // },

    /* === Mobile viewports === */
    // {
    //   name: 'mobile-chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: './auth-state/admin.json',
    //   },
    //   dependencies: ['setup'],
    //   testIgnore: /tests\/api\/.*/,
    // },

    /* === API-only project (no browser) === */
    {
      name: 'api',
      testMatch: /tests\/api\/.*/,
      use: {
        baseURL: process.env.CONNECTOR_API_BASE_URL,
        extraHTTPHeaders: {
          'api-signature': process.env.CONNECTOR_API_SIGNATURE,
          website: process.env.BASE_URL,
          'Content-Type': 'application/json',
        },
      },
    },
  ],
});
