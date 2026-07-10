// yss_orbit\frontend\src\modules\tenantModule\components\SubscriptionStatus.tsx
import React from 'react';
import { CreditCard, Calendar } from 'lucide-react';
import { formatIST } from '@/utils/date';

export const SubscriptionStatus: React.FC<{ subscription: any }> = ({ subscription }) => {
  if (!subscription) return null;

  return (
    <div className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
              {subscription.planName}
            </h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {subscription.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:items-end gap-1 bg-white/50 dark:bg-gray-900/50 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-900 dark:text-indigo-200">
            <span className="text-indigo-500 dark:text-indigo-400">Billing Cycle:</span>
            {subscription.billingCycle}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300">
            <Calendar className="h-3.5 w-3.5" />
            Next Invoice: {formatIST(new Date(subscription.nextBillingDate), 'PPP')}
          </div>
        </div>
      </div>
    </div>
  );
};
