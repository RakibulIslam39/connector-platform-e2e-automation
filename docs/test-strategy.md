# Test Strategy

## Test Pyramid

```
         ╱─────────────╲
        ╱  E2E Full      ╲   ← Few, slow, high value
       ╱   Order Flows    ╲
      ╱─────────────────────╲
     ╱  Component/Feature    ╲  ← Moderate, targeted
    ╱    UI + API Tests        ╲
   ╱───────────────────────────╲
  ╱      Smoke + Unit Logic      ╲  ← Many, fast, cheap
 ╱  API health, SKU logic, utils   ╲
╱─────────────────────────────────╲
```

## Test Tags

| Tag | Purpose | Run frequency |
|-----|---------|---------------|
| `@smoke` | Critical paths, API health | Every push/PR |
| `@regression` | Full feature coverage | Main push, nightly |
| `@sanity` | Post-deployment verification | After deployments |
| `@api` | API-only tests | Every push |
| `@connector` | Connector Platform tests | Per-module changes |
| `@hub` | HoodslyHub tests | Per-module changes |
| `@order` | Order flow tests | Full regression |
| `@critical` | Business-critical rules | Smoke + Regression |
| `@slow` | Long-running tests | Nightly only |

## Test Data Strategy
- **Static JSON**: Stable test data in `test-data/` (partners, products, users)
- **Dynamic generation**: `@faker-js/faker` for unique names, emails, phones
- **API-driven**: Fetch live data from Connector Platform API for validation
- **Environment-specific**: JSON data has `environments` key for overrides

## Isolation Strategy
- Each test should be independent
- Use unique, timestamped names for created entities: `AutoPartner-${Date.now()}`
- Clean up created test data in `afterEach` or use test-specific names
- Auth state is shared (reduces test time) — avoid modifying auth during tests

## Stability Guidelines
1. Use web-first assertions — never arbitrary timeouts
2. Wait for network responses when needed
3. Use `retryAction()` for known-flaky UI interactions
4. Global retries: 2 in CI, 0 locally
5. Keep tests deterministic — avoid time-dependent assertions

## Coverage Plan

### Phase 1 (Smoke) — Implemented
- [x] Dashboard loads
- [x] Partners list loads
- [x] Products list loads
- [x] API health check
- [x] Basic navigation

### Phase 2 (Regression) — Skeleton Ready
- [ ] Full partner onboarding
- [ ] Product import
- [ ] Order end-to-end
- [ ] Status synchronization
- [ ] BOL generation
- [ ] Damage claims

### Phase 3 (Extended)
- [ ] Cross-browser (Firefox, Safari)
- [ ] Shopify partner flow
- [ ] Magento partner flow
- [ ] Performance baseline
