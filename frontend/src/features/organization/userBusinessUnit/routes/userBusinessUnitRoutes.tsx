// yss_orbit\frontend\src\modules\userBusinessUnit\routes\userBusinessUnitRoutes.tsx
import React from 'react';
import { Route, Routes } from 'react-router-dom';

const ListPage = React.lazy(
  // @ts-expect-error - Auto-patched TS2307
  () => import('../pages/userBusinessUnitListPage')
);
const DetailPage = React.lazy(
  // @ts-expect-error - Auto-patched TS2307
  () => import('../pages/userBusinessUnitDetailPage')
);
const MembersPage = React.lazy(
  // @ts-expect-error - Auto-patched TS2307
  () => import('../pages/BusinessUnitMemberPage')
);

export const UserBusinessUnitRoutes = () => {
  return (
    <React.Suspense fallback={<div className="flex justify-center items-center p-8 text-gray-400">Loading…</div>}>
      <Routes>
        {/* /user-bu-mapping/ — full membership list */}
        <Route path="/" element={<ListPage />} />

        {/* /user-bu-mapping/bu-members — members of a specific BU (via ?buId=) */}
        <Route path="/bu-members" element={<MembersPage />} />

        {/* /user-bu-mapping/:id — detail of a single membership */}
        <Route path="/:id" element={<DetailPage />} />
      </Routes>
    </React.Suspense>
  );
};

export default UserBusinessUnitRoutes;
