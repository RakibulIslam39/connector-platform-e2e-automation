# Playwright Skill Reference
> Framework: Playwright v1.52+ | Language: JavaScript

---

## Core Concepts

### Test Structure
```javascript
const { test, expect } = require('../../fixtures'); // Always use project fixtures

test.describe('@connector Suite Name', () => {
  test.beforeEach(async ({ page }) => { /* setup */ });
  test.afterEach(async ({ page }) => { /* teardown */ });

  test('@smoke test name', async ({ partnerCreationPage, connectorApi }) => {
    // test body
  });
});
```

### Locator Best Practices (Priority Order)
1. `page.getByRole('button', { name: 'Save' })` — ARIA roles
2. `page.getByLabel('Email')` — form labels
3. `page.getByTestId('submit-btn')` — data-testid attributes
4. `page.getByText('Submit')` — visible text
5. `page.locator('[name="partner_name"]')` — CSS attribute selectors
6. `page.locator('#user_login')` — IDs (WordPress admin)
7. AVOID: `.locator('.some-class')` for dynamic classes

### Web-First Assertions (Always prefer these)
```javascript
await expect(locator).toBeVisible();          // Waits until visible
await expect(locator).toHaveText('value');    // Waits for text
await expect(locator).toHaveValue('input');   // Waits for input value
await expect(page).toHaveURL(/pattern/);      // Waits for URL
await expect(locator).toBeEnabled();          // Waits until enabled
await expect(locator).toBeChecked();          // Waits for checked state
```

### Auth State (Storage State)
```javascript
// Save auth state (in global setup)
await context.storageState({ path: 'auth-state/admin.json' });

// Load auth state (in playwright.config.js)
projects: [{ name: 'chromium', use: { storageState: 'auth-state/admin.json' } }]
```

### API Testing with Playwright
```javascript
test('@api test', async ({ request }) => {
  const response = await request.get('/wp-json/connector-platform/v1/products', {
    headers: { 'api-signature': process.env.CONNECTOR_API_SIGNATURE }
  });
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});
```

### Fixtures (Extended test object)
```javascript
// Define fixture
const test = base.extend({
  myPage: async ({ page }, use) => {
    await use(new MyPage(page));
  }
});

// Use in test
test('test', async ({ myPage }) => { ... });
```

### Global Setup / Teardown
```javascript
// playwright.config.js
module.exports = defineConfig({
  globalSetup: './hooks/before-all.js',
  globalTeardown: './hooks/after-all.js',
});
```

### Tags / Grep Filtering
```javascript
// Add tag in test title
test('@smoke @connector connector loads', async () => { ... });

// Run filtered:
// npx playwright test --grep @smoke
// npx playwright test --grep "@smoke|@sanity"
// npx playwright test --grep-invert @slow
```

### Trace / Screenshot / Video Config
```javascript
use: {
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Parallel Execution
```javascript
// playwright.config.js
fullyParallel: true,
workers: process.env.CI ? 2 : 4,

// Disable parallelism for a describe block
test.describe.serial('Serial suite', () => { ... });
```

### Waiting Strategies
```javascript
// Preferred: explicit waits via web-first assertions
await expect(locator).toBeVisible();

// Network response
await page.waitForResponse(url => url.includes('/api/'));

// URL change
await page.waitForURL(/dashboard/);

// Load state
await page.waitForLoadState('networkidle');

// AVOID: arbitrary timeouts
// await page.waitForTimeout(3000); // Anti-pattern
```

### Page Object Model Pattern
```javascript
class MyPage extends BasePage {
  constructor(page) {
    super(page);
    this.someButton = page.locator('[data-action="save"]');
  }

  async clickSave() {
    await this.someButton.click();
  }
}
```
