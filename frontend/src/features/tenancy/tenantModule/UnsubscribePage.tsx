// yss_orbit\frontend\src\modules\tenantModule\pages\UnsubscribePage.tsx
import React from 'react';

export const UnsubscribePage: React.FC = () => {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Cancel Subscription</h1>
      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <h3 className="text-red-800 font-bold text-lg mb-2">Are you sure?</h3>
        <p className="text-red-600 mb-6 text-sm">Canceling your subscription will restrict your access to all premium modules at the end of your current billing cycle.</p>
        <div className="flex justify-end gap-4">
          <button className="px-4 py-2 text-gray-600 font-medium">Keep My Plan</button>
          <button className="bg-red-600 text-white px-4 py-2 rounded font-medium">Confirm Cancellation</button>
        </div>
      </div>
    </div>
  );
};
