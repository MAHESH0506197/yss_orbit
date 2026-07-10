// apps/organization/businessUnit/routes/businessUnitRoutes.tsx
// ENTERPRISE AUDIT (SYNC-03/UX-01/UX-05 FIX):
//   - BusinessUnitDetailPage existed but was unreachable (no route wired it up).
//   - Added lazy loading + Suspense for performance parity with other modules.
//   - Exports both RouteObject[] (for router integration) and <BusinessUnitRoutes> component.

import React, { lazy, Suspense } from 'react';
import type { RouteObject } from 'react-router-dom';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const BusinessUnitListPage   = lazy(() => import('../pages/BusinessUnitListPage'));
const BusinessUnitDetailPage = lazy(() => import('../pages/BusinessUnitDetailPage'));
const BusinessUnitCreatePage = lazy(() => import('../pages/BusinessUnitCreatePage'));
const BusinessUnitEditPage   = lazy(() => import('../pages/BusinessUnitEditPage'));

function BURoutesFallback() {
  return (
    <div className="flex h-60 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" />
    </div>
  );
}

/**
 * Component form — for use inside a parent <Routes> with path="business-units/*".
 *   index  → BusinessUnitListPage
 *   /create → BusinessUnitCreatePage
 *   /:id/edit → BusinessUnitEditPage
 *   /:id   → BusinessUnitDetailPage
 */
export const BusinessUnitRoutes: React.FC = () => (
  <Suspense fallback={<BURoutesFallback />}>
    <Routes>
      <Route index element={<BusinessUnitListPage />} />
      <Route path="create" element={<BusinessUnitCreatePage />} />
      <Route path=":id/edit" element={<BusinessUnitEditPage />} />
      <Route path=":id" element={<BusinessUnitDetailPage />} />
    </Routes>
  </Suspense>
);

/**
 * RouteObject[] form — for use with createBrowserRouter or parent RouteObject config.
 */
export const businessUnitRoutes: RouteObject[] = [
  {
    index: true,
    element: (
      <Suspense fallback={<BURoutesFallback />}>
        <BusinessUnitListPage />
      </Suspense>
    ),
  },
  {
    path: 'create',
    element: (
      <Suspense fallback={<BURoutesFallback />}>
        <BusinessUnitCreatePage />
      </Suspense>
    ),
  },
  {
    path: ':id/edit',
    element: (
      <Suspense fallback={<BURoutesFallback />}>
        <BusinessUnitEditPage />
      </Suspense>
    ),
  },
  {
    path: ':id',
    element: (
      <Suspense fallback={<BURoutesFallback />}>
        <BusinessUnitDetailPage />
      </Suspense>
    ),
  },
];
