import { useTranslation } from 'react-i18next';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient as client } from '@/api/client';
import { Plus, Settings2, CalendarOff, Users } from 'lucide-react';

export const LeaveSettingsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { data: typesResponse, isLoading } = useQuery({
    queryKey: ['leaveTypes'],
    queryFn: async () => {
      const res = await client.get('/hrms/leave/types/');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">{t('auto.loading_settings', 'Loading settings...')}</div>;
  }

  const leaveTypes = typesResponse?.data || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('auto.leave_administration', 'Leave Administration')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auto.configure_leave_policies_types_and_blackout_dates', 'Configure leave policies, types, and blackout dates')}</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-700 transition-all">
          <Plus className="w-4 h-4" />
          {t('auto.create_leave_type', 'Create Leave Type')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-indigo-100 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('auto.leave_policies', 'Leave Policies')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('auto.manage_global_assignment_rules_and_accrual_schedul', 'Manage global assignment rules and accrual schedules.')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-amber-100 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <CalendarOff className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('auto.restriction_windows', 'Restriction Windows')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('auto.configure_blackout_dates_during_financial_close', 'Configure blackout dates during financial close.')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 hover:border-emerald-100 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{t('auto.balance_adjustments', 'Balance Adjustments')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('auto.manually_adjust_or_encash_employee_leave_balances', 'Manually adjust or encash employee leave balances.')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('auto.active_leave_types', 'Active Leave Types')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">{t('auto.leave_type', 'Leave Type')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.code', 'Code')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.type', 'Type')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.accrual_rate', 'Accrual Rate')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.rules', 'Rules')}</th>
                <th className="px-6 py-4 font-medium text-right">{t('auto.actions', 'Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leaveTypes.map((type: any) => (
                <tr key={type.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }}></span>
                      <span className="font-medium text-gray-900">{type.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{type.code}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${type.is_paid ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                      {type.is_paid ? 'Paid' : (type.is_lop ? 'Loss of Pay' : 'Unpaid')}
                    </span>
                  </td>
                  <td className="px-6 py-4">{type.accrual_rate_per_month} {t('auto.month', '/ month')}</td>
                  <td className="px-6 py-4 text-xs space-y-1">
                    {type.allow_half_day && <div>{t('auto.allows_half_day', '• Allows Half Day')}</div>}
                    {type.allow_carry_forward && <div>{t('auto.carry_forward_max', '• Carry Forward (Max:')} {type.max_carry_forward})</div>}
                    {type.requires_attachment && <div>{t('auto.attachment_after', '• Attachment after')} {type.attachment_after_days} {t('auto.days', 'days')}</div>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-indigo-600 hover:text-indigo-900 font-medium">{t('auto.edit', 'Edit')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
