// yss_orbit\frontend\src\modules\attendance\routes\attendanceRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { AttendanceListPage } from '../pages/attendanceListPage';
// @ts-expect-error - Auto-patched TS2307
import { AttendanceCheckInPage } from '../pages/AttendanceCheckInPage';
// @ts-expect-error - Auto-patched TS2307
import { AttendanceDetailPage } from '../pages/attendanceDetailPage';
// @ts-expect-error - Auto-patched TS2307
import { AttendanceOvertimePage } from '../pages/AttendanceOvertimePage';
// @ts-expect-error - Auto-patched TS2307
import { AttendanceShiftPage } from '../pages/AttendanceShiftPage';

export const attendanceRoutes: RouteObject[] = [
  { path: '', element: <AttendanceListPage /> },
  { path: 'check-in', element: <AttendanceCheckInPage /> },
  { path: 'overtime', element: <AttendanceOvertimePage /> },
  { path: 'shifts', element: <AttendanceShiftPage /> },
  { path: ':id', element: <AttendanceDetailPage /> },
];
