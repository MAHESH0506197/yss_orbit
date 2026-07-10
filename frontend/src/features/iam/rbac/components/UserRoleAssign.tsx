import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUserRoles, useAssignUserRole, useRevokeUserRole, useRestoreUserRole } from '../hooks/useUserRoles';
import { useRoles } from '@/features/iam/rbac/hooks/useRoles';
import { useBusinessUnits } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { UserRoleCreatePayload } from '../types/userRoleTypes';

import { AlertCircle, CheckCircle2, History, Plus, RotateCcw, ShieldOff } from 'lucide-react';
import { formatIST } from '@/utils/date';

export interface UserRoleAssignProps {
  userId: string;
}

export function UserRoleAssign({ userId }: UserRoleAssignProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAssignModalOpen) setIsAssignModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAssignModalOpen]);
  
  // Queries
  const { data: userRolesResponse, isLoading: isLoadingRoles } = useUserRoles({ user_id: userId, page_size: 100 });
  const userRoles = userRolesResponse?.results || [];
  
  // Split roles into active and revoked
  const activeRoles = userRoles.filter(ur => ur.is_active);
  const revokedRoles = userRoles.filter(ur => !ur.is_active);

  const { data: rolesResponse } = useRoles({ page_size: 100 });
  const allRoles = rolesResponse?.results || [];

  const { data: busResponse } = useBusinessUnits();
  const allBus = busResponse?.results || [];

  // Mutations
  const assignMutation = useAssignUserRole();
  const revokeMutation = useRevokeUserRole();
  const restoreMutation = useRestoreUserRole();

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: UserRoleCreatePayload = {
      user_id: userId,
      business_unit_id: formData.get('business_unit_id') as string,
      role_id: formData.get('role_id') as string,
    };
    
    await assignMutation.mutateAsync(payload);
    setIsAssignModalOpen(false);
  };

  const getRoleName = (roleId: string) => allRoles.find(r => r.id === roleId)?.name || 'Unknown Role';
  const getBuName = (buId: string) => allBus.find(bu => bu.id === buId)?.name || 'Unknown BU';

  return (
    <div className="space-y-6">
      {/* Active Roles Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Roles</h3>
          </div>
          
          <PermissionGate permission="rbac.userrole.create">
            <button 
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Assign Role
            </button>
          </PermissionGate>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Business Unit</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned By</th>
                <th className="px-4 py-3">Assigned Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRoles ? (
                <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
              ) : activeRoles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No active roles found.</td></tr>
              ) : (
                activeRoles.map(ur => (
                  <tr key={ur.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{getBuName(ur.business_unit_id)}</td>
                    <td className="px-4 py-3">{ur.role_name || getRoleName(ur.role_id)}</td>
                    <td className="px-4 py-3">{ur.assigned_by_name || ur.assigned_by_id || 'System'}</td>
                    <td className="px-4 py-3">{ur.assigned_at ? formatIST(ur.assigned_at, 'MMM d, yyyy') : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PermissionGate permission="rbac.userrole.delete">
                        <button
                          onClick={() => revokeMutation.mutate(ur.id)}
                          disabled={revokeMutation.isPending}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Revoke Role"
                        >
                          <ShieldOff className="w-4 h-4" />
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revoked Roles Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Role History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Business Unit</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Revoked Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {revokedRoles.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No history found.</td></tr>
              ) : (
                revokedRoles.map(ur => (
                  <tr key={ur.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{getBuName(ur.business_unit_id)}</td>
                    <td className="px-4 py-3">{ur.role_name || getRoleName(ur.role_id)}</td>
                    <td className="px-4 py-3">{ur.revoked_at ? formatIST(ur.revoked_at, 'MMM d, yyyy') : '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        Revoked
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PermissionGate permission="rbac.userrole.restore">
                        <button
                          onClick={() => restoreMutation.mutate(ur.id)}
                          disabled={restoreMutation.isPending}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 justify-end w-full"
                          title="Restore Role"
                        >
                          <RotateCcw className="w-4 h-4" />
                          <span className="text-xs">Restore</span>
                        </button>
                      </PermissionGate>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {isAssignModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-950/55 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsAssignModalOpen(false)} />
            
            <div className="relative inline-block w-full max-w-md p-6 text-left align-middle bg-white dark:bg-gray-950 rounded-2xl shadow-2xl ring-1 ring-black/10 dark:ring-white/8 animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mb-4">
                Assign Role to User
              </h3>
              
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                    Business Unit
                  </label>
                  <select
                    name="business_unit_id"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Select BU</option>
                    {allBus.map(bu => (
                      <option key={bu.id} value={bu.id}>{bu.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                    Role
                  </label>
                  <select
                    name="role_id"
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-indigo-500 appearance-none"
                  >
                    <option value="">Select Role</option>
                    {allRoles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Assigning a new role in a BU will automatically revoke their existing role in that BU.
                  </p>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsAssignModalOpen(false)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-transparent dark:text-gray-400 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignMutation.isPending}
                    className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:translate-y-0 dark:ring-offset-gray-950"
                  >
                    {assignMutation.isPending ? 'Assigning...' : 'Assign Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default UserRoleAssign;
