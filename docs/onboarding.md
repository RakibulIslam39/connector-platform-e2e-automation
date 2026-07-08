# Developer Onboarding Guide

## Prerequisites

- Node.js 18+ installed
- Git configured
- Access to partner site credentials

## First-Time Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd connector-platform2.0-e2e-automation
npm install
npx playwright install
```

### 2. Configure environment

```bash
# Copy the template
cp .env.example environments/.env.local

# Edit with your actual values
# Fill in: BASE_URL, WP_ADMIN_USER, WP_ADMIN_PASS, etc.
```

### 3. Run smoke tests to verify setup

```bash
npm run test:smoke
```

### 4. View the report

```bash
npm run report
```

## Running Tests

```bash
# Quick smoke check
npm run test:smoke

# Full regression
npm run test:regression

# Only API tests
npm run test:api

# Specific test suite
npm run test:connector
npm run test:hub

# Debug a specific test
npm run test:debug -- tests/connector/partner-creation.spec.js

# Headed mode (see the browser)
npm run test:headed
```

## Project Structure (Quick Reference)

- `tests/` — Write new test specs here
- `pages/` — Update page objects when UI changes
- `fixtures/index.js` — Import `{ test, expect }` from here in all tests
- `common/` — Shared utilities (don't duplicate logic here)
- `memory.md` — Full project context (read this first!)
- `skills/` — Technical reference docs

## Writing a New Test

```javascript
// tests/connector/my-feature.spec.js
'use strict';

const { test, expect } = require('../../fixtures');

test.describe('@connector @product My Feature', () => {
  test('@smoke feature page loads', async ({ connectorDashboardPage }) => {
    await connectorDashboardPage.goto();
    expect(await connectorDashboardPage.isDashboardLoaded()).toBe(true);
  });

  test('@regression does the thing', async ({
    partnerCreationPage,
    connectorApi,
  }) => {
    // Use page objects for UI, connectorApi for API calls
  });
});
```

## Key Contacts & Resources

- Hypemill Onboarding Doc:
  https://docs.google.com/document/d/1GHPqssYvG91sxaeDxfHRwjfmxiwRB-Tfp-OAMxoVYNA
- Connector Platform API: hoodslypartnersconnector3.kinsta.cloud
- QA Partner Site: rakbulqapart.s6-tastewp.com
