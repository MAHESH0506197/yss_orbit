import React, { useEffect, useMemo } from 'react';
import { useUserBusinessUnit } from '@/features/organization/userBusinessUnit/hooks/useuserBusinessUnit';
import { Building2, Shield, Calendar, ArrowRight } from 'lucide-react';
import { parseISO, isPast } from 'date-fns';
import { Link } from 'react-router-dom';

import { useAuthStore } from '@/store/authStore';
import { formatIST } from '@/utils/date';

interface UserBUAccessTabProps {
  userId: string;
  isSuperAdmin?: boolean; // Target user's super admin status
}

export const UserBUAccessTab: React.FC<UserBUAccessTabProps> = ({ userId, isSuperAdmin }) => {
  const { memberships, isLoading, applyFilters, refetch } = useUserBusinessUnit();
  const isCurrentUserSuperAdmin = useAuthStore((state: any) => state.isSuperAdmin);

  const stableApplyFilters = applyFilters;
  const stableRefetch = refetch;
  
  useEffect(() => {
    stableApplyFilters({ userId });
    stableRefetch();
  }, [userId, stableApplyFilters, stableRefetch]);

  // Group memberships by Business Unit
  const groupedMemberships = useMemo(() => {
    const groups: Record<string, { buId: string; buName: string; roles: any[] }> = {};
    memberships.forEach(m => {
      if (!m.businessUnit) return;
      const groupId = m.businessUnit!;
      if (!groups[groupId]) {
        groups[groupId] = {
          buId: groupId,
          buName: m.businessUnitName,
          roles: []
        };
      }
      groups[groupId]!.roles.push(m);
    });
    return Object.values(groups).sort((a, b) => a.buName.localeCompare(b.buName));
  }, [memberships]);

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading access data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-500" /> Business Unit Access
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Read-only view of localized access for this user across different Business Units.</p>
        </div>
        {isCurrentUserSuperAdmin && (
          <Link 
            to="/platform/user-bu-mapping" 
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100 transition-colors dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40 shrink-0"
          >
            Manage in User-BU Mapping <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {groupedMemberships.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 p-12 text-center bg-gray-50/50 dark:bg-gray-800/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 mb-4">
            <Shield className="h-6 w-6 text-indigo-500" />
          </div>
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-2">No Business Unit Access</h4>
          {isSuperAdmin ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0 max-w-md mx-auto">
              This user is a <strong className="text-gray-700 dark:text-gray-300">Super Admin</strong> and has unrestricted platform-wide access by default. They do not need to be explicitly assigned to Business Units.
            </p>
          ) : (
            <div className="max-w-md mx-auto space-y-3 text-sm">
               <p className="text-gray-500 dark:text-gray-400">
                 This user currently does not have access to any Business Units.
               </p>
               <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-400 font-medium">
                 Standard users MUST be assigned to at least one Business Unit to access and operate within the platform.
               </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-xs font-bold">
              <tr>
                <th className="px-6 py-4">Business Unit</th>
                <th className="px-6 py-4">Roles & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {groupedMemberships.map((group) => (
                <tr key={group.buId} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-6 py-4 align-top w-1/3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white font-bold shadow-sm shrink-0">
                        {group.buName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white block">{group.buName}</span>
                        <span className="text-xs text-gray-500 mt-0.5 block">{group.roles.length} Role{group.roles.length !== 1 && 's'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {group.roles.map(role => {
                        const isExpired = role.effectiveTo && isPast(parseISO(role.effectiveTo));
                        return (
                          <div key={role.id} className="flex flex-col gap-1.5 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 rounded-lg border border-gray-100 dark:border-gray-800 min-w-[200px] flex-1 sm:flex-none">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-bold text-gray-900 dark:text-white truncate" title={role.roleName || 'No Role'}>{role.roleName || 'No Role'}</span>
                              <div className={`h-2 w-2 shrink-0 rounded-full ${role.isActiveMembership && !isExpired ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="truncate">{role.effectiveFrom ? formatIST(parseISO(role.effectiveFrom), 'MMM d') : 'Always'} - {role.effectiveTo ? formatIST(parseISO(role.effectiveTo), 'MMM d, yyyy') : 'Forever'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
