import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\leave\pages\LeavePage.tsx
import React, { useState } from 'react';
import { useLeaves } from '@/features/leave/api';
import { LeaveTable } from '@/features/leave/components/LeaveTable';
import { ApplyLeaveModal } from '@/features/leave/components/ApplyLeaveModal';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { LeaveStatus } from '@/features/leave/types';

export const LeavePage: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<LeaveStatus>('pending');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  const { data: leaves, isLoading, error, refetch } = useLeaves(activeTab);

  const tabs: { label: string; value: LeaveStatus }[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto min-h-screen bg-[var(--color-background)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">{t('auto.leave_management', 'Leave Management')}</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">{t('auto.manage_employee_leave_requests_across_the_business', 'Manage employee leave requests across the Business Unit.')}</p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap"
        >
          {t('auto.apply_for_leave', 'Apply for Leave')}
        </button>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="flex border-b border-[var(--color-border)] px-2 sm:px-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 sm:px-6 py-4 font-medium text-sm transition-colors relative whitespace-nowrap ${
                activeTab === tab.value
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.value && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState error={error as Error} onRetry={() => refetch()} />
            </div>
          ) : leaves && leaves.length > 0 ? (
            <LeaveTable leaves={leaves} />
          ) : (
            <div className="p-12 text-center text-[var(--color-text-secondary)]">
              {t('auto.no', 'No')} {activeTab} {t('auto.leave_requests_found', 'leave requests found.')}
            </div>
          )}
        </div>
      </div>

      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
      />
    </div>
  );
};

// Default export if required for React.lazy
export default LeavePage;
