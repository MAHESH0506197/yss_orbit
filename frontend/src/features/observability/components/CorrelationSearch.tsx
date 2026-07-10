// yss_orbit\frontend\src\modules\observability\components\CorrelationSearch.tsx
import React, { useState } from 'react';

export const CorrelationSearch: React.FC<{ onSearch: (id: string) => void }> = ({ onSearch }) => {
  const [correlationId, setCorrelationId] = useState('');

  return (
    <div className="flex space-x-2">
      <input 
        type="text" 
        placeholder="Enter Correlation ID..." 
        value={correlationId}
        onChange={e => setCorrelationId(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-2 flex-grow focus:outline-none focus:border-blue-500"
      />
      <button 
        onClick={() => onSearch(correlationId)}
        className="bg-[var(--primary-color)] text-white px-4 py-2 rounded-md font-medium"
      >
        Search Traces
      </button>
    </div>
  );
};
