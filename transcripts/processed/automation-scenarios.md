# Automation-Ready Scenarios — From Video Transcripts
> Extracted from 9 Hypemill onboarding recordings
> Ready for implementation as Playwright test specs

---

## Category: Connector Platform — Partner Management

### SCENARIO-CP-001: Create B2B Partner
**Tags:** @regression @connector @partner
**Precondition:** Logged in as WP Admin on Connector Platform
**Steps:**
1. Navigate to Connector Platform → Partners → Create New
2. Fill partner name (unique timestamp-based name)
3. Select type: B2B
4. Enter SKU prefix (3 uppercase letters)
5. Select platform type: WordPress
6. Enter website URL
7. Select color style: Select (dropdown)
8. Save partner
**Expected:** Success notice displayed, partner appears in partners list

### SCENARIO-CP-002: Create B2C Partner with Swatch Colors
**Tags:** @regression @connector @partner
**Steps:**
1. Create partner with type: B2C
2. Select color style: Swatch
3. Save partner
4. Edit partner → color catalog section
5. Verify swatch style applied
**Expected:** Partner created with swatch color display mode

### SCENARIO-CP-003: Partner Name Sync Validation
**Tags:** @regression @connector @partner @critical
**Business Rule:** Partner name in Connector Platform MUST exactly match Hub Source Name
**Steps:**
1. Create partner "TestPartner Alpha"
2. Open Hub Settings → Partner Source Name field
3. Enter "TestPartner_Alpha" (underscore instead of space)
4. Trigger a status sync
**Expected:** Sync FAILS — mismatch error or no status update
**Automation Note:** Test both the failure case and the correct match case

### SCENARIO-CP-004: Import Products with Terms Acceptance
**Tags:** @regression @connector @product
**Steps:**
1. Navigate to connector products page
2. Click "Import Products"
3. Accept Terms of Service checkbox
4. Accept MAP Policy checkbox
5. Confirm import
**Expected:** Products imported, count increases, success notice shown

### SCENARIO-CP-005: Attribute Mapping Configuration
**Tags:** @regression @connector @mapping @sku
**Steps:**
1. Navigate to Attribute Mapping page
2. Add mapping: attribute=size, value="30 inch", shortCode="30"
3. Add mapping: attribute=ventilation, value="ducted", shortCode="DUC"
4. Save mappings
5. Verify mappings appear in table
**Expected:** Mappings saved and visible

### SCENARIO-CP-006: Partner Color Override — Custom Name & Price
**Tags:** @regression @connector @color @partner
**Steps:**
1. Navigate to Color Catalog for specific partner
2. Select global color "Stainless Steel"
3. Override name: "Brushed Nickel"
4. Override price: +$50
5. Save
**Expected:** Color shows partner-specific name and price

---

## Category: SKU Generation

### SCENARIO-SKU-001: Generate Short SKU from Attribute Selection
**Tags:** @regression @sku @connector
**Steps:**
1. Select product attributes: size=30 inch, ventilation=ducted, color=SS, model=standard
2. Retrieve attribute mapping via API
3. Generate short SKU using helper function
4. Verify format: prefix + master SKU + short codes
**Expected:** SKU = "TPB-WM-TEST-001-30-DUC-SS-STD"

### SCENARIO-SKU-002: Reduce Height SKU Logic
**Tags:** @regression @sku
**Steps:**
1. Configure reduce height: enabled=true, amount=2 inches
2. Original height: 36 inches
3. Generate SKU
**Expected:** Height code in SKU reflects 34 inches

### SCENARIO-SKU-003: Multi-Item Order ID Generation
**Tags:** @regression @sku @order
**Steps:**
1. Place order with 2 product items
2. Forward to HoodslyHub
3. Check Hub for generated order IDs
**Expected:** IDs are baseId-1 and baseId-2

---

## Category: Order Flow

### SCENARIO-ORD-001: Standard Hood Order End-to-End
**Tags:** @regression @order @critical
**Steps:**
1. Navigate to partner site product: Test Wall Mount Range Hood
2. Select: size=30", ventilation=ducted, color=stainless steel
3. Add to cart
4. Fill checkout: valid US phone (+1XXXXXXXXXX), valid email
5. Place order
6. Note order ID
7. Wait for hold period (or Instant Release)
8. Verify order appears in HoodslyHub
9. Verify order routed to WRHHub
10. Update status in WRHHub: Production → Finishing → Shipped
11. Verify status synced back to partner site
**Expected:** Full lifecycle completes, partner site shows "Completed"

### SCENARIO-ORD-002: Order Hold and Cancellation
**Tags:** @regression @order
**Steps:**
1. Place order on partner site
2. Verify order is in "hold" state (24h hold)
3. Request cancellation during hold period
4. Verify order not forwarded to Hub
**Expected:** Order cancelled, not forwarded

### SCENARIO-ORD-003: Instant Release Override
**Tags:** @regression @order @hub
**Steps:**
1. Place order → enters hold state
2. Admin clicks "Instant Release" button
3. Verify order immediately forwarded to Hub
**Expected:** Order appears in Hub without waiting for hold period

### SCENARIO-ORD-004: Order with Customer Note → Manual Placement
**Tags:** @regression @order @hub
**Steps:**
1. Place order with customer note: "Please deliver after 5PM"
2. Order hold expires / instant release
3. Verify order appears in Manual Placement queue (NOT auto-forwarded)
**Expected:** Order in Manual Placement due to customer note

### SCENARIO-ORD-005: BOL Generation — Valid Data
**Tags:** @regression @order @shipping
**Steps:**
1. Locate forwarded order in HoodslyHub
2. Generate BOL (Bill of Lading)
3. Verify BOL generated with RL Courier
4. Verify PDF link and tracking number created
**Expected:** BOL successfully generated

### SCENARIO-ORD-006: BOL Generation — Invalid Phone Fails
**Tags:** @regression @order @shipping @critical
**Steps:**
1. Place order with invalid phone: "1234"
2. Forward to Hub
3. Attempt to generate BOL
**Expected:** BOL generation fails with phone number error

### SCENARIO-ORD-007: Floating Shelf Order via UPS
**Tags:** @regression @order @shipping
**Steps:**
1. Add floating shelf product to cart
2. Place order with valid details
3. Forward to Hub
4. Verify order routed to WiksHub
5. Verify courier is UPS (not RL)
6. Verify order appears in Floating Shelves tab
**Expected:** Order in WiksHub with UPS tracking, Floating Shelves tab visible

### SCENARIO-ORD-008: Quick Ship Order — One-In-One-Out
**Tags:** @regression @order
**Steps:**
1. Place Quick Ship (QSP) product order
2. Forward to Hub
3. Verify order appears in Warehouse page
4. Verify One-In-One-Out inventory decremented
**Expected:** QSP order processed via WRHHub Warehouse

---

## Category: Status Synchronization

### SCENARIO-SYNC-001: Status Sync — Production to Partner Site
**Tags:** @regression @order @hub
**Steps:**
1. Locate forwarded order in WRHHub
2. Update order status to "Production"
3. Check partner site order status
**Expected:** Partner site order status updates to "wc-production"

### SCENARIO-SYNC-002: Status Sync with Partner Source Name Mismatch
**Tags:** @regression @hub @critical
**Steps:**
1. Update partner Source Name in Hub Settings with underscore instead of space
2. Update order status in WRHHub
3. Check partner site
**Expected:** Status does NOT sync — name mismatch prevents update

### SCENARIO-SYNC-003: Estimated Ship Date Update
**Tags:** @regression @hub @order
**Steps:**
1. Open order in Hub
2. Update est_ship_date meta via Post Meta Creator
3. Add est_reason_note
4. Change order status once (triggers sync)
5. Check partner site order
**Expected:** Partner site shows updated estimated ship date and reason note

---

## Category: Hub Management

### SCENARIO-HUB-001: Manual Order Placement
**Tags:** @regression @hub @order
**Steps:**
1. Navigate to Manual Placement page in Hub
2. Enter order ID
3. Select target shop (WRH or Wiks)
4. Place order manually
5. Verify payload and response
**Expected:** Order placed to target shop, tracking created

### SCENARIO-HUB-002: Create Partner Hub Role
**Tags:** @regression @hub @partner
**Steps:**
1. Navigate to Hub Settings
2. Create new partner role (auto-creates during onboarding)
3. Assign user to partner role
4. Login as partner
5. Verify: cannot see main orders page
6. Verify: cannot see other partner's orders
7. Verify: can see own completed orders
**Expected:** Partner role properly restricts access

### SCENARIO-HUB-003: Damage Claim Submission
**Tags:** @regression @hub @damage-claim
**Steps:**
1. Login as partner (restricted Hub role)
2. Navigate to completed order
3. Click "File Damage Claim"
4. Select claim type: Overall Damage
5. Add description and upload images
6. Submit claim
7. Verify admin notification email (check Hub)
**Expected:** Claim submitted, admin notification triggered

### SCENARIO-HUB-004: Damage Claim Resolution
**Tags:** @regression @hub @damage-claim
**Steps:**
1. Open submitted damage claim as admin
2. Review claim details and images
3. Set claim type
4. Confirm pickup week
5. Confirm exact pickup date
6. Mark claim as Completed
**Expected:** Claim status updated to Completed

---

## Category: API Testing

### SCENARIO-API-001: Products API Health Check
**Tags:** @smoke @api
**Steps:**
1. Send GET to `/wp-json/connector-platform/v1/products`
2. Include `api-signature` header
**Expected:** HTTP 200, valid JSON array

### SCENARIO-API-002: Attributes Mapping API
**Tags:** @smoke @api @mapping
**Steps:**
1. Send GET to `/wp-json/connector-platform/v1/attributes-mapping`
2. Include `api-signature` header
**Expected:** HTTP 200, mapping data returned

### SCENARIO-API-003: API Without Auth Header
**Tags:** @regression @api
**Steps:**
1. Send GET to products endpoint WITHOUT api-signature header
**Expected:** HTTP 401 or 403 (authentication required)

### SCENARIO-API-004: Product Count Validation
**Tags:** @regression @api @product
**Steps:**
1. Fetch all products via API
2. Compare count with admin products list in UI
**Expected:** API count matches UI count
