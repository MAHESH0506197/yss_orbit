// yss_orbit\frontend\src\modules\moduleRegistry\components\DependencyGraph.tsx
import React from 'react';

export const DependencyGraph: React.FC<{ dependencies: any[] }> = ({ dependencies }) => {
  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
      <p className="text-gray-500 text-center">Interactive Dependency Graph Visualization<br/><span className="text-sm">(Placeholder for React Flow or D3.js)</span></p>
    </div>
  );
};
