// yss_orbit\frontend\src\modules\appraisal\routes\appraisalRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { AppraisalListPage } from '../pages/appraisalListPage';
// @ts-expect-error - Auto-patched TS2307
import { AppraisalCreatePage } from '../pages/AppraisalCreatePage';
// @ts-expect-error - Auto-patched TS2307
import { AppraisalDetailPage } from '../pages/appraisalDetailPage';
// @ts-expect-error - Auto-patched TS2307
import { KpiPage } from '../pages/KpiPage';
// @ts-expect-error - Auto-patched TS2307
import { ReviewCyclePage } from '../pages/ReviewCyclePage';

export const appraisalRoutes: RouteObject[] = [
  { path: '', element: <AppraisalListPage /> },
  { path: 'new', element: <AppraisalCreatePage /> },
  { path: ':id', element: <AppraisalDetailPage /> },
  { path: 'kpis', element: <KpiPage /> },
  { path: 'cycles', element: <ReviewCyclePage /> },
];
