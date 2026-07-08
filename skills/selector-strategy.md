# Selector Strategy Guidelines

---

## Priority Order (Most to Least Preferred)

### 1. ARIA Roles (Best)

```javascript
page.getByRole('button', { name: 'Save Partner' });
page.getByRole('textbox', { name: 'Partner Name' });
page.getByRole('combobox', { name: 'Partner Type' });
page.getByRole('link', { name: 'Edit' });
page.getByRole('checkbox', { name: 'Accept Terms' });
```

### 2. Labels

```javascript
page.getByLabel('Email Address');
page.getByLabel('SKU Prefix');
```

### 3. data-testid (Requires dev cooperation)

```javascript
page.getByTestId('save-partner-btn');
page.locator('[data-testid="partner-name"]');
```

### 4. data-action (Plugin-specific)

```javascript
page.locator('[data-action="import-products"]');
page.locator('[data-action="generate-bol"]');
page.locator('[data-action="instant-release"]');
```

### 5. Name Attributes (Form fields)

```javascript
page.locator('[name="partner_name"]');
page.locator('[name="sku_prefix"]');
page.locator('[name="partner_type"]');
```

### 6. Stable IDs (WordPress admin)

```javascript
page.locator('#user_login');
page.locator('#wp-submit');
page.locator('#wpadminbar');
page.locator('#order_status');
```

### 7. Text Content (Use sparingly — brittle with i18n)

```javascript
page.getByText('Save Changes');
page.locator('button:has-text("Import Products")');
```

### 8. CSS Classes (Last resort — fragile)

```javascript
// Only for stable, semantic WordPress classes
page.locator('.notice-success');
page.locator('.wp-list-table');
page.locator('.spinner.is-active');
// AVOID dynamic framework classes like .css-abc123
```

---

## Scoping Selectors

### Within a parent element

```javascript
const row = page
  .locator('.wp-list-table tbody tr')
  .filter({ hasText: 'Partner Name' });
const editLink = row.locator('a.edit'); // Scoped to the row
```

### Filter by text or child

```javascript
page.locator('.wp-list-table tbody tr').filter({ hasText: 'TestPartner' });
page.locator('.card').filter({ has: page.locator('.badge.active') });
```

---

## Anti-Patterns to Avoid

```javascript
// BAD: XPath (fragile, verbose)
page.locator('//div[@class="wrap"]/form/table/tr[2]/td[1]/input');

// BAD: nth-child without context
page.locator('td:nth-child(3)');

// BAD: Dynamic class names
page.locator('.css-1x2y3z');

// BAD: Text with spaces/special chars without escaping
page.getByText('Save & Continue'); // Use { exact: false } if needed

// GOOD: Combine role + name
page.getByRole('button', { name: 'Save & Continue' });
```

---

## WordPress-Specific Patterns

```javascript
// Admin notices
'.notice-success'  // Success
'.notice-error'    // Error
'.notice-warning'  // Warning

// List table row actions (appear on hover)
'.wp-list-table tbody tr').filter({ hasText: 'entity name' }).locator('.row-actions a:has-text("Edit")')

// WooCommerce order status
'select#order_status'  // Admin order status dropdown

// Select2 dropdowns (WooCommerce admin)
'.select2-selection--single'  // Trigger
'.select2-search__field'      // Search input
'.select2-results__option'    // Options
```
