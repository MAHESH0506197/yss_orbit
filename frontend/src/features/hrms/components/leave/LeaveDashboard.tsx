import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { LeaveBalanceCards } from './LeaveBalanceCards';
import { LeaveHistoryTable } from './LeaveHistoryTable';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import { apiClient as client } from '@/api/client';
import { useQuery } from '@tanstack/react-query';

export const LeaveDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // We fetch leave types here to pass to the apply modal
  const { data: typesResponse } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const res = await client.get('/hrms/leave/types/');
      return res.data;
    }
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('auto.leave_management', 'Leave Management')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auto.view_your_balances_and_apply_for_time_off', 'View your balances and apply for time off')}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          {t('auto.apply_leave', 'Apply Leave')}
        </button>
      </div>

      <LeaveBalanceCards />
      
      <LeaveHistoryTable />

      <ApplyLeaveModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        leaveTypes={typesResponse?.data || []}
      />
    </div>
  );
};
