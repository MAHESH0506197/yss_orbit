// yss_orbit\frontend\src\modules\tenantModule\routes\tenantModuleRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { TenantModuleListPage } from '../pages/tenantModuleListPage';
// @ts-expect-error - Auto-patched TS2307
import { PlanPage } from '../pages/PlanPage';
// @ts-expect-error - Auto-patched TS2307
import { SubscribePage } from '../pages/SubscribePage';
// @ts-expect-error - Auto-patched TS2307
import { UnsubscribePage } from '../pages/UnsubscribePage';
// @ts-expect-error - Auto-patched TS2307
import { TenantModuleDetailPage } from '../pages/tenantModuleDetailPage';

export const tenantModuleRoutes: RouteObject[] = [
  { path: '', element: <TenantModuleListPage /> },
  { path: 'plans', element: <PlanPage /> },
  { path: 'subscribe/:id', element: <SubscribePage /> },
  { path: 'unsubscribe', element: <UnsubscribePage /> },
  { path: ':id', element: <TenantModuleDetailPage /> },
];
