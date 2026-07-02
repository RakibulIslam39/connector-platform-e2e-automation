# WooCommerce Automation Skill Reference

---

## Storefront Actions
```javascript
// Add product to cart
await page.goto('/product/product-slug');
await page.locator('.single_add_to_cart_button').click();

// Add variation to cart
await page.locator('select[name="attribute_pa_size"]').selectOption('30-inch');
await page.locator('.single_add_to_cart_button').click();

// Go to checkout
await page.goto('/checkout');
```

## Checkout Form Fields
```javascript
'#billing_first_name'   // First name
'#billing_last_name'    // Last name
'#billing_email'        // Email
'#billing_phone'        // Phone — MUST be valid US number for BOL
'#billing_address_1'    // Street address
'#billing_city'         // City
'#billing_state'        // State select
'#billing_postcode'     // ZIP code
'#billing_country'      // Country select
'#place_order'          // Submit/Place Order button
```

## Order Confirmation
```javascript
await page.waitForURL(/order-received/, { timeout: 60000 });
const orderId = await page.locator('.woocommerce-order-overview__order strong').textContent();
```

## Order Statuses (WooCommerce → Hub mapping)
| WooCommerce Status | Hub Status |
|-------------------|------------|
| `processing` | `production` |
| `wc-production` | `production` |
| `wc-finishing` | `finishing` |
| `completed` | `shipped` |
| `cancelled` | `cancelled` |
| `on-hold` | `hold` |

## WooCommerce REST API (Admin)
```javascript
// Products
GET  /wp-json/wc/v3/products
GET  /wp-json/wc/v3/products/{id}

// Orders
GET  /wp-json/wc/v3/orders
GET  /wp-json/wc/v3/orders/{id}
PUT  /wp-json/wc/v3/orders/{id}   { "status": "completed" }

// Auth: Basic auth with consumer_key:consumer_secret
```

## WooCommerce Admin
```javascript
// Orders list
await page.goto('/wp-admin/edit.php?post_type=shop_order');

// Single order edit
await page.goto('/wp-admin/post.php?post=ORDER_ID&action=edit');

// Update order status (admin)
await page.locator('#order_status').selectOption('wc-completed');
await page.locator('[name="save"]').click();
```

## Important Notes
- Phone number for WooCommerce checkout must be valid US format for BOL generation
- WooCommerce stores orders as WordPress posts (post_type=shop_order)
- Custom order statuses (wc-production, wc-finishing) require WooCommerce plugin hooks
- Order meta keys: `updated_est_ship_date`, `est_reason_note` updated by CSM via Post Meta Creator plugin
