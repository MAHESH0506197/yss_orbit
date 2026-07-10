import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\leave\components\ApplyLeaveModal.tsx
import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { useApplyLeave } from '../api';
import { LeaveType } from '../types';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApplyLeaveModal: React.FC<ApplyLeaveModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { mutate: applyLeave, isPending } = useApplyLeave();
  
  const [type, setType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyLeave(
      { type, startDate, endDate, reason },
      {
        onSuccess: () => {
          onClose();
          setType('annual');
          setStartDate('');
          setEndDate('');
          setReason('');
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('auto.apply_for_leave', 'Apply for Leave')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('auto.leave_type', 'Leave Type')}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as LeaveType)}
            className="w-full p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
            required
          >
            <option value="annual">{t('auto.annual_leave', 'Annual Leave')}</option>
            <option value="sick">{t('auto.sick_leave', 'Sick Leave')}</option>
            <option value="maternity">{t('auto.maternity_leave', 'Maternity Leave')}</option>
            <option value="unpaid">{t('auto.unpaid_leave', 'Unpaid Leave')}</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('auto.start_date', 'Start Date')}</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('auto.end_date', 'End Date')}</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('auto.reason', 'Reason')}</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] min-h-[100px]"
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors font-medium"
            disabled={isPending}
          >
            {t('auto.cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
          >
            {isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
