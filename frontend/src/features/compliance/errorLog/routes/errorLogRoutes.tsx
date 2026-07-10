// yss_orbit\frontend\src\modules\errorLog\routes\errorLogRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { ErrorLogListPage } from '../pages/errorLogListPage';
// @ts-expect-error - Auto-patched TS2307
import { ErrorLogDetailPage } from '../pages/errorLogDetailPage';

export const errorLogRoutes: RouteObject[] = [
  { path: '', element: <ErrorLogListPage /> },
  { path: ':id', element: <ErrorLogDetailPage /> },
];
