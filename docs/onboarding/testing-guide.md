<!-- yss_orbit\docs\onboarding\testing-guide.md -->
# Testing Guide (X03)

## Backend Testing
- Unit: app/tests/ (no DB, mock services)
- Integration: backend/tests/integration/
- E2E: backend/tests/e2e/
  pytest backend/apps/APP/tests/ -v

## Frontend Testing
- Unit: module/tests/
- Integration: frontend/tests/integration/
- E2E: frontend/tests/e2e/ via Playwright
  npm run test
  npm run test:e2e
