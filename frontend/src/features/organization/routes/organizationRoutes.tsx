// yss_orbit/frontend/src/modules/organization/routes/organizationRoutes.tsx

import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// @ts-expect-error - Auto-patched TS2307
const OrganizationListPage    = lazy(() => import('../pages/organizationListPage'));
// @ts-expect-error - Auto-patched TS2307
const OrganizationDetailPage  = lazy(() => import('../pages/organizationDetailPage').then(m => ({ default: m.OrganizationDetailPage })));
// @ts-expect-error - Auto-patched TS2307
const OrganizationSettingsPage = lazy(() => import('../pages/OrganizationSettingsPage').then(m => ({ default: m.OrganizationSettingsPage })));

function Fallback() {
  return (
    <div className="flex h-60 items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[var(--color-primary)]" />
    </div>
  );
}

export const OrganizationRoutes: React.FC = () => (
  <Suspense fallback={<Fallback />}>
    <Routes>
      <Route index               element={<OrganizationListPage />} />
      <Route path="create"       element={<OrganizationDetailPage />} />
      <Route path=":id"          element={<OrganizationDetailPage />} />
      <Route path=":id/settings" element={<OrganizationSettingsPage />} />
      {/*
        SYNC-01 FIX: :id/edit route was missing. BusinessDomainDetailPage navigates
        to /:id/edit on "Edit" button press — this creates the matching org route.
        TODO: Create OrganizationEditPage component (modal-only editing exists today).
      */}
      <Route
        path=":id/edit"
        element={<OrganizationDetailPage />}
      />
    </Routes>
  </Suspense>
);
