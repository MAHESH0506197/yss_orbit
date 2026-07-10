import { useTranslation } from 'react-i18next';
import React from 'react';
import { useLeaveRequests } from '../../api/useLeave';
import { useAuthStore } from '@/store/authStore';

export const LeaveHistoryTable: React.FC = () => {
  const { t } = useTranslation();
  const userId = useAuthStore(state => state.userId);
  const { data: response, isLoading } = useLeaveRequests(userId || undefined);

  if (isLoading) {
    return <div className="h-48 bg-gray-50 rounded-xl animate-pulse mt-6"></div>;
  }

  const requests = response?.data || [];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
      case 'REJECTED': return 'bg-red-50 text-red-700 ring-red-600/20';
      case 'CANCELLED': 
      case 'WITHDRAWN': return 'bg-gray-50 text-gray-700 ring-gray-600/20';
      default: return 'bg-amber-50 text-amber-700 ring-amber-600/20';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{t('auto.my_leave_requests', 'My Leave Requests')}</h2>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {t('auto.you_have_no_leave_requests', 'You have no leave requests.')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 font-medium">{t('auto.leave_type', 'Leave Type')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.dates', 'Dates')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.session', 'Session')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.reason', 'Reason')}</th>
                <th className="px-6 py-4 font-medium">{t('auto.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((req: any) => (
                <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{req.leave_type_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {req.start_date === req.end_date 
                      ? req.start_date 
                      : `${req.start_date} to ${req.end_date}`}
                  </td>
                  <td className="px-6 py-4">
                    {req.session === 'FULL_DAY' ? 'Full Day' : 
                     req.session === 'FIRST_HALF' ? '1st Half' : '2nd Half'}
                  </td>
                  <td className="px-6 py-4 max-w-xs truncate">{req.reason}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(req.status)}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
