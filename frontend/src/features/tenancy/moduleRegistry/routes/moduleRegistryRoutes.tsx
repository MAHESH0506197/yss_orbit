// src/features/tenancy/moduleRegistry/routes/moduleRegistryRoutes.tsx
import React from 'react';
import { RouteObject } from 'react-router-dom';
import { ModuleRegistryListPage } from '../moduleRegistryListPage';
import { ModuleActivatePage } from '../ModuleActivatePage';
import { ModuleRegistryDetailPage } from '../moduleRegistryDetailPage';

export const moduleRegistryRoutes: RouteObject[] = [
  { path: '', element: <ModuleRegistryListPage /> },
  { path: 'activate', element: <ModuleActivatePage /> },
  { path: ':id', element: <ModuleRegistryDetailPage /> },
];
