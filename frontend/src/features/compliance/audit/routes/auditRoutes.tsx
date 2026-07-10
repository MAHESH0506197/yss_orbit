// yss_orbit\frontend\src\modules\audit\routes\auditRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { AuditListPage } from '../pages/auditListPage';
// @ts-expect-error - Auto-patched TS2307
import { AuditExportPage } from '../pages/AuditExportPage';
// @ts-expect-error - Auto-patched TS2307
import { AuditDetailPage } from '../pages/auditDetailPage';

export const auditRoutes: RouteObject[] = [
  { path: '', element: <AuditListPage /> },
  { path: 'export', element: <AuditExportPage /> },
  { path: ':id', element: <AuditDetailPage /> },
];
