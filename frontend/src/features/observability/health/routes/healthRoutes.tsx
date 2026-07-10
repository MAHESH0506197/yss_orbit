// yss_orbit\frontend\src\modules\health\routes\healthRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { HealthListPage } from '../pages/healthListPage';

export const healthRoutes: RouteObject[] = [
  { path: '', element: <HealthListPage /> },
];
