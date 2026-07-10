import { useTranslation } from 'react-i18next';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient as client } from '@/api/client';
import { useApproveLeave } from '../../api/useLeave';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { Check, X, AlertTriangle } from 'lucide-react';

export const TeamLeaveDashboard: React.FC = () => {
  const { t } = useTranslation();
  const userId = useAuthStore(state => state.userId);
  const approveMutation = useApproveLeave();

  // We should ideally fetch requests where manager_id = employeeId. For now, fetch all and filter or assume backend filters.
  const { data: response, isLoading } = useQuery({
    queryKey: ['teamLeaveRequests'],
    queryFn: async () => {
      const res = await client.get('/api/v1/hrms/leave/requests/');
      return res.data;
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">{t('auto.loading_team_requests', 'Loading team requests...')}</div>;
  }

  // Filter to pending for UI simplicity
  const allRequests = response?.data || [];
  const pendingRequests = allRequests.filter((r: any) => r.status === 'SUBMITTED');

  const handleApprove = async (id: string) => {
    if (!userId) return;
    try {
      await approveMutation.mutateAsync({ id, managerId: userId, comments: 'Approved via dashboard' });
      toast.success('Leave approved successfully');
    } catch (e: any) {
      toast.error(e.response?.data?.error?.details || 'Failed to approve leave');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('auto.team_approvals', 'Team Approvals')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('auto.review_and_approve_leave_requests_from_your_team', 'Review and approve leave requests from your team')}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">{t('auto.all_caught_up', 'All caught up!')}</h3>
            <p className="text-gray-500 mt-1">{t('auto.there_are_no_pending_leave_requests_to_review', 'There are no pending leave requests to review.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {pendingRequests.map((req: any) => (
              <div key={req.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-lg">
                      {/* Avatar placeholder */}
                      {req.employee.substring(0, 2).toUpperCase() || 'EMP'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{t('auto.employee_id', 'Employee ID:')} {req.employee}</h4>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span className="font-medium text-gray-700">{req.leave_type_name}</span>
                        <span>•</span>
                        <span>{req.start_date === req.end_date ? req.start_date : `${req.start_date} to ${req.end_date}`}</span>
                        <span>•</span>
                        <span>{req.session.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        "{req.reason}"
                      </p>

                      {/* Team Availability Warning Mockup */}
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 inline-flex">
                        <AlertTriangle className="w-4 h-4" />
                        <span><strong>{t('auto.warning', 'Warning:')}</strong> {t('auto.2_other_team_members_are_on_leave_during_this_peri', '2 other team members are on leave during this period. Capacity will be reduced to 70%.')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                      {t('auto.reject', 'Reject')}
                    </button>
                    <button 
                      onClick={() => handleApprove(req.id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {t('auto.approve', 'Approve')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
