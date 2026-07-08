# Framework Architecture

## Overview

This framework uses a layered architecture where each layer has a single
responsibility.

```
Tests (specs)
    ↓ use
Fixtures (merged test object with all POM + API fixtures)
    ↓ inject
Page Objects + API Services
    ↓ use
Base classes + Common utilities
    ↓ use
Constants + Helpers + Test Data
```

## Layer Responsibilities

| Layer              | Responsibility                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `tests/`           | Test assertions, business scenario orchestration                                            |
| `fixtures/`        | Dependency injection for page objects and API clients                                       |
| `pages/`           | Page Object Model — UI interactions, no assertions                                          |
| `common/api/`      | API service classes — HTTP calls, response parsing                                          |
| `common/auth/`     | Session management, storage state                                                           |
| `common/actions/`  | Reusable WP/WooCommerce action sequences                                                    |
| `common/utils/`    | Logger, waits, retries, data generation, and domain helpers (SKU generation, order routing) |
| `common/runtime/`  | Cross-scenario in-memory state (runtime-state singleton)                                    |
| `common/services/` | Higher-level orchestration (import validation)                                              |
| `constants/`       | URLs, selectors, API endpoints, test tags                                                   |
| `test-data/`       | JSON fixtures for test input                                                                |
| `environments/`    | Per-environment configuration                                                               |

## Data Flow

```
.env.{ENV} → env.schema.js (validate) → playwright.config.js
                ↓
        globalSetup (auth state)
                ↓
        fixture injection → test execution
                ↓
        page objects + API services
                ↓
        reports/html + reports/json
```

## Authentication Flow

1. `globalSetup` (hooks/before-all.js) runs once before any test
2. Logs in as admin + partner via Playwright browser
3. Saves storage state (cookies + localStorage) to `auth-state/`
4. Playwright config loads storage state for each browser project
5. All tests start already authenticated — no per-test login needed
6. State files are reused if < 12 hours old

## Multi-Environment Support

```
ENV=local   → environments/.env.local   (development)
ENV=staging → environments/.env.staging (QA/pre-prod)
ENV=ci      → GitHub Actions secrets    (automated)
```
