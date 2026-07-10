// yss_orbit\frontend\src\modules\dashboard\routes\dashboardRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { DashboardListPage } from '../pages/dashboardListPage';
// @ts-expect-error - Auto-patched TS2307
import { DashboardCustomizePage } from '../pages/DashboardCustomizePage';

export const dashboardRoutes: RouteObject[] = [
  { path: '', element: <DashboardListPage /> },
  { path: 'customize', element: <DashboardCustomizePage /> },
];
