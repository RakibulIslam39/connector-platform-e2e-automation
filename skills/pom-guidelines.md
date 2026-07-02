# Page Object Model (POM) Guidelines

---

## Architecture Rules

1. **Every page/view gets its own class** that extends `BasePage`
2. **Selectors are class properties** defined in constructor (never inline in methods)
3. **Methods represent user actions**, not technical operations
4. **No `expect()` assertions inside page objects** — assertions belong in test specs
5. **Page objects return data**, not assert it
6. **One file per page/major view**
7. **Group by system**: `pages/connector/`, `pages/hoodsly-hub/`, etc.

## Class Structure Template
```javascript
'use strict';

const { BasePage } = require('../base.page');
const { SECTION_PATHS } = require('../../constants/urls');
const logger = require('../../common/utils/logger');

class MyPage extends BasePage {
  constructor(page) {
    super(page);
    // Declare all locators here — never hardcode in methods
    this.primaryButton = page.locator('[data-action="primary"]');
    this.nameInput = page.locator('[name="entity_name"]');
    this.statusBadge = page.locator('.status-badge');
  }

  async goto() {
    await this.navigate(SECTION_PATHS.MY_PAGE);
  }

  // Methods = user actions, named as verbs
  async createEntity(data) {
    logger.info(`[MyPage] Creating entity: ${data.name}`);
    await this.nameInput.fill(data.name);
    await this.primaryButton.click();
    await this.waitForPageLoad();
  }

  // Getters return data for assertions in tests
  async getEntityStatus() {
    return await this.statusBadge.textContent();
  }
}

module.exports = { MyPage };
```

## Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| File | `kebab-case.page.js` | `partner-creation.page.js` |
| Class | `PascalCase + Page` | `PartnerCreationPage` |
| Methods | `camelCase` verbs | `createPartner()`, `getStatus()` |
| Locators | `camelCase` nouns | `saveBtn`, `nameInput` |
| Exports | Named export | `module.exports = { PartnerCreationPage }` |

## Import Pattern in Tests
```javascript
// ALWAYS import from fixtures/index.js, not from page files directly
const { test, expect } = require('../../fixtures');

test('test', async ({ partnerCreationPage }) => {
  // partnerCreationPage is auto-injected via fixture
});
```

## When to Use BasePage vs Inline Locators
- **BasePage methods**: generic actions (fill, click, navigate, waitForVisible)
- **Page class methods**: domain-specific flows (createPartner, importProducts)
- **Inline locators**: never — always define in constructor

## Data Passing
- Pass data objects to page methods, not individual fields
- Use `loadTestData()` or `generateXxxData()` to create data
- Keep test data out of page objects

## Error Handling in Page Objects
- Let errors bubble up to tests naturally
- Log meaningful context before actions: `logger.info('[PageName] Doing thing')`
- Catch only when you have a meaningful recovery or want to return null safely
