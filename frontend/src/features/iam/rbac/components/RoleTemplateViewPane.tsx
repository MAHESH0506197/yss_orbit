import React, { useMemo } from 'react';
import { Shield, Key, X, CheckCircle2 } from 'lucide-react';
import { RoleTemplate, Permission } from '../types/roleTypes';

interface RoleTemplateViewPaneProps {
  template: RoleTemplate;
  onCancel: () => void;
}

export function RoleTemplateViewPane({ template, onCancel }: RoleTemplateViewPaneProps) {

  // Group only ASSIGNED permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    const perms = template.permissions || [];
    perms.forEach(p => {
      const mod = p.module || 'other';
      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [template.permissions]);

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-500" />
            Template Details
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
        
        {/* Left side: Template details */}
        <div className="w-full md:w-1/3 flex flex-col gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-xl border border-gray-100 dark:border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Identity</h3>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Name</div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Description</div>
                <div className="text-sm text-gray-700 dark:text-gray-300">{template.description || 'N/A'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Status</div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  template.is_deleted 
                    ? 'bg-red-100 text-red-700' 
                    : template.is_active === false 
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {template.is_deleted ? 'Archived' : template.is_active === false ? 'Inactive' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Assigned Permissions */}
        <div className="w-full md:w-2/3">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Template Permissions
            </h3>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">
              {(template.permissions || []).length} total
            </div>
          </div>

          {Object.keys(groupedPermissions).length === 0 ? (
            <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500">No permissions assigned.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <div key={module} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                    <span className="font-bold text-sm text-gray-900 dark:text-white capitalize tracking-wide">{module}</span>
                    <span className="text-xs font-semibold text-gray-500">{perms.length} perms</span>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {perms.map((perm: Permission) => (
                      <div key={perm.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate" title={perm.name}>
                            {perm.name}
                          </div>
                          {perm.description && (
                            <div className="text-[10px] text-gray-500 mt-0.5 line-clamp-1" title={perm.description}>
                              {perm.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
