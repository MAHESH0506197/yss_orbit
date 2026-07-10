// yss_orbit\frontend\src\modules\tenantModule\pages\SubscribePage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

export const SubscribePage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Checkout & Subscribe</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="mb-4">You are subscribing to plan ID: {id}</p>
        <div className="bg-gray-50 p-4 border rounded mb-6 text-sm text-gray-600">
          Billing form placeholder (Credit Card / Stripe Element)
        </div>
        <button className="bg-[var(--primary-color)] text-white px-6 py-3 rounded-lg font-bold w-full">Complete Purchase</button>
      </div>
    </div>
  );
};
