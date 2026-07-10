// yss_orbit\frontend\src\features\tenantModule\components\tenantModuleCard.tsx
import React from 'react';
import { Layers } from 'lucide-react';
import { BusinessUnitModuleDto } from '../api/tenantModuleApi';

export const TenantModuleCard: React.FC<{ 
  module: BusinessUnitModuleDto;
  onToggle?: (moduleCode: string, isActive: boolean) => void;
}> = ({ module, onToggle }) => {
  const isModuleActive = module.is_active;
  const platformModule = module.module;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-gray-800 dark:bg-gray-950 dark:hover:shadow-gray-900/50">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 opacity-50 blur-2xl group-hover:opacity-100 transition-opacity dark:from-indigo-900/20 dark:to-violet-900/20" />
      <div className="relative flex justify-between items-start gap-4">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors dark:bg-gray-900 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{platformModule.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{platformModule.description || 'No description provided.'}</p>
          </div>
        </div>
        <div>
          <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ring-1 ${
            isModuleActive 
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:ring-emerald-800/50' 
              : 'bg-gray-50 text-gray-700 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
          }`}>
            {isModuleActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      {onToggle && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            onClick={() => onToggle(platformModule.code, !isModuleActive)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-950 ${
              isModuleActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100 focus:ring-red-500 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600'
            }`}
          >
            {isModuleActive ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
      )}
    </div>
  );
};
