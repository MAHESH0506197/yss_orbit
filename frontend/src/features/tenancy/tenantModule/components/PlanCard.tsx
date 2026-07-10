// yss_orbit\frontend\src\modules\tenantModule\components\PlanCard.tsx
import React from 'react';

export const PlanCard: React.FC<{ plan: any, onSelect?: (id: string) => void }> = ({ plan, onSelect }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center flex flex-col h-full">
      <h3 className="font-bold text-xl text-gray-800 mb-2">{plan.name}</h3>
      <div className="text-3xl font-bold text-gray-900 mb-4">${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></div>
      <ul className="text-left space-y-2 mb-6 flex-grow text-sm text-gray-600">
        {plan.features?.map((feature: string, idx: number) => (
          <li key={idx} className="flex items-start">
            <span className="text-green-500 mr-2">✓</span> {feature}
          </li>
        ))}
      </ul>
      {onSelect && (
        <button 
          onClick={() => onSelect(plan.id)}
          className="w-full bg-[var(--primary-color)] text-white py-2 rounded font-medium hover:bg-opacity-90"
        >
          Select Plan
        </button>
      )}
    </div>
  );
};
