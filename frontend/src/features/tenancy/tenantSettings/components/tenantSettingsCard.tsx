// yss_orbit\frontend\src\modules\tenantSettings\components\tenantSettingsCard.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

export const TenantSettingsCard: React.FC<{ title: string, description: string, onClick: () => void }> = ({ title, description, onClick }) => {
  return (
    <div 
      onClick={onClick} 
      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer dark:border-gray-800 dark:bg-gray-950 dark:hover:shadow-gray-900/50"
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-indigo-50 to-violet-50 opacity-50 blur-2xl group-hover:opacity-100 transition-opacity dark:from-indigo-900/20 dark:to-violet-900/20" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors dark:bg-gray-900 dark:group-hover:bg-indigo-500/20 dark:group-hover:text-indigo-400">
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};
