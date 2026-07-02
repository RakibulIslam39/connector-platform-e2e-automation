# ─────────────────────────────────────────────────────────────────────────────
# Connector Platform 2.0 — E2E Test Runner
# Base image includes Node.js + all Playwright browser dependencies
# ─────────────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/playwright:v1.52.0-noble

WORKDIR /app

# Copy dependency files first for better layer caching
COPY package*.json ./

# Install Node dependencies (skip Playwright browser install — already in base image)
RUN npm ci --ignore-scripts

# Copy the full project
COPY . .

# Create required output directories
RUN mkdir -p reports/html reports/json reports/allure logs auth-state

# Default command: run smoke tests in CI mode
CMD ["npm", "run", "test:ci"]
