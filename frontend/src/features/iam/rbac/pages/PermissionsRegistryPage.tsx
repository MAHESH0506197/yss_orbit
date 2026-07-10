import React, { useMemo, useState } from 'react';
import { usePermissions } from '@/features/iam/rbac/hooks/useRoles';
import { Shield, Search, Info } from 'lucide-react';
import { PermissionGate } from '@/components/auth/PermissionGate';

export function PermissionsRegistryPage() {
  const { data: permissions = [], isLoading } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  // Derive unique modules
  const modules = useMemo(() => {
    const mods = new Set<string>();
    permissions.forEach(p => {
      if (p.module) mods.add(p.module);
    });
    return Array.from(mods).sort();
  }, [permissions]);

  // Filter
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = selectedModule === 'all' || p.module === selectedModule;
      return matchesSearch && matchesModule;
    });
  }, [permissions, searchTerm, selectedModule]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-500" />
            Permissions Registry
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Global catalog of all system permissions seeded from code (B07 §5.18). Read-only view.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={selectedModule}
            onChange={e => setSelectedModule(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Modules</option>
            {modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-700 dark:text-gray-200 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-semibold">Permission Key</th>
                <th className="px-6 py-4 font-semibold">Module</th>
                <th className="px-6 py-4 font-semibold">Name & Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    Loading registry...
                  </td>
                </tr>
              ) : filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Info className="w-8 h-8 text-gray-400 mb-2" />
                    <p>No permissions match your search.</p>
                  </td>
                </tr>
              ) : (
                filteredPermissions.map(perm => (
                  <tr key={perm.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group">
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => copyToClipboard(perm.code)}
                        className="font-mono text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Click to copy"
                      >
                        {perm.code}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {perm.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {perm.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-md truncate" title={perm.description}>
                        {perm.description || 'No description provided'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PermissionsRegistryPage;
