<!-- yss_orbit\docs\onboarding\frontend-architecture.md -->
# Frontend Architecture Guide

## Key Patterns
- API calls via typed clients in module/api/
- State via stores in module/state/
- Route access via guards in app/guards/
- Design system components from design_system/ only
- Feature flags via useFeatureFlag() hook
- No inline styles - use design tokens
- All auth via platform/auth/ layer
