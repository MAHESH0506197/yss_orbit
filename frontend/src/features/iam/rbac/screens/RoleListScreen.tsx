import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Search, Plus, Trash2, Edit2, Shield, Users, ChevronRight, Key, Loader2, X, Component, MoreHorizontal, Eye, Filter, ChevronDown, RotateCcw, Download, Upload } from 'lucide-react';
import { useRoles, useDeleteRole, useRestoreRole, useHardDeleteRole, useExportMatrix, useImportMatrix } from '@/features/iam/rbac/hooks/useRoles';
import { Role } from '@/features/iam/rbac/types/roleTypes';
import { useBusinessUnit } from '@/features/organization/businessUnit/hooks/useBusinessUnits';
import { ScopeBanner } from '@/features/iam/rbac/components/ScopeBanner';
import { RoleIdentityForm } from '@/features/iam/rbac/components/RoleIdentityForm';
import { RolePermissionsPane } from '@/features/iam/rbac/components/RolePermissionsPane';
import { RoleViewPane } from '@/features/iam/rbac/components/RoleViewPane';
import { HardDeleteConfirmDialog } from '@/features/iam/rbac/components/HardDeleteConfirmDialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/ui/PageHeader';
import { RefetchBar } from '@/components/ui/RefetchBar';
import { useViewMode } from '@/hooks/useViewMode';
import { ViewModeToggle } from '@/components/platform/ViewModeToggle';
import { CardGrid } from '@/components/platform/CardGrid';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

// ─── Premium Empty State ─────────────────────────────────────────────────────
function EmptyState({
  hasFilters,
  onClear,
  type,
}: {
  hasFilters: boolean;
  onClear: () => void;
  type: 'module' | 'role';
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div
        className={`flex h-20 w-20 items-center justify-center rounded-3xl mb-5 shadow-sm ring-1 ${
          hasFilters
            ? 'bg-gray-50/50 dark:bg-gray-800/50 ring-gray-200 dark:ring-gray-800'
            : 'bg-indigo-50/50 dark:bg-indigo-500/10 ring-indigo-100 dark:ring-indigo-500/20'
        }`}
      >
        {type === 'module' ? (
          <Component
            className={`h-10 w-10 ${hasFilters ? 'text-gray-400 dark:text-gray-500' : 'text-indigo-500 dark:text-indigo-400'}`}
            aria-hidden="true"
          />
        ) : (
          <Shield
            className={`h-10 w-10 ${hasFilters ? 'text-gray-400 dark:text-gray-500' : 'text-indigo-500 dark:text-indigo-400'}`}
            aria-hidden="true"
          />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {hasFilters
          ? `No ${type === 'module' ? 'Modules' : 'Roles'} Match Your Search`
          : `No ${type === 'module' ? 'Modules' : 'Roles'} Found`}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm leading-relaxed">
        {hasFilters
          ? 'Try adjusting your search query to find what you\'re looking for.'
          : type === 'module'
          ? 'No modules are available for role configuration yet.'
          : 'Create a new custom role for this module to get started.'}
      </p>
      {hasFilters && (
        <button
          onClick={onClear}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <X className="h-4 w-4" aria-hidden="true" /> Clear Search
        </button>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

export const RoleListScreen: React.FC = () => {
  const { buId } = useParams<{ buId: string }>();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isAddingIdentity, setIsAddingIdentity] = useState(false);
  const [editingIdentityRole, setEditingIdentityRole] = useState<Role | null>(null);
  const [editingPermissionsRole, setEditingPermissionsRole] = useState<Role | null>(null);
  const [viewingRole, setViewingRole] = useState<Role | null>(null);
  const [hardDeleteConfirmOpen, setHardDeleteConfirmOpen] = useState(false);
  const [roleToHardDelete, setRoleToHardDelete] = useState<Role | null>(null);

  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);
  const [viewMode, setViewMode, density, setDensity] = useViewMode('roles_list', 'table');

  const [statusFilter, setStatusFilter] = useState<'active' | 'archived' | 'all'>('active');

  const exportMatrix = useExportMatrix();
  const importMatrix = useImportMatrix();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMatrix.mutate(file);
    }
    // reset input so same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const { data: rolesResponse, isLoading, isFetching, error } = useRoles({ 
    business_unit_id: buId,
    is_deleted: statusFilter === 'all' ? 'all' : statusFilter === 'archived' ? true : false,
  });
  const { data: buData } = useBusinessUnit(buId || '');
  const buName = buData?.name || '';
  const deleteMutation = useDeleteRole();
  const restoreMutation = useRestoreRole();
  const hardDeleteMutation = useHardDeleteRole();

  const buRoles = useMemo(() => rolesResponse?.results ?? [], [rolesResponse]);

  // Debounce search
  useEffect(() => {
    setIsSearching(true);
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const filteredRoles = useMemo(() => {
    if (!debouncedSearch) return buRoles;
    const lower = debouncedSearch.toLowerCase();
    return buRoles.filter(
      (r: Role) =>
        r.name.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower)
    );
  }, [buRoles, debouncedSearch]);

  const handleDeleteClick = (e: React.MouseEvent, role: Role) => {
    e.stopPropagation();
    setRoleToDelete(role);
    setConfirmOpen(true);
  };

  const handleHardDeleteClick = (e: React.MouseEvent, role: Role) => {
    e.stopPropagation();
    setRoleToHardDelete(role);
    setHardDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      await deleteMutation.mutateAsync(roleToDelete.id);
      toast.success(`Role "${roleToDelete.name}" archived.`);
    } catch {
      toast.error('Failed to archive role.');
    } finally {
      setConfirmOpen(false);
      setRoleToDelete(null);
    }
  };

  const handleRestore = async (e: React.MouseEvent, role: Role) => {
    e.stopPropagation();
    try {
      await restoreMutation.mutateAsync(role.id);
    } catch {
      // toast is handled in hook
    }
  };

  const handleConfirmHardDelete = async () => {
    if (!roleToHardDelete) return;
    try {
      await hardDeleteMutation.mutateAsync(roleToHardDelete.id);
      toast.success(`Role "${roleToHardDelete.name}" permanently deleted.`);
    } catch {
      toast.error('Failed to permanently delete role.');
    } finally {
      setHardDeleteConfirmOpen(false);
      setRoleToHardDelete(null);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState error={new Error('An error occurred while fetching roles.')} />
      </div>
    );
  }

  let pageTitle = "Roles";
  let pageSubtitle = "Roles are isolated to this business unit only";
  let currentBreadcrumbs = [
    { label: 'Roles & Permissions', href: '/platform/roles' },
    { 
      label: buName || 'Roles', 
      href: `/platform/roles/${buId}`,
      onClick: ((e: React.MouseEvent) => {
        e.preventDefault();
        setIsAddingIdentity(false);
        setEditingIdentityRole(null);
        setEditingPermissionsRole(null);
        setViewingRole(null);
      }) as any
    } as any,
  ];

  if (isAddingIdentity) {
    pageTitle = "Create Role";
    pageSubtitle = "Define a new custom role for this business unit";
    currentBreadcrumbs.push({ label: 'Create' } as any);
  } else if (editingIdentityRole) {
    pageTitle = `Edit Identity: ${editingIdentityRole.name}`;
    pageSubtitle = "Modify role settings and taxonomy";
    currentBreadcrumbs.push({ label: editingIdentityRole.name } as any);
  } else if (editingPermissionsRole) {
    pageTitle = `Assign Permissions: ${editingPermissionsRole.name}`;
    pageSubtitle = "Configure access levels across modules";
    currentBreadcrumbs.push({ label: editingPermissionsRole.name } as any);
  } else if (viewingRole) {
    pageTitle = `Role Details: ${viewingRole.name}`;
    pageSubtitle = "View role identity and permissions";
    currentBreadcrumbs.push({ label: viewingRole.name } as any);
  }

  return (
    <div className="flex flex-col w-full h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <RefetchBar visible={isFetching} />

      <PageHeader
        icon={Shield}
        iconGradient="from-indigo-500 via-purple-500 to-pink-500"
        title={pageTitle}
        subtitle={pageSubtitle}
        breadcrumbs={currentBreadcrumbs}
      />

      <ScopeBanner buName={buName} />

      {isAddingIdentity || editingIdentityRole ? (
        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
          <RoleIdentityForm
            role={editingIdentityRole}
            defaultBusinessUnitId={buId}
            onCancel={() => { setIsAddingIdentity(false); setEditingIdentityRole(null); }}
            onRoleCreated={(newRole) => {
              setIsAddingIdentity(false);
            }}
          />
        </div>
      ) : editingPermissionsRole ? (
        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
          <RolePermissionsPane
            role={editingPermissionsRole}
            onCancel={() => setEditingPermissionsRole(null)}
          />
        </div>
      ) : viewingRole ? (
        <div className="mt-6 animate-in slide-in-from-bottom-4 duration-300">
          <RoleViewPane
            role={viewingRole}
            buName={buName}
            onCancel={() => setViewingRole(null)}
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900 shadow-sm animate-[fadeInUp_0.3s_ease-out_both]">
          {/* Toolbar inside Data Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3.5">
            <div className="relative w-full sm:max-w-xs flex-1">
              {isSearching || (isFetching && !isLoading)
                ? <Loader2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 animate-spin pointer-events-none" aria-label="Searching…" />
                : <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" aria-hidden="true" />
              }
              <input
                type="text"
                placeholder="Search roles..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="relative inline-flex items-center">
                <Filter className="absolute left-3 h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer"
                >
                  <option value="active">Active Roles</option>
                  <option value="archived">Archived</option>
                  <option value="all">All Roles</option>
                </select>
                <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
              <ViewModeToggle
                viewMode={viewMode}
                setViewMode={setViewMode}
                density={density}
                setDensity={setDensity}
              />
              {!(isAddingIdentity || editingIdentityRole || editingPermissionsRole || viewingRole) && (
                <>
                  <button
                    onClick={() => exportMatrix.mutate()}
                    disabled={exportMatrix.isPending}
                    title="Download Role Matrix Template"
                    className="inline-flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                  >
                    {exportMatrix.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importMatrix.isPending}
                    title="Upload Role Matrix"
                    className="inline-flex items-center justify-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                  >
                    {importMatrix.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  </button>
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => setIsAddingIdentity(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Add role
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Active Filter Chips ─────────────────────────────────────────────── */}
          {(debouncedSearch || statusFilter !== 'active') && (
            <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800 px-5 py-2.5 bg-gray-50/20 dark:bg-gray-900/20">
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Search: &ldquo;{debouncedSearch}&rdquo;
                  <button onClick={() => { setSearchInput(''); setDebouncedSearch(''); }} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors" aria-label="Remove search filter">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
              {statusFilter !== 'active' && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 pl-3 pr-2 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  Status: {statusFilter === 'archived' ? 'Archived' : 'All Roles'}
                  <button onClick={() => setStatusFilter('active')} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors" aria-label="Remove status filter">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="p-5 bg-gray-50/30 dark:bg-gray-900/50 min-h-[400px]">
            {isLoading ? (
              <PageSkeleton />
            ) : (
              filteredRoles.length === 0 ? (
                <EmptyState 
                  type="role"
                  hasFilters={searchInput.trim().length > 0} 
                  onClear={() => setSearchInput('')} 
                />
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredRoles.map((role: Role) => {
                    const isSystem = role.role_type === 'SYSTEM';
                    return (
                      <div
                        key={role.id}
                        onClick={() => setViewingRole(role)}
                        role="button"
                        tabIndex={0}
                        className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all cursor-pointer group relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center flex-shrink-0 border border-indigo-200/50 dark:border-indigo-700/30 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                              role.is_deleted 
                                ? 'bg-gray-100 text-gray-600 border border-gray-200/50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700/50' 
                                : 'bg-green-50 text-green-700 border border-green-200/50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                            }`}>
                              {role.is_deleted ? 'Archived' : 'Active'}
                            </span>
                          </div>
                        </div>
                        <div className="mb-6 flex-1">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {role.name}
                          </h3>
                          {role.department_name && (
                            <div className="mt-1 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                {role.department_name}
                              </span>
                            </div>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                            {role.description || 'No description provided'}
                          </p>
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center gap-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" />
                            {(role.permissions ?? []).length} perms
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingPermissionsRole(role); }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Assign Permissions"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingIdentityRole(role); }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                              title="Edit role identity"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {role.is_deleted ? (
                              <button
                                onClick={(e) => handleRestore(e, role)}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                title="Restore role"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleDeleteClick(e, role)}
                                disabled={isSystem}
                                className={`p-2 rounded-lg transition-colors ${
                                  isSystem
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                }`}
                                title={isSystem ? 'System roles cannot be deleted' : 'Archive role'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {isSuperAdmin && (
                              <button
                                onClick={(e) => handleHardDeleteClick(e, role)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Permanently delete role"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Table view */
                <div className="overflow-auto max-h-[calc(100vh-380px)]">
                  <table className="w-full text-sm text-left relative">
                    <thead className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 via-purple-700 to-fuchsia-700 text-white shadow-md">
                      <tr className="divide-x divide-dashed divide-white/20">
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Role name</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Department</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Permissions</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-200 dark:border-gray-800">
                      {filteredRoles.map((role: Role, i) => {
                        const isSystem = role.role_type === 'SYSTEM';
                        return (
                          <tr
                            key={role.id}
                            onClick={() => setViewingRole(role)}
                            style={{ animationDelay: `${i * 30}ms` }}
                            className="group transition-colors divide-x divide-dashed divide-gray-200 dark:divide-gray-800 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 bg-white dark:bg-gray-900 cursor-pointer"
                          >
                            <td className="px-4 py-3.5 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center flex-shrink-0 border border-indigo-200/50 dark:border-indigo-700/30">
                                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="min-w-0 flex-1 flex flex-col justify-center">
                                  <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-indigo-600 transition-colors">
                                    {role.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {role.description || 'No description provided'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              {role.department_name ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                  {role.department_name}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400 dark:text-gray-500 italic">None</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-200/50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                                  <Key className="w-3 h-3 mr-1" />
                                  {(role.permissions ?? []).length} perms
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                                role.is_deleted 
                                  ? 'bg-gray-100 text-gray-600 border border-gray-200/50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700/50' 
                                  : 'bg-green-50 text-green-700 border border-green-200/50 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                              }`}>
                                {role.is_deleted ? 'Archived' : 'Active'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex h-8 w-8 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-all hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 data-[state=open]:border-gray-200 data-[state=open]:bg-gray-50 data-[state=open]:text-gray-900 data-[state=open]:shadow-sm dark:hover:border-gray-700 dark:hover:bg-gray-800/50 dark:hover:text-white"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-60 rounded-2xl border border-gray-100 bg-white/95 p-2 shadow-xl shadow-gray-200/50 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/95">
                                    <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-500">
                                      <span className="block truncate text-indigo-600 dark:text-indigo-400">{role.name}</span>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                                    <DropdownMenuItem onClick={() => setViewingRole(role)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
                                        <Eye className="h-4 w-4" />
                                      </div>
                                      View Details
                                    </DropdownMenuItem>
                                    {!role.is_deleted && (
                                      <DropdownMenuItem onClick={() => setEditingPermissionsRole(role)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800/50">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                          <Key className="h-4 w-4" />
                                        </div>
                                        Assign Permissions
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem onClick={() => setEditingIdentityRole(role)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-900/20">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                                        <Edit2 className="h-4 w-4" />
                                      </div>
                                      Edit Identity
                                    </DropdownMenuItem>
                                    {role.is_deleted ? (
                                      <>
                                        <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                                        <DropdownMenuItem onClick={(e) => handleRestore(e as any, role)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                                            <RotateCcw className="h-4 w-4" />
                                          </div>
                                          Restore Role
                                        </DropdownMenuItem>
                                      </>
                                    ) : !isSystem && (
                                      <>
                                        <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                                        <DropdownMenuItem onClick={(e) => handleDeleteClick(e as any, role)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20">
                                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">
                                            <Trash2 className="h-4 w-4" />
                                          </div>
                                          Archive Role
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                    {isSuperAdmin && (
                                      <>
                                      <DropdownMenuSeparator className="my-1 bg-gray-100 dark:bg-gray-800" />
                                      <DropdownMenuItem onClick={(e) => handleHardDeleteClick(e, role)} className="flex cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                                          <Trash2 className="h-4 w-4" />
                                        </div>
                                        Permanent Delete
                                      </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </div>
          <div className="flex justify-between items-center px-7 py-4 text-xs text-gray-500 font-medium border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
            <span>
              Showing <span className="font-bold text-gray-900 dark:text-white">
                {filteredRoles.length}
              </span> of <span className="font-bold text-gray-900 dark:text-white">
                {buRoles.length}
              </span> roles
            </span>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        opts={{
          title: "Archive Role",
          message: `Are you sure you want to archive the role "${roleToDelete?.name}"?`,
          confirmLabel: "Archive",
          cancelLabel: "Cancel",
          variant: "danger",
          onConfirm: handleConfirmDelete
        }}
        onClose={() => setConfirmOpen(false)}
        isLoading={deleteMutation.isPending}
      />

      <HardDeleteConfirmDialog
        isOpen={hardDeleteConfirmOpen}
        onClose={() => {
          setHardDeleteConfirmOpen(false);
          setRoleToHardDelete(null);
        }}
        onConfirm={handleConfirmHardDelete}
        entityName={roleToHardDelete?.name || ''}
        entityType="Role"
        isLoading={hardDeleteMutation.isPending}
      />
    </div>
  );
};
