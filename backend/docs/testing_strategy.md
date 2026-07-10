<!-- yss_orbit\backend\docs\testing_strategy.md -->
# Testing Strategy

- **Unit Tests**: Test logic in isolation without DB.
- **Integration Tests**: Test DB repositories and internal services (`pytest.mark.django_db`).
- **E2E / Smoke Tests**: Test API endpoints natively with DRF APIClient or Playwright.
