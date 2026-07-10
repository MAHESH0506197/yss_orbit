// yss_orbit\frontend\src\modules\observability\routes\observabilityRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { ObservabilityListPage } from '../pages/observabilityListPage';
// @ts-expect-error - Auto-patched TS2307
import { MetricsPage } from '../pages/MetricsPage';
// @ts-expect-error - Auto-patched TS2307
import { TracesPage } from '../pages/TracesPage';
// @ts-expect-error - Auto-patched TS2307
import { ObservabilityDetailPage } from '../pages/observabilityDetailPage';

export const observabilityRoutes: RouteObject[] = [
  { path: '', element: <ObservabilityListPage /> },
  { path: 'metrics', element: <MetricsPage /> },
  { path: 'traces', element: <TracesPage /> },
  { path: ':id', element: <ObservabilityDetailPage /> },
];
