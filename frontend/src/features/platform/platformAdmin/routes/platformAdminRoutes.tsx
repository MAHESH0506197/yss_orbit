// yss_orbit\frontend\src\modules\platformAdmin\routes\platformAdminRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { PlatformAdminListPage } from '../pages/platformAdminListPage';
// @ts-expect-error - Auto-patched TS2307
import { PlatformStatsPage } from '../pages/PlatformStatsPage';
// @ts-expect-error - Auto-patched TS2307
import { TenantAdminPage } from '../pages/TenantAdminPage';
// @ts-expect-error - Auto-patched TS2307
import { BreakGlassPage } from '../pages/BreakGlassPage';
// @ts-expect-error - Auto-patched TS2307
import { PlatformAdminDetailPage } from '../pages/platformAdminDetailPage';

export const platformAdminRoutes: RouteObject[] = [
  { path: '', element: <PlatformAdminListPage /> },
  { path: 'stats', element: <PlatformStatsPage /> },
  { path: 'tenants', element: <TenantAdminPage /> },
  { path: 'break-glass', element: <BreakGlassPage /> },
  { path: ':id', element: <PlatformAdminDetailPage /> },
];
