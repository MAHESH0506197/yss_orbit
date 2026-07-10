import React, { useState } from 'react';
import { ShieldCheck, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSubscriptionPlans, useChangeBusinessUnitPlan } from '@/features/tenancy/subscription/hooks/useSubscription';
import { useTenantContext } from '@/store/context/TenantContext';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId?: string;
}

export const SubscriptionPlanModal = ({ isOpen, onClose, currentPlanId }: SubscriptionPlanModalProps) => {
  const { businessUnit } = useTenantContext();
  const { data: plansResponse, isLoading } = useSubscriptionPlans();
  const changePlan = useChangeBusinessUnitPlan(businessUnit?.id);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

  if (!isOpen) return null;

  const plans = plansResponse?.data || [];

  const handleSelectPlan = async (planId: string) => {
    try {
      await changePlan.mutateAsync({ planId, billingCycle });
      onClose();
    } catch (err) {
      console.error("Failed to change plan", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-800">
        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign Plan</h2>
              <p className="text-sm text-gray-500 mt-1">Select a subscription plan for {businessUnit?.name}</p>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-lg flex inline-flex">
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${billingCycle === 'MONTHLY' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setBillingCycle('MONTHLY')}
              >
                Monthly billing
              </button>
              <button 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${billingCycle === 'YEARLY' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                onClick={() => setBillingCycle('YEARLY')}
              >
                Yearly billing <span className="ml-1 text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">Save 20%</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan: any) => {
                const isCurrent = plan.id === currentPlanId;
                const price = billingCycle === 'MONTHLY' ? plan.price_monthly : plan.price_yearly;
                
                return (
                  <div key={plan.id} className={`relative p-6 rounded-2xl border ${isCurrent ? 'border-violet-500 ring-1 ring-violet-500 bg-violet-50/50 dark:bg-violet-900/10' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'}`}>
                    {plan.is_featured && (
                      <div className="absolute -top-3 left-0 right-0 flex justify-center">
                        <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <Zap className="w-3 h-3" /> Most Popular
                        </span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                    <p className="text-sm text-gray-500 mt-2 h-10">{plan.description}</p>
                    
                    <div className="my-6">
                      <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.currency === 'USD' ? '$' : '₹'}{price}</span>
                      <span className="text-gray-500">/{billingCycle === 'MONTHLY' ? 'mo' : 'yr'}</span>
                    </div>

                    <Button 
                      variant={isCurrent ? "outline" : plan.is_featured ? "primary" : "outline"} 
                      className={`w-full mb-6 ${plan.is_featured && !isCurrent ? 'bg-gradient-to-r from-violet-600 to-purple-600' : ''}`}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isCurrent || changePlan.isPending}
                    >
                      {isCurrent ? 'Current Plan' : changePlan.isPending ? 'Assigning...' : 'Assign Plan'}
                    </Button>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-4 h-4 text-violet-500" />
                        <span>Up to <strong>{plan.max_users}</strong> users</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-4 h-4 text-violet-500" />
                        <span><strong>{plan.max_storage_gb}GB</strong> storage</span>
                      </div>
                      {plan.modules?.slice(0, 4).map((mod: any) => (
                        <div key={mod.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check className="w-4 h-4 text-violet-500" />
                          <span>{mod.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
