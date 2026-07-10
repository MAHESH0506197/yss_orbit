import { useTranslation } from 'react-i18next';
import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AttendanceRecord } from '@/features/hrms/types/attendanceTypes';
import { useRequestCorrection } from '@/features/hrms/api/useAttendance';
import { Clock, AlertCircle } from 'lucide-react';

import { formatIST } from '@/utils/date';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
}

export function AttendanceCorrectionModal({ open, onOpenChange, record }: Props) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [requestedInTime, setRequestedInTime] = useState(record?.actual_in ? formatIST(record.actual_in, 'HH:mm') : '');
  const [requestedOutTime, setRequestedOutTime] = useState(record?.actual_out ? formatIST(record.actual_out, 'HH:mm') : '');

  const { mutate: requestCorrection, isPending } = useRequestCorrection();

  if (!record) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert HH:mm to full ISO datetime using the record's date
    const dateStr = record.attendance_date;
    const inTimeIso = requestedInTime ? new Date(`${dateStr}T${requestedInTime}:00`).toISOString() : undefined;
    const outTimeIso = requestedOutTime ? new Date(`${dateStr}T${requestedOutTime}:00`).toISOString() : undefined;

    requestCorrection(
      { record: record.id, reason, requested_in_time: inTimeIso, requested_out_time: outTimeIso },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
        }
      }
    );
  };

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('auto.attendance_correction', 'Attendance Correction')}</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          {t('auto.submit_an_adjustment_request_for', 'Submit an adjustment request for')} {record.employee_name} {t('auto.on', 'on')} {formatIST(record.attendance_date, 'dd MMM yyyy')}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.actual_in_time', 'Actual In Time')}</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={requestedInTime}
                  onChange={(e) => setRequestedInTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.actual_out_time', 'Actual Out Time')}</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="time"
                  value={requestedOutTime}
                  onChange={(e) => setRequestedOutTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('auto.reason_for_correction', 'Reason for Correction')} <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('auto.e_g_biometric_failure_forgot_to_punch_etc', 'E.g., Biometric failure, forgot to punch, etc.')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg flex items-start gap-3 border border-amber-200 dark:border-amber-800/30">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-400">
              {t('auto.this_request_will_be_audited_depending_on_your_rol', 'This request will be audited. Depending on your role, it will either be pending approval or auto-approved.')}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {t('auto.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isPending || !reason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              {isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
