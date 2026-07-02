# Connector Platform 2.0 — E2E Scenario Index

**Last Updated**: 2026-06-03 (after comprehensive live MCP exploration)  
**Platform**: `https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/`  
**Live Data Verified**: 17 Partners | 44 Products | 58 Attribute Types | 300 Attribute Values | 8 Catalogs | 353+ Sync Logs

---

## Scenario Files

| File | Module | Scenarios | Status |
|---|---|---|---|
| [01-connector-dashboard.md](01-connector-dashboard.md) | Dashboard | 01-01 to 01-07 | ✅ Complete |
| [02-partner-management.md](02-partner-management.md) | Partners | 02-01 to 02-16 | ✅ Complete |
| [03-product-management.md](03-product-management.md) | Products | 03-01 to 03-13 | ✅ Complete |
| [04-attribute-mapping.md](04-attribute-mapping.md) | Attributes | 04-01 to 04-14 | ✅ Complete |
| [05-sku-generation.md](05-sku-generation.md) | SKU Logic | 05-01 to 05-08 | ✅ Complete |
| [06-color-catalog.md](06-color-catalog.md) | Color Catalog | 06-01 to 06-05 | ✅ Written |
| [07-platform-settings.md](07-platform-settings.md) | Settings | 07-01 to 07-10 | ✅ Complete |
| [08-api-endpoints.md](08-api-endpoints.md) | REST API | 08-01 to 08-08 | ✅ Written |
| [09-order-flow-e2e.md](09-order-flow-e2e.md) | Order Flow | 09-01 to 09-10 | ✅ Written |
| [10-hub-order-management.md](10-hub-order-management.md) | HoodslyHub Orders | 10-01 to 10-12 | ✅ Written |
| [11-hub-manual-placement.md](11-hub-manual-placement.md) | Hub Manual Orders | 11-01 to 11-06 | ✅ Written |
| [12-hub-damage-claims.md](12-hub-damage-claims.md) | Damage Claims | 12-01 to 12-06 | ✅ Written |
| [13-wrh-hub.md](13-wrh-hub.md) | WRHHub | 13-01 to 13-07 | ✅ Written |
| [14-wiks-hub.md](14-wiks-hub.md) | WiksHub | 14-01 to 14-05 | ✅ Written |
| [15-partner-site-plugin.md](15-partner-site-plugin.md) | Partner Site | 15-01 to 15-08 | ✅ Written |
| [16-logs-and-debugging.md](16-logs-and-debugging.md) | Logs & Debug | 16-01 to 16-11 | ✅ Complete |
| [17-product-partner-pricing.md](17-product-partner-pricing.md) | Partner Pricing | 17-01 to 17-08 | ✅ Complete |

---

## Live Exploration Notes

See [00-live-exploration-notes.md](00-live-exploration-notes.md) for raw observations from the live MCP browser exploration session.

---

## Module Summary

### Connector Hub Plugin (WordPress Admin)

#### 01 — Dashboard
- 4 stat cards (Partners, Products, Attribute Types, Attributes)
- Partners by Platform breakdown (WP, M2, Shopify)
- Quick Actions (Add Partner, Add Product)
- Quick Navigation links

#### 02 — Partner Management
- Partner list with search + 2 filters (Platform, Status/Env)
- Add Partner form: 9 fields, dual Cancel/Submit buttons, API key generation
- Edit Partner: 4 tabs (Basic Info, Products, Attributes, FAQs & Shipping)
- Products tab: add/remove products with custom title
- Attributes tab: 4 expandable accordion sections per partner (Colors 7 selected, Ventilations, Trims, Sizes)
- FAQs & Shipping tab: 2 sub-tabs (FAQs, Shipping & Returns) with rich text editor entries

#### 03 — Product Management
- Product list: search + 2 filters (Partner, Status), paginated (20/page)
- Add/Edit Product: 3 tabs (Basic Info, Attributes, Partners)
- Basic Info: Title, SKU, Status, Description (rich text), Dimensions (rich text), Category, Images
- Attributes tab: 58 attribute types, each expandable with checkbox selection
- Partners tab: Per-partner custom title, custom SKU, attribute price overrides

#### 04 — Attribute Mapping
- **Attribute Types**: 58 types, Add/Edit/Delete, filter by Product/Partner type
- **Attribute Values**: 300 values, filter by type + "Missing SKU" filter (133 missing)
- **Catalogs**: 8 color catalogs (USCD, TA Cabinetry, Hoodsly, Jarlin, Everly, Jim Bishop, Homemark, JSI)

#### 07 — Settings
- **General**: Auto-sync checkbox (✅ enabled) + Webhook Timeout (30s)
- **Products**: 3 sub-tabs — FAQs (empty), Shipping & Returns (3 policies), Categories (3 categories)
- **Partner Release**: Magento module version/date/URL/changelog fields
- **Others**: Shopify App URL

#### 16 — Logs
- **Sync Logs**: Stats (today/success/failed/rate), Action+Status filters, Refresh, View Details modal, Delete
- **Partner Order Log**: Select Partner + Order ID → fetch live payload for SKU validation

#### 17 — Product Partner Pricing
- Custom Title override per product per partner
- Custom SKU override per product per partner
- Attribute price overrides: full table of all product attributes with base and partner-specific prices

---

## Key Selectors Reference

### Navigation
```js
// Login
'input[name="log"]'  // Username
'input[name="pwd"]'  // Password
'input[id="wp-submit"]'  // Submit

// Connector Hub nav
'#wpbody-content a[href*="#/dashboard"]'
'#wpbody-content a[href*="#/partners"]'
'#wpbody-content a[href*="#/products"]'
'#wpbody-content a[href*="#/attributes"]'
'#wpbody-content a[href*="#/settings"]'
'#wpbody-content a[href*="#/logs"]'
```

### Partners
```js
'input[placeholder="Search partners..."]'  // Search
'select:first-of-type'  // Platform filter
'select:nth-of-type(2)'  // Status filter
'button:has-text("Add Partner")'  // Add button
'input[placeholder="Enter partner name"]'  // Name field
'input[placeholder="https://example.com"]'  // Website URL
'input[placeholder="e.g., HS-"]'  // SKU prefix
'input[placeholder="API key will be auto-generated"]'  // API Key
'button:has-text("Generate")'  // Generate API key
'button[type="submit"]'  // Create/Update Partner (bottom)
'a[href="#/partners"]'  // Cancel links
```

### Products
```js
'input[placeholder="Search products..."]'  // Search
'input[placeholder="Enter product title"]'  // Title
'input[placeholder="e.g., VEN-001"]'  // SKU
'button:has-text("Add Product")'  // Add button
```

### Attributes
```js
'button:has-text("Attribute Types")'  // Types tab
'button:has-text("Attribute Values")'  // Values tab
'button:has-text("Catalogs")'  // Catalogs tab
'button:has-text("Add Type")'  // Add type
'button:has-text("Add Catalog")'  // Add catalog
'input[placeholder="e.g., Color, Size"]'  // Type name
'input[placeholder="e.g., WHT, BLK"]'  // Attribute value SKU
'select:nth-of-type(2)'  // Missing SKU filter (values tab)
```

### Settings
```js
'button:has-text("General")'  // General tab
'button:has-text("Products")'  // Products tab
'button:has-text("Partner Release")'  // Partner Release tab
'button:has-text("Others")'  // Others tab
'input[type="checkbox"].w-4.h-4'  // Auto-sync toggle
'input[placeholder="30"]'  // Webhook timeout
'button:has-text("Save Settings")'  // Save
```

### Logs
```js
'button:has-text("Sync Logs")'  // Sync Logs tab
'button:has-text("Partner Order Log")'  // Partner Order Log tab
'button:has-text("Refresh")'  // Refresh sync logs
'button[title="View Details"]'  // View log details
'button[title="Delete"]'  // Delete log
'input[placeholder="e.g. CON5047-493"]'  // Order ID input
'button:has-text("Fetch Order Data")'  // Fetch order
```

---

## Test Data Reference

### Real Partner IDs
| Partner | ID | Platform | Status |
|---|---|---|---|
| TestRakibulQA | 7191 | WordPress | Active/Staging |
| RakibulQAPartner | (check URL) | WordPress | Active/Staging |
| ManualQAPartner | (check URL) | WordPress | Active/Staging |
| Automation_Partner | (check URL) | WordPress | Active/Staging |

### Real Product IDs
| Product | ID | SKU | Category |
|---|---|---|---|
| Double Curved | 5082 | VEN-DBC | Wood Hoods |
| Curved Shaker White QS | 5072 | VEN-QSPCCXWHT | Quick Shipping |
| Curved With Strapping QS | 5070 | VEN-QSPCCR | Quick Shipping |
| Floating Shelves | 2471 | VEN-FLS | Floating Shelves |

### Login Credentials (from .env.local)
```
URL: https://hoodslypartnersconnector3.kinsta.cloud/wp-admin/
Username: (from process.env.ADMIN_USERNAME)
Password: (from process.env.ADMIN_PASSWORD)
```
