# Module 12 — Hub Damage Claims

> **URL:** `{HUB_BASE_URL}/wp-admin/admin.php?page=damage-claims` **Page
> Object:** `pages/hoodsly-hub/damage-claim.page.js` (89 lines) **Spec File:**
> `tests/hoodsly-hub/damage-claim.spec.js` **Status:** Skeleton exists —
> placeholder tests only

---

## Feature Overview

Damage Claims allow partners (or admins) to report damage to a delivered
product. The workflow is:

### Full Damage Claim Flow

1. **Admin/CSM creates a Partner Hub role** (restricted Hub account for the
   partner)
2. **Partner logs into Hub** with their restricted credentials
3. Partner sees only their own completed orders
4. Partner finds the damaged order → clicks **"File Damage Claim"**
5. Partner uploads damage images + writes description
6. Partner submits → **Admin receives email notification**
7. Admin/CSM reviews the claim:
   - Sets claim type (Overall Damage, Partial Damage, etc.)
   - Contacts partner to confirm pickup details
   - Sets **pickup week** and **exact pickup date** via email communication
8. Admin marks claim as **Completed**

**Key actors:**

- **Partner**: submits claim, uploads photos
- **Admin/CSM**: reviews, processes, closes claim

---

## Scenarios

### SCENARIO-12-01: Damage Claims page loads (admin view)

**Priority:** High (smoke) **Steps:**

1. Log in to Hub as admin
2. Navigate to `{HUB_BASE_URL}/wp-admin/admin.php?page=damage-claims`
3. Verify damage claims list renders
4. Verify table/list shows columns: claim ID, order ID, partner, status, date

**Expected Result:** Damage Claims page accessible to admin

---

### SCENARIO-12-02: View existing damage claims list

**Priority:** Medium **Steps:**

1. Load damage claims page
2. If claims exist: verify each row has order ID, partner, claim type, status
3. Click on a claim to view its detail
4. Verify: uploaded images are visible (or placeholder)
5. Verify: partner's description is shown

**Expected Result:** Claim detail is viewable from list

---

### SCENARIO-12-03: Partner submits a damage claim (partner role)

**Priority:** High (core workflow) **Pre-condition:** Partner Hub user exists; a
completed order exists for this partner **Steps:**

1. Log in to Hub as the partner hub user
2. Verify: only completed orders are visible
3. Find the completed order
4. Click "File Damage Claim"
5. Upload a damage image (use test fixture image)
6. Write description: "Product arrived with cracked veneer on the left side"
7. Submit the claim
8. Verify confirmation message shown

**Expected Result:** Damage claim submitted successfully; admin notification
triggered

---

### SCENARIO-12-04: Admin sets claim type and pickup week

**Priority:** High **Pre-condition:** A submitted damage claim exists **Steps:**

1. Log in as admin
2. Go to Damage Claims
3. Find the submitted claim
4. Set claim type: "Overall Damage"
5. Set pickup week (select from calendar/dropdown)
6. Save changes
7. Verify claim status updates

**Expected Result:** Claim type and pickup week are saved

---

### SCENARIO-12-05: Admin marks claim as Completed

**Priority:** High **Steps:**

1. Open a processed damage claim
2. Click "Mark as Completed"
3. Confirm action
4. Verify claim status = "Completed"
5. Verify claim no longer appears in "Open Claims" filter

**Expected Result:** Claim lifecycle ends at "Completed" status

---

### SCENARIO-12-06: Partner cannot access other partners' orders (access control)

**Priority:** High (security) **Pre-condition:** Two partner hub users exist
(Partner A and Partner B) **Steps:**

1. Log in as Partner A's hub user
2. Navigate to orders
3. Search for Partner B's order ID
4. Verify: Partner B's order is NOT visible
5. Verify: Only Partner A's orders are accessible

**Expected Result:** Partner hub role properly isolates order access

---

## MCP Codegen Notes

```bash
# Capture damage claims admin view:
npx playwright codegen https://hub.hoodsly.com/wp-admin/admin.php?page=damage-claims

# Capture partner hub user view (need to log in as partner role first):
# 1. Create a partner hub user in Hub
# 2. Log in as that user
# 3. Capture the restricted orders view
# 4. Navigate to damage claim submission form

# Key elements:
# - Claims list table structure
# - "File Damage Claim" button location in order view
# - File upload input (may be drag-and-drop)
# - Description textarea
# - Claim type dropdown (Overall Damage, Partial, etc.)
# - Pickup week selector
# - Status change controls
```

## Known Complexities

- File upload in browser automation requires `page.setInputFiles()` with a test
  image fixture
- Admin email notification cannot be verified in automated tests (no email
  interceptor) — assert UI confirmation instead
- Partner Hub role must be created via Hub admin before testing partner access
- Exact claim types ("Overall Damage", etc.) — verify with codegen to get exact
  label text
