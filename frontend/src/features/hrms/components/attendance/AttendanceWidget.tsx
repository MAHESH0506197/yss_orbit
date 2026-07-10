import { useTranslation } from 'react-i18next';

import { useMyAttendance, usePunch } from '../../api/useAttendance';
import { Clock, CheckCircle2, Play, Square, Loader2, CalendarX2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatIST } from '@/utils/date';

export function AttendanceWidget() {
  const { t } = useTranslation();
  const buId = useAuthStore(state => state.selectedBusinessUnitId);
  const { data: record, isLoading: isQueryLoading } = useMyAttendance();
  const { mutate: punch, isPending } = usePunch();

  const isLoading = isQueryLoading || !buId;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // If useMyAttendance explicitly returned null (caught 404), they are not an employee
  if (record === null) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden text-center min-h-[200px] flex flex-col items-center justify-center">
        <CalendarX2 className="w-10 h-10 text-gray-300 mb-3" />
        <h3 className="text-lg font-semibold text-gray-900">{t('auto.attendance_unavailable', 'Attendance Unavailable')}</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-xs">
          {t('auto.you_do_not_have_an_active_employee_profile_in_the_', 'You do not have an active employee profile in the selected Business Unit.')}
        </p>
      </div>
    );
  }

  const hasRecord = record && record.id;
  const isPunchedIn = hasRecord && record.actual_in && !record.actual_out;
  const isPunchedOut = hasRecord && record.actual_in && record.actual_out;
  
  const statusColors: Record<string, string> = {
    PRESENT: 'bg-green-100 text-green-800',
    LATE: 'bg-yellow-100 text-yellow-800',
    ABSENT: 'bg-red-100 text-red-800',
    HALF_DAY: 'bg-orange-100 text-orange-800',
    MISSED_PUNCH: 'bg-gray-100 text-gray-800'
  };

  const statusColor = (hasRecord && statusColors[record.status]) || 'bg-gray-100 text-gray-500';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50 rounded-full opacity-50 pointer-events-none" />
      
      <div className="relative">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          {t('auto.today_s_attendance', 'Today\'s Attendance')}
        </h3>
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">{t('auto.status', 'Status')}</p>
            {hasRecord ? (
              <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                {record.status}
              </span>
            ) : (
              <span className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {t('auto.not_punched_in', 'Not Punched In')}
              </span>
            )}
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-500">{t('auto.working_hours', 'Working Hours')}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {hasRecord ? `${Math.floor(parseFloat(record.work_hours))}h ${Math.round((parseFloat(record.work_hours) % 1) * 60)}m` : '0h 0m'}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between text-sm">
          <div>
            <p className="text-gray-500">{t('auto.first_in', 'First In')}</p>
            <p className="font-medium text-gray-900 mt-0.5">
              {hasRecord && record.actual_in ? formatIST(record.actual_in, 'hh:mm a') : '--'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">{t('auto.last_out', 'Last Out')}</p>
            <p className="font-medium text-gray-900 mt-0.5">
              {isPunchedOut ? formatIST(record.actual_out!, 'hh:mm a') : '--'}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => punch('WEB')}
            disabled={isPending || record?.is_locked || !buId}
            className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all
              ${(record?.is_locked || !buId) ? 'bg-gray-300 cursor-not-allowed' :
                isPunchedIn 
                  ? 'bg-red-600 hover:bg-red-500 focus-visible:outline-red-600' 
                  : 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600'
              }
            `}
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPunchedIn ? (
              <>
                <Square className="w-5 h-5 fill-current" />
                {t('auto.punch_out', 'Punch Out')}
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                {t('auto.punch_in', 'Punch In')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
