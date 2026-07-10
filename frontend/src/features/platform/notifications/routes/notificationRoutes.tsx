// yss_orbit\frontend\src\modules\notification\routes\notificationRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { NotificationListPage } from '../pages/notificationListPage';
// @ts-expect-error - Auto-patched TS2307
import { NotificationPreferencePage } from '../pages/NotificationPreferencePage';
// @ts-expect-error - Auto-patched TS2307
import { NotificationDetailPage } from '../pages/notificationDetailPage';

export const notificationRoutes: RouteObject[] = [
  { path: '', element: <NotificationListPage /> },
  { path: 'preferences', element: <NotificationPreferencePage /> },
  { path: ':id', element: <NotificationDetailPage /> },
];
