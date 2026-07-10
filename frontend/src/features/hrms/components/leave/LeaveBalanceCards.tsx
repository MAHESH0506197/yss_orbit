import { useTranslation } from 'react-i18next';
import React from 'react';
import { useLeaveBalances } from '../../api/useLeave';
import { useAuthStore } from '@/store/authStore';

export const LeaveBalanceCards: React.FC = () => {
  const { t } = useTranslation();
  const userId = useAuthStore(state => state.userId);
  // We'll hardcode 2026 for now, or dynamically get current year
  const currentYear = new Date().getFullYear();
  const { data: response, isLoading } = useLeaveBalances(userId || '', currentYear);

  if (isLoading) {
    return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
      <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
      <div className="h-24 bg-gray-100 rounded-xl animate-pulse"></div>
    </div>;
  }

  const balances = response?.data || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {balances.map((balance: any) => (
        <div key={balance.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: balance.leave_type_color }}></span>
              {balance.leave_type_name}
            </h3>
            <span className="text-2xl font-bold text-gray-900">{balance.closing_balance}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
            <span>{t('auto.total', 'Total:')} {balance.opening_balance}</span>
            <span>{t('auto.used', 'Used:')} {balance.consumed_days}</span>
          </div>
        </div>
      ))}
      {balances.length === 0 && (
        <div className="col-span-full py-8 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          {t('auto.no_leave_balances_allocated_for', 'No leave balances allocated for')} {currentYear}.
        </div>
      )}
    </div>
  );
};
