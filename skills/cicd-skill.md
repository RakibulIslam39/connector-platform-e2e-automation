# CI/CD Skill Reference

---

## Pipeline Flow
```
Push to main/develop OR PR to main
         ↓
    install (npm ci + pw install)
         ↓
      lint (eslint + prettier)
         ↓                  ↓
   api-tests           smoke tests
         ↓                  ↓
                      regression
                           ↓
                    publish report
```

## Test Execution Commands
```bash
# Local development
npm run test:smoke           # Quick smoke check
npm run test:api             # API tests only
npm run test:regression      # Full regression
npm run test:headed          # Visual debugging
npm run test:debug           # Step-by-step debugger

# CI (used in GitHub Actions)
npm run test:ci              # Smoke, headless, CI env
npm run test:ci:regression   # Full regression, CI env
```

## Branch Strategy for CI
| Branch | CI Trigger | Tests Run |
|--------|-----------|-----------|
| feature/* | On PR to develop | Smoke only |
| develop | Push | Smoke + Regression |
| main | Push | Full suite + Report |

## Nightly Schedule
- Cron: `0 1 * * *` (01:00 UTC = 07:00 Bangladesh Time)
- Runs: Full regression suite on staging
- Artifacts: Retained 30 days

## Adding a New Secret
1. GitHub repo → Settings → Secrets and variables → Actions
2. New repository secret
3. Reference in workflow: `${{ secrets.SECRET_NAME }}`
4. Add to environments/.env.ci template

## Report Artifacts
- HTML report: `reports/html/index.html` → uploaded as artifact
- JSON report: `reports/json/results.json` → used for summaries
- Traces: `test-results/` → uploaded on failure only
- Retention: 7 days (smoke/regression), 30 days (nightly)

## Fail Fast Strategy
- Smoke job runs first — blocks regression if smoke fails
- `forbidOnly: true` in CI config — blocks if test.only is left in code
- `retries: 2` in CI — handles transient environment issues
