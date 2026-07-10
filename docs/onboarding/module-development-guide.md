<!-- yss_orbit\docs\onboarding\module-development-guide.md -->
# Module Development Guide

## Adding a New Backend App
1. Run: python tools/codegen/new_backend_app_scaffold.py APP_NAME
2. Register in config/settings/base.py INSTALLED_APPS
3. Add URLs to api/v1/urls.py
4. Add to platform/catalogue/module_catalogue.py

## Adding a New Frontend Module
1. Run: python tools/codegen/new_module_scaffold.py MODULE_NAME
2. Register routes in app/router/moduleRoutes.ts
3. Add to navigation in app/shell/ModuleNavigation.tsx
