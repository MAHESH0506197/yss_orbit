// yss_orbit\frontend\src\modules\tenantSettings\routes\tenantSettingsRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { TenantSettingsListPage } from '../pages/tenantSettingsListPage';
// @ts-expect-error - Auto-patched TS2307
import { SettingsTemplatePage } from '../pages/SettingsTemplatePage';
// @ts-expect-error - Auto-patched TS2307
import { TenantSettingsDetailPage } from '../pages/tenantSettingsDetailPage';

export const tenantSettingsRoutes: RouteObject[] = [
  { path: '', element: <TenantSettingsListPage /> },
  { path: 'templates', element: <SettingsTemplatePage /> },
  { path: ':id', element: <TenantSettingsDetailPage /> },
];
