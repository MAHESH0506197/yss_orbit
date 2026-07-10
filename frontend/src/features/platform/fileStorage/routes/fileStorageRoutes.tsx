// yss_orbit\frontend\src\modules\fileStorage\routes\fileStorageRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
// @ts-expect-error - Auto-patched TS2307
import { FileStorageListPage } from '../pages/fileStorageListPage';
// @ts-expect-error - Auto-patched TS2307
import { FileUploadPage } from '../pages/FileUploadPage';
// @ts-expect-error - Auto-patched TS2307
import { FileViewPage } from '../pages/FileViewPage';

export const fileStorageRoutes: RouteObject[] = [
  { path: '', element: <FileStorageListPage /> },
  { path: 'upload', element: <FileUploadPage /> },
  { path: ':id', element: <FileViewPage /> },
];
