# WordPress Automation Skill Reference

---

## Login Flow
```javascript
await page.goto('/wp-login.php');
await page.locator('#user_login').fill(username);
await page.locator('#user_pass').fill(password);
await page.locator('#wp-submit').click();
await page.waitForURL(/wp-admin/, { timeout: 30000 });
await page.locator('#wpadminbar').waitFor({ state: 'visible' });
```

## Admin Navigation
```javascript
// Via URL (most reliable)
await page.goto('/wp-admin/admin.php?page=connector-platform');

// Via admin menu
await page.locator('#adminmenu a[href*="connector"]').click();
```

## WordPress Notices
```javascript
// Success
await page.locator('.notice-success').waitFor({ state: 'visible' });
const text = await page.locator('.notice-success').textContent();

// Error
await page.locator('.notice-error').waitFor({ state: 'visible' });
```

## WP List Tables (admin list views)
```javascript
// Find row by content
const row = page.locator('.wp-list-table tbody tr').filter({ hasText: 'Partner Name' });

// Get row count
const count = await page.locator('.wp-list-table tbody tr').count();

// Click edit in row
await row.locator('a.edit, .row-actions a:has-text("Edit")').click();

// Bulk action
await page.locator('#cb-select-all-1').check();
await page.locator('#bulk-action-selector-top').selectOption('delete');
await page.locator('#doaction').click();
```

## WordPress AJAX / Spinner
```javascript
// Wait for spinner to disappear
await page.locator('.spinner.is-active').waitFor({ state: 'hidden', timeout: 30000 });
```

## Plugin Management
```javascript
// Activate plugin by slug
const activateLink = page.locator(`tr[data-slug="hoodsly-partners-connector"] .activate a`);
if (await activateLink.isVisible()) {
  await activateLink.click();
}
```

## Media Uploader
```javascript
// File upload input (WordPress media)
await page.locator('input[type="file"]').setInputFiles('/path/to/image.jpg');
```

## WP REST API
- Base: `/wp-json/wp/v2/`
- WooCommerce: `/wp-json/wc/v3/`
- Connector Platform: `/wp-json/connector-platform/v1/`
- Auth: Basic auth or API key header depending on plugin

## WordPress Nonces
- WP admin forms use nonces for CSRF protection
- Playwright handles these automatically as long as session cookies are present
- If nonce errors occur, check that auth state is valid

## Common Selectors
```javascript
'#user_login'              // Login username
'#user_pass'               // Login password
'#wp-submit'               // Login button
'#wpadminbar'              // Admin bar (confirms logged in)
'.notice-success'          // Success notice
'.notice-error'            // Error notice
'#adminmenu'               // Admin sidebar menu
'.wp-list-table'           // Admin list tables
'#post-search-input'       // List table search
'#submit, [name="save"]'   // Settings save button
```
