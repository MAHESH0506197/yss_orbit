// yss_orbit\frontend\src\features\moduleRegistry\components\ModuleCard.tsx
import React from 'react';
import { ModuleregistryDto } from '../api/moduleRegistryApi';

export const ModuleCard: React.FC<{ module: ModuleregistryDto, onToggle?: (id: any, active: boolean) => void }> = ({ module, onToggle }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-800">{module.name}</h3>
          <p className="text-xs text-gray-500 font-mono">{module.category}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${module.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
          {module.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">{module.description}</p>
      {onToggle && (
        <button 
          onClick={() => onToggle(module.id, !module.is_active)}
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${module.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-[var(--primary-color)] text-white hover:opacity-90'}`}
        >
          {module.is_active ? 'Deactivate Module' : 'Activate Module'}
        </button>
      )}
    </div>
  );
};
