# GitHub Actions CI/CD Skill Reference

---

## Workflow Files

- `e2e-ci.yml` — Triggered on push/PR: install → lint → smoke → regression
- `e2e-scheduled.yml` — Nightly full regression at 01:00 UTC

## Required GitHub Secrets

```
BASE_URL                   # Partner site URL
CONNECTOR_API_BASE_URL     # Connector Platform API URL
CONNECTOR_API_SIGNATURE    # API signature header
HUB_BASE_URL               # HoodslyHub URL
WRH_HUB_BASE_URL           # WRHHub URL
WIKS_HUB_BASE_URL          # WiksHub URL
WP_ADMIN_USER              # WordPress admin username
WP_ADMIN_PASS              # WordPress admin password
WP_PARTNER_USER            # Partner user (optional)
WP_PARTNER_PASS            # Partner password (optional)
HUB_ADMIN_USER             # Hub admin user
HUB_ADMIN_PASS             # Hub admin password
```

## Adding Secrets

Settings → Secrets and variables → Actions → New repository secret

## Triggering Workflows Manually

Actions tab → Select workflow → Run workflow → choose inputs

## Artifacts (Test Reports)

Reports are uploaded as artifacts per run:

- `smoke-test-report` — Smoke test HTML + JSON
- `regression-test-report` — Regression test HTML + JSON
- `test-traces` — Playwright traces on failure (7 day retention)

## Cache Strategy

```yaml
- uses: actions/cache@v4
  with:
    path: node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

## Running Specific Tests in CI

```bash
# In workflow step
npx playwright test --grep "@smoke" --project=chromium

# Via workflow_dispatch input
npx playwright test --grep "${{ github.event.inputs.grep }}"
```

## Environment Variables in CI

- Set at job level under `env:` block
- Use `${{ secrets.SECRET_NAME }}` syntax
- CI jobs automatically set `CI=true` — used in playwright.config.js
