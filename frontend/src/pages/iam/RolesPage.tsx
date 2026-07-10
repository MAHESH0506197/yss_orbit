import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { BUGridScreen } from '@/features/iam/rbac/screens/BUGridScreen';
import { RoleListScreen } from '@/features/iam/rbac/screens/RoleListScreen';
import { PermissionEditorScreen } from '@/features/iam/rbac/screens/PermissionEditorScreen';

export default function RolesPage() {
  return (
    <Routes>
      <Route index element={<BUGridScreen />} />
      <Route path=":buId" element={<RoleListScreen />} />
      <Route path=":buId/roles/:roleId" element={<PermissionEditorScreen />} />
    </Routes>
  );
}
