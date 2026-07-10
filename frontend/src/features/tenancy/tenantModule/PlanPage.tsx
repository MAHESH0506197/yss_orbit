// yss_orbit\frontend\src\modules\tenantModule\pages\PlanPage.tsx
import React from 'react';
import { PlanCard } from '@/features/tenancy/tenantModule/components/PlanCard';

export const PlanPage: React.FC = () => {
  const plans = [
    { id: '1', name: 'Starter', price: 49, features: ['Up to 5 Users', 'Basic HRMS', 'Standard Support'] },
    { id: '2', name: 'Professional', price: 149, features: ['Up to 50 Users', 'Full Suite', 'Priority Support', 'Advanced Analytics'] },
    { id: '3', name: 'Enterprise', price: 499, features: ['Unlimited Users', 'Custom Integrations', 'Dedicated Account Manager'] }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-center text-gray-900">Choose Your Plan</h1>
      <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">Scale your operations seamlessly with our flexible pricing plans tailored to businesses of all sizes.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} onSelect={(id) => console.log('Select', id)} />
        ))}
      </div>
    </div>
  );
};
