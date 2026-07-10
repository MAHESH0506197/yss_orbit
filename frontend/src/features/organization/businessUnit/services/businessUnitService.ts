// yss_orbit/frontend/src/modules/businessUnit/services/businessUnitService.ts
// FIXED:
//   - Previous version extended BaseService with PUT (backend uses PATCH only).
//   - No delete() or restore() methods were present.
//   - The businessUnitApi.ts already provides the complete, correct API client.
//
// Following the same pattern as organizationService.ts — re-export the canonical
// API client so callers who import from 'services' get the correct implementation.

export { businessUnitApi as businessUnitService } from '../api/businessUnitApi';
