import React, { useState, useMemo, useEffect } from 'react';
import { usePermissions, useUpdateRoleTemplate, useSubModules } from '../hooks/useRoles';
import type { Permission, RoleTemplate } from '../types/roleTypes';
import { Search, Save, ArrowLeft, Shield, Info, Check, Filter, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  template: RoleTemplate;
  onBack: () => void;
}

export function RoleTemplatePermissionsMatrix({ template, onBack }: Props) {
  // We need to fetch all permissions to display all modules when "Show All Modules" is checked.
  const { data: allPermissions = [], isLoading: isLoadingAll } = usePermissions();
  const { data: dbSubModules = [], isLoading: isLoadingModules } = useSubModules();
  const updateMutation = useUpdateRoleTemplate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAllModules, setShowAllModules] = useState<boolean>(false);
  const [activeModule, setActiveModule] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'granted' | 'unassigned'>('all');

  // Find the template's module code
  const templateModuleCode = template.module_code;

  // Initialize selected permissions
  useEffect(() => {
    if (template?.permissions) {
      setSelectedIds(template.permissions.map((p: Permission) => p.id));
    }
  }, [template]);

  // Group permissions by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, typeof allPermissions> = {};
    allPermissions.forEach(p => {
      const mod = p.module || p.code.split('.')[0] || 'other';

      // If we are NOT showing all modules, we only want the template's module.
      if (!showAllModules && templateModuleCode) {
        if (mod !== templateModuleCode) {
           return;
        }
      }

      if (!groups[mod]) groups[mod] = [];
      groups[mod].push(p);
    });
    return groups;
  }, [allPermissions, showAllModules, templateModuleCode]);

  const moduleNames = useMemo(() => Object.keys(groupedPermissions).sort(), [groupedPermissions]);

  useEffect(() => {
    if (moduleNames.length > 0 && moduleNames[0] && (!activeModule || !moduleNames.includes(activeModule))) {
      setActiveModule(moduleNames[0]);
    }
  }, [moduleNames, activeModule]);

  const handleToggle = (id: string) => {
    setSelectedIds(current => {
      if (current.includes(id)) {
        return current.filter(i => i !== id);
      }
      return [...current, id];
    });
  };

  const handleToggleGroup = (moduleName: string) => {
    const modulePerms = (groupedPermissions[moduleName] ?? []).map((p) => p.id);
    setSelectedIds(current => {
      const allSelected = modulePerms.every((id: string) => current.includes(id));
      if (allSelected) {
        return current.filter(id => !modulePerms.includes(id));
      } else {
        const newPerms = new Set([...current, ...modulePerms]);
        return Array.from(newPerms);
      }
    });
  };

  const hasChanges = useMemo(() => {
    const original = new Set(template.permissions.map((p: Permission) => p.id));
    if (original.size !== selectedIds.length) return true;
    for (const id of selectedIds) {
      if (!original.has(id)) return true;
    }
    return false;
  }, [template.permissions, selectedIds]);

  const handleSave = () => {
    updateMutation.mutate(
      { id: template.id, payload: { permissions: selectedIds } },
      {
        onSuccess: () => {
          toast.success('Permissions updated successfully.');
          onBack();
        },
      },
    );
  };

  if (isLoadingAll || isLoadingModules) {
    return <div className="p-10 text-center text-gray-500 animate-pulse">Loading permissions...</div>;
  }

  const activePermissions = groupedPermissions[activeModule] || [];

  const filteredPermissions = activePermissions.filter(p => {
    const isSelected = selectedIds.includes(p.id);
    if (filterType === 'granted' && !isSelected) return false;
    if (filterType === 'unassigned' && isSelected) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!p.name.toLowerCase().includes(query) && !p.code.toLowerCase().includes(query) && !(p.description || '').toLowerCase().includes(query)) {
        return false;
      }
    }
    return true;
  });

  // Resolve sub-module title for display
  const templateModuleObj = dbSubModules.find((s) => s.code === templateModuleCode);
  const templateModuleLabel = templateModuleObj?.title ?? templateModuleCode ?? 'Global';

  return (
    <div className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden h-[800px] max-h-[85vh] animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 dark:border-gray-800 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/20 z-10 relative gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              Manage Template: <span className="text-indigo-600 dark:text-indigo-400">{template.name}</span>
            </h2>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
              <span className="inline-flex px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-semibold">
                {templateModuleLabel}
              </span>
              <span>Select modules on the left to assign blueprint access levels.</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={showAllModules}
                onChange={(e) => setShowAllModules(e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${showAllModules ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showAllModules ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 select-none group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Show All Modules
            </span>
          </label>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex-shrink-0 px-6 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex items-start gap-3 z-10">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>Blueprint permissions.</strong> These define the standard permission set for this
          role template. Permissions saved here are applied when this template is cloned into a
          Business Unit. Existing BU roles are <em>not</em> automatically updated.
        </p>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Modules List */}
        <div className="w-72 flex-shrink-0 bg-gray-50/50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Modules
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              {moduleNames.length} module{moduleNames.length !== 1 ? 's' : ''} available
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {moduleNames.length === 0 ? (
              <div className="text-center py-10 px-4">
                <p className="text-sm text-gray-500">No modules found.</p>
              </div>
            ) : (
              moduleNames.map(module => {
                const modulePerms = (groupedPermissions[module] ?? []).map(p => p.id);
                const selectedCount = modulePerms.filter(id => selectedIds.includes(id)).length;
                const totalCount = modulePerms.length;
                const isActive = activeModule === module;
                const allSelected = selectedCount === totalCount && totalCount > 0;
                
                return (
                  <button
                    key={module}
                    onClick={() => setActiveModule(module)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-left group ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 shadow-sm' : 'border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <span className={`font-semibold capitalize text-sm truncate pr-2 ${isActive ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                      {module}
                    </span>
                    <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800/60 dark:text-indigo-300' : allSelected ? 'bg-indigo-600 text-white' : selectedCount > 0 ? 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'}`}>
                      {selectedCount} / {totalCount}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Content - Permissions Grid */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
          {activeModule ? (
            <>
              {/* Content Header & Toolbar */}
              <div className="flex-shrink-0 px-8 py-5 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-20 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-3">
                      {activeModule}
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                        {activePermissions.filter(p => selectedIds.includes(p.id)).length} selected
                      </span>
                    </h3>
                  </div>
                  
                  <button
                    onClick={() => handleToggleGroup(activeModule)}
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                  >
                    {activePermissions.every(p => selectedIds.includes(p.id)) ? (
                      <>Unselect All</>
                    ) : (
                      <><Check className="w-4 h-4" /> Select All in Module</>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search permissions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button 
                      onClick={() => setFilterType('all')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setFilterType('granted')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'granted' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Granted
                    </button>
                    <button 
                      onClick={() => setFilterType('unassigned')}
                      className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'unassigned' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                      Unassigned
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
                {filteredPermissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 pb-20">
                    <Filter className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-1">No permissions found</p>
                    <p className="text-sm">Try adjusting your search or filters.</p>
                    {(searchQuery || filterType !== 'all') && (
                      <button 
                        onClick={() => { setSearchQuery(''); setFilterType('all'); }}
                        className="mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
                    {filteredPermissions.map((perm: any) => {
                      const isSelected = selectedIds.includes(perm.id);
                      return (
                        <label 
                          key={perm.id} 
                          className={`group flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${isSelected ? 'border-indigo-500 bg-indigo-50/80 shadow-md shadow-indigo-500/10 dark:border-indigo-500/60 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800/50 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                          <div className="pt-0.5">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-lg border-2 transition-all duration-300 ${isSelected ? 'bg-indigo-600 border-indigo-600 ring-4 ring-indigo-600/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-indigo-400'}`}>
                              {isSelected && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                            </div>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={isSelected}
                              onChange={() => handleToggle(perm.id)}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-base font-bold transition-colors ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300'}`} title={perm.name}>
                              {perm.name}
                            </div>
                            <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1 mb-2 tracking-tight bg-gray-100/50 dark:bg-gray-800/50 inline-block px-1.5 py-0.5 rounded">
                              {perm.code}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed" title={perm.description}>
                              {perm.description || perm.name}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a module to view permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 px-8 py-5 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-between z-10">
        <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          Total assigned: <span className="text-indigo-600 dark:text-indigo-400 text-base">{selectedIds.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
            className={`inline-flex items-center justify-center gap-2 px-8 py-2.5 text-sm font-bold text-white rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
              hasChanges && !updateMutation.isPending
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/30'
                : 'bg-gray-400 dark:bg-gray-700 cursor-not-allowed opacity-70'
            }`}
          >
            {updateMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Blueprint
          </button>
        </div>
      </div>
    </div>
  );
}
