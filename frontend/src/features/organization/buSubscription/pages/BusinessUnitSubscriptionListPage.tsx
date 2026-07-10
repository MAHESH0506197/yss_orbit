import React from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/platform/EmptyState';
import { CreditCard, Building2, GitBranch } from 'lucide-react';

export default function BusinessUnitSubscriptionListPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 pb-16">
      <PageHeader 
        title="BU-Subscription Mapping" 
        subtitle="Assign and manage subscriptions for business units." 
        icon={Building2} 
      />
      <EmptyState
        icon={GitBranch}
        title="No Subscriptions Found"
        description="This business unit has no active subscriptions."
      />
    </div>
  );
}
