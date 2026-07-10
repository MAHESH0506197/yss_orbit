import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, Key, ArrowLeft, Check, Search, AlertCircle } from 'lucide-react';
import { useRoles, useUpdateRole, usePermissions } from '@/features/iam/rbac/hooks/useRoles';
import { useBusinessUnits } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { Role } from '@/features/iam/rbac/types/roleTypes';
import { ScopeBanner } from '@/features/iam/rbac/components/ScopeBanner';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import toast from 'react-hot-toast';

interface PermissionToggleProps {
  permKey: string;
  description: string;
  granted: boolean;
  disabled?: boolean;
  onChange: (key: string, value: boolean) => void;
}

const PermissionToggle: React.FC<PermissionToggleProps> = ({ permKey, description, granted, disabled, onChange }) => {
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border ${granted ? 'bg-purple-50/50 border-purple-200 dark:bg-purple-500/10 dark:border-purple-500/30' : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/50'} transition-colors select-none`}
      onClick={() => !disabled && onChange(permKey, !granted)}
      role="switch"
      aria-checked={granted}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onChange(permKey, !granted);
        }
      }}
    >
      <div className={`relative w-8 h-4.5 flex-shrink-0 rounded-full transition-colors ${granted ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
        <div className={`absolute top-0.5 left-0.5 bg-white w-3.5 h-3.5 rounded-full transition-transform ${granted ? 'translate-x-3.5' : 'translate-x-0'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-xs font-mono font-medium truncate ${granted ? 'text-purple-900 dark:text-purple-300' : 'text-gray-900 dark:text-gray-100'}`}>
          {permKey}
        </div>
        <div className={`text-[11px] truncate mt-0.5 ${granted ? 'text-purple-700/80 dark:text-purple-400/80' : 'text-gray-500 dark:text-gray-400'}`}>
          {description}
        </div>
      </div>
    </div>
  );
};

export const PermissionEditorScreen: React.FC = () => {
  const { buId, roleId } = useParams<{ buId: string; roleId: string }>();
  const navigate = useNavigate();

  const { data: buResponse } = useBusinessUnits();
  const businessUnits = buResponse?.results || [];
  const bu = useMemo(() => businessUnits.find((b: any) => b.id === buId), [businessUnits, buId]);

  const { data: rolesResponse, isLoading: rolesLoading, error: rolesError } = useRoles();
  const allRoles = rolesResponse?.results || [];
  const role = useMemo(() => allRoles.find((r: Role) => r.id === roleId), [allRoles, roleId]);

  // QUALITY-RP-02: Initially load permissions scoped to the role's module for
  // faster rendering. The user can toggle to show all modules.
  const [showAllModules, setShowAllModules] = useState(false);
  const { data: permissions = [], isLoading: permsLoading } = usePermissions(
    showAllModules ? undefined : (role?.module_code ?? undefined)
  );
  const updateMutation = useUpdateRole();

  const isSystemRole = role?.role_type === 'SYSTEM';

  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const [searchInput, setSearchInput] = useState('');
  const [permFilter, setPermFilter] = useState<'all' | 'granted' | 'denied'>('all');

  // Initialize local perms when role loads
  useEffect(() => {
    if (role) {
      const initial: Record<string, boolean> = {};
      // role.permissions is string[] of UUIDs (Permission PKs)
      (role.permissions ?? []).forEach((id: string) => { initial[id] = true; });
      setLocalPerms(initial);
    }
  }, [role]);

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof permissions> = {};
    permissions.forEach((p) => {
      const mod = p.module || 'General';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [permissions]);

  const handleToggle = (key: string, value: boolean) => {
    if (isSystemRole) return;
    setLocalPerms(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleGroup = (groupName: string) => {
    if (isSystemRole) return;
    const items = groupedPermissions[groupName] || [];
    const allGranted = items.every((i: any) => localPerms[i.id]);
    
    setLocalPerms(prev => {
      const next = { ...prev };
      items.forEach((i: any) => { next[i.id] = !allGranted; });
      return next;
    });
  };

  const handleSave = () => {
    if (!role) return;
    const newPerms = Object.entries(localPerms)
      .filter(([_, granted]) => granted)
      .map(([key]) => key);

    updateMutation.mutate(
      { id: role.id, payload: { ...role, module_code: role.module_code || undefined, permissions: newPerms } },
      {
        onSuccess: () => {
          toast.success('Permissions saved successfully');
          navigate(`/platform/roles/${buId}`);
        },
        onError: () => toast.error('Failed to save permissions')
      }
    );
  };

  if (!bu || !role || rolesLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto w-full">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="p-6">
        <ErrorState error={new Error("An error occurred while fetching role details.")} />
      </div>
    );
  }

  const totalGranted = Object.values(localPerms).filter(Boolean).length;
  const totalAll = permissions.length;

  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-32">
      {/* Topbar back button & Breadcrumbs */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={() => navigate(`/platform/roles/${buId}`)}
          className="flex items-center justify-center w-8 h-8 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-x-auto no-scrollbar">
          <Link to="/platform/roles" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Roles & Permissions</Link>
          <span className="text-gray-300 dark:text-gray-600">›</span>
          <Link to="/platform/roles" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Business units</Link>
          <span className="text-gray-300 dark:text-gray-600">›</span>
          <Link to={`/platform/roles/${buId}`} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">{bu.name}</Link>
          <span className="text-gray-300 dark:text-gray-600">›</span>
          <Link to={`/platform/roles/${buId}`} className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Roles</Link>
          <span className="text-gray-300 dark:text-gray-600">›</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{role.name}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
            {role.name}
            {isSystemRole && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400">
                system
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Toggle permissions granted to this role</p>
        </div>
      </div>

      <ScopeBanner buName={bu.name} isRoleContext />

      {isSystemRole && (
        <div className="flex items-start gap-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50 dark:bg-indigo-500/10 dark:border-indigo-500/20 mb-6">
          <AlertCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-indigo-800 dark:text-indigo-300">
            This is a system role. You cannot change its permissions.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
          />
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(['all', 'granted', 'denied'] as const).map(f => (
            <button
              key={f}
              onClick={() => setPermFilter(f)}
              className={`px-4 py-1 text-xs font-medium rounded-md transition-colors ${
                permFilter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        {/* QUALITY-RP-02: show all modules toggle */}
        {role?.module_code && (
          <button
            onClick={() => setShowAllModules(v => !v)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              showAllModules
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300'
                : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400'
            }`}
          >
            {showAllModules ? 'Showing all modules' : 'Show all modules'}
          </button>
        )}
      </div>

      {/* Permission Grid */}
      <div className="space-y-8">
        {permsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          </div>
        ) : (
          Object.entries(groupedPermissions).map(([groupName, items]) => {
            const filteredItems = items.filter(item => {
              // BUG-RP-04 fix: search by human-readable name OR permission code, not UUID
              if (
                searchInput &&
                !item.name.toLowerCase().includes(searchInput.toLowerCase()) &&
                !item.code.toLowerCase().includes(searchInput.toLowerCase())
              ) return false;
              if (permFilter === 'granted' && !localPerms[item.id]) return false;
              if (permFilter === 'denied' && localPerms[item.id]) return false;
              return true;
            });

            if (filteredItems.length === 0) return null;

            const groupGranted = filteredItems.filter(i => localPerms[i.id]).length;

            return (
              <div key={groupName} className="space-y-3">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                    {groupName}
                  </h3>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                  {!isSystemRole && (
                    <button 
                      onClick={() => handleToggleGroup(groupName)}
                      className="text-xs font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {groupGranted}/{filteredItems.length} granted · toggle all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredItems.map(item => (
                    <PermissionToggle
                      key={item.id}
                      permKey={item.id}
                      description={item.name}
                      granted={!!localPerms[item.id]}
                      disabled={isSystemRole}
                      onChange={handleToggle}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:pl-64 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 p-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {totalGranted} of {totalAll} permissions granted
          </span>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate(`/platform/roles/${buId}`)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSystemRole || updateMutation.isPending}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm"
            >
              {updateMutation.isPending ? <Skeleton className="w-4 h-4 bg-white/20" /> : <Check className="w-4 h-4" />}
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
