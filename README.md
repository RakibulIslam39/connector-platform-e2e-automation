# Connector Platform 2.0 — E2E Automation Framework

Enterprise-grade Playwright + JavaScript E2E automation for the Hoodsly Connector Platform ecosystem.

## Systems Under Test
| System | URL |
|--------|-----|
| Partner Site (QA) | rakbulqapart.s6-tastewp.com |
| Connector Platform API | hoodslypartnersconnector3.kinsta.cloud |
| HoodslyHub | Set in `.env.local` |
| WRHHub | Set in `.env.local` |
| WiksHub | Set in `.env.local` |

## Quick Start

```bash
# Install
npm install && npx playwright install

# Configure
cp .env.example environments/.env.local
# Edit environments/.env.local with actual credentials

# Run smoke tests
npm run test:smoke

# View report
npm run report
```

## Test Commands

| Command | Description |
|---------|-------------|
| `npm run test:smoke` | Quick smoke check (@smoke tagged tests) |
| `npm run test:regression` | Full regression suite |
| `npm run test:api` | API tests only |
| `npm run test:connector` | Connector Platform tests |
| `npm run test:hub` | HoodslyHub tests |
| `npm run test:headed` | Visual mode (see browser) |
| `npm run test:debug` | Step-by-step debugger |
| `npm run report` | Open HTML report |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |

## Architecture

```
fixtures/index.js        ← Import { test, expect } here
pages/                   ← Page Object Model classes
tests/                   ← Test specs (11 spec files)
common/                  ← Reusable utilities and API services
helpers/                 ← Domain logic (SKU, order, partner)
constants/               ← URLs, selectors, endpoints, tags
test-data/               ← JSON test data
json-data/               ← API-derived configuration
environments/            ← Per-environment .env files
skills/                  ← Technical reference documentation
transcripts/             ← Processed knowledge from onboarding videos
memory.md                ← Full project context (read first!)
```

## CI/CD

| Workflow | Trigger | Tests |
|----------|---------|-------|
| `e2e-ci.yml` | Push to main/develop, PR | Lint → Smoke → Regression |
| `e2e-scheduled.yml` | Nightly 01:00 UTC | Full regression |

### Required GitHub Secrets
`BASE_URL`, `CONNECTOR_API_BASE_URL`, `CONNECTOR_API_SIGNATURE`, `HUB_BASE_URL`, `WRH_HUB_BASE_URL`, `WIKS_HUB_BASE_URL`, `WP_ADMIN_USER`, `WP_ADMIN_PASS`, `WP_PARTNER_USER`, `WP_PARTNER_PASS`, `HUB_ADMIN_USER`, `HUB_ADMIN_PASS`

## Docker

```bash
npm run docker:build    # Build image
npm run docker:smoke    # Run smoke tests in Docker
npm run docker:run      # Run default CI tests
```

## Documentation
- [Architecture](docs/architecture.md)
- [Onboarding Guide](docs/onboarding.md)
- [Test Strategy](docs/test-strategy.md)
- [API Reference](docs/api-reference.md)
- [Project Memory](memory.md)

## Skill References
- [Playwright](skills/playwright-skill.md)
- [Page Object Model](skills/pom-guidelines.md)
- [Selector Strategy](skills/selector-strategy.md)
- [WordPress](skills/wordpress-skill.md)
- [WooCommerce](skills/woocommerce-skill.md)
- [API Testing](skills/api-testing-skill.md)
- [Debugging](skills/debug-strategy.md)
- [GitHub Actions](skills/github-actions-skill.md)
- [Docker](skills/docker-skill.md)
- [CI/CD](skills/cicd-skill.md)
- [JavaScript](skills/javascript-skill.md)

---
*Framework by Rakibul Islam — Hypemill QA Team*
