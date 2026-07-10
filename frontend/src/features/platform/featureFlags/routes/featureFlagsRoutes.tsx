// yss_orbit\frontend\src\modules\featureFlags\routes\featureFlagsRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { FeatureFlagsListPage } from '../pages/featureFlagsListPage';
// @ts-expect-error - Auto-patched TS2307
import { FeatureFlagCreatePage } from '../pages/FeatureFlagCreatePage';
// @ts-expect-error - Auto-patched TS2307
import { FeatureFlagsDetailPage } from '../pages/featureFlagsDetailPage';

export const featureFlagsRoutes: RouteObject[] = [
  { path: '', element: <FeatureFlagsListPage /> },
  { path: 'new', element: <FeatureFlagCreatePage /> },
  { path: ':id', element: <FeatureFlagsDetailPage /> },
];
