# Docker Skill Reference

---

## Build and Run

```bash
# Build image
npm run docker:build
# OR
docker build -t connector-platform-e2e .

# Run smoke tests
npm run docker:smoke
# OR
docker-compose run --rm e2e npm run test:smoke

# Run full regression
docker-compose run --rm e2e npm run test:regression

# Run API tests
docker-compose run --rm e2e npm run test:api
```

## Dockerfile Notes

- Base: `mcr.microsoft.com/playwright:v1.52.0-noble` — includes Node.js + all
  browser binaries
- `npm ci --ignore-scripts` — skip postinstall scripts, browsers already in base
  image
- Reports/logs mounted as volumes for host access

## View Reports After Docker Run

```bash
# Reports are mounted to host via volumes:
# ./reports/html  → reports/html/index.html
npx playwright show-report reports/html
```

## Environment Files for Docker

```bash
# docker-compose.yml uses environments/.env.staging
# Override for local:
docker run --env-file environments/.env.local connector-platform-e2e npm run test:smoke
```

## Debugging Failed Docker Runs

```bash
# Get shell inside container
docker run -it --entrypoint /bin/bash connector-platform-e2e

# Run tests with verbose output
docker-compose run --rm e2e npm run test:smoke -- --reporter=list

# Check browser installation
docker run --rm connector-platform-e2e npx playwright install --list
```

## CI/CD Docker Integration

```yaml
# GitHub Actions alternative (not used here — we use direct Playwright install)
- name: Build Docker image
  run: docker build -t e2e .
- name: Run smoke tests
  run: docker run --env-file .env.ci e2e npm run test:smoke
```
