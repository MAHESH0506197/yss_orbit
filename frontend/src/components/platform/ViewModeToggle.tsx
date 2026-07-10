import React from 'react';
import { LayoutGrid, List, Maximize2, Minimize2 } from 'lucide-react';
import { ViewMode, Density } from '@/hooks/useViewMode';

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  density?: Density;
  setDensity?: (density: Density) => void;
}

export const ViewModeToggle: React.FC<Props> = ({ viewMode, setViewMode, density, setDensity }) => {
  return (
    <div className="flex items-center gap-2">
      {/* Density Toggle (only shown in grid mode) */}
      {viewMode === 'grid' && density && setDensity && (
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
          <button 
            onClick={() => setDensity('comfortable')} 
            className={`rounded-lg p-1.5 transition-all ${
              density === 'comfortable' 
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm' 
                : 'text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
            title="Comfortable Density"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setDensity('compact')} 
            className={`rounded-lg p-1.5 transition-all ${
              density === 'compact' 
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm' 
                : 'text-gray-400 hover:bg-white dark:hover:bg-gray-700'
            }`}
            title="Compact Density"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-1">
      <button 
        onClick={() => setViewMode('grid')} 
        className={`rounded-lg p-1.5 transition-all ${
          viewMode === 'grid' 
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm' 
            : 'text-gray-400 hover:bg-white dark:hover:bg-gray-700'
        }`}
        title="Grid View"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button 
        onClick={() => setViewMode('table')} 
        className={`rounded-lg p-1.5 transition-all ${
          viewMode === 'table' 
            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-sm' 
            : 'text-gray-400 hover:bg-white dark:hover:bg-gray-700'
        }`}
        title="List View"
      >
        <List className="h-4 w-4" />
      </button>
      </div>
    </div>
  );
};
