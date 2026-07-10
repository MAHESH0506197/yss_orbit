import { useTranslation } from 'react-i18next';
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/Sheet';
import { AttendanceRecord, PunchSource } from '@/features/hrms/types/attendanceTypes';

import { Clock, Calendar, User, MapPin, Building, Briefcase, FileText, AlertCircle, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { formatIST } from '@/utils/date';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
}

export const AttendanceDetailsDrawer: React.FC<{ open: boolean; onOpenChange: (open: boolean) => void; record: any | null }> = ({ open, onOpenChange, record }) => {
  const { t } = useTranslation();
  if (!record) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[500px] sm:max-w-xl overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 p-0 flex flex-col h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-10 flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {t('auto.attendance_details', 'Attendance Details')}
                {record.is_locked && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    <Lock className="w-3 h-3" />
                    {t('auto.payroll_locked', 'Payroll Locked')}
                  </span>
                )}
              </SheetTitle>
              <SheetDescription className="text-sm mt-1 text-gray-500 dark:text-gray-400">
                {record.attendance_date ? formatIST(record.attendance_date, 'EEEE, dd MMMM yyyy') : '--'}
              </SheetDescription>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold shadow-sm
              ${record.status === 'PRESENT' ? 'bg-green-100 text-green-800 border border-green-200' :
                record.status === 'LATE' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                record.status === 'MISSED_PUNCH' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                record.status === 'ABSENT' ? 'bg-red-100 text-red-800 border border-red-200' :
                'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
              {record.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* 1. Employee Summary */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('auto.employee_profile', 'Employee Profile')}
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300 flex items-center justify-center font-bold text-xl">
                   {record.employee_name?.charAt(0) || 'E'}
                 </div>
                 <div>
                   <h4 className="text-base font-bold text-gray-900 dark:text-white">{record.employee_name}</h4>
                   <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                     <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5"/> {record.employee_code}</span>
                     <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5"/> {record.department_name}</span>
                   </div>
                 </div>
              </div>
            </section>

            {/* 2. Attendance Summary */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('auto.attendance_summary', 'Attendance Summary')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                   <p className="text-xs text-gray-500 font-medium">{t('auto.first_in', 'First In')}</p>
                   <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                     {record.actual_in ? formatIST(record.actual_in, 'hh:mm a') : '--:--'}
                   </p>
                 </div>
                 <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                   <p className="text-xs text-gray-500 font-medium">{t('auto.last_out', 'Last Out')}</p>
                   <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                     {record.actual_out ? formatIST(record.actual_out, 'hh:mm a') : '--:--'}
                   </p>
                 </div>
                 <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                   <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">{t('auto.work_hours', 'Work Hours')}</p>
                   <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mt-1">
                     {record.work_hours ? `${parseFloat(record.work_hours as unknown as string).toFixed(1)}h` : '0h'}
                   </p>
                 </div>
                 <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800/30">
                   <p className="text-xs text-red-600 dark:text-red-400 font-medium">{t('auto.late_early', 'Late/Early')}</p>
                   <p className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
                     {record.late_minutes ? `${record.late_minutes}m` : '0m'}
                   </p>
                 </div>
              </div>
            </section>

            {/* 3. Shift Details */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('auto.shift_details', 'Shift Details')}
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{record.shift_name || 'Standard Shift'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {record.scheduled_in ? record.scheduled_in.substring(0,5) : '09:00'} - {record.scheduled_out ? record.scheduled_out.substring(0,5) : '18:00'}
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Raw Punches */}
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('auto.raw_punches', 'Raw Punches')}
              </h3>
              {(!record.punches || record.punches.length === 0) ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border border-gray-100 dark:border-gray-700 text-center text-sm text-gray-500">
                  {t('auto.no_punches_recorded_for_this_day', 'No punches recorded for this day.')}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('auto.time', 'Time')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('auto.type', 'Type')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('auto.source', 'Source')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {record.punches.map((punch: any, index: number) => (
                        <tr key={punch.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                            {formatIST(punch.punch_time, 'hh:mm:ss a')}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${punch.punch_type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {punch.punch_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {punch.source}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* 5. Corrections & Audit Trail */}
            {(record as any).corrections && (record as any).corrections.length > 0 && (
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t('auto.corrections_audit_trail', 'Corrections & Audit Trail')}
                </h3>
                <div className="space-y-3">
                  {(record as any).corrections.map((corr: any) => (
                    <div key={corr.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm relative overflow-hidden">
                       <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                         corr.status === 'APPROVED' ? 'bg-green-500' : 
                         corr.status === 'REJECTED' ? 'bg-red-500' : 'bg-yellow-500'
                       }`} />
                       <div className="flex items-start justify-between">
                         <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                             {t('auto.correction_request', 'Correction Request')}
                             <span className={`text-xs px-2 py-0.5 rounded-full ${
                               corr.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                               corr.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                             }`}>
                               {corr.status}
                             </span>
                           </p>
                           <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                             <span className="font-medium text-gray-500 text-xs uppercase mr-2">{t('auto.reason', 'Reason:')}</span>
                             {corr.reason}
                           </p>
                         </div>
                       </div>
                       <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-4 text-xs text-gray-500">
                         <div>
                           <p>{t('auto.requested_by', 'Requested By:')} <span className="font-medium text-gray-900 dark:text-gray-300">{corr.requested_by_name}</span></p>
                           <p>{t('auto.date', 'Date:')} {formatIST(corr.created_at, 'dd MMM yyyy, hh:mm a')}</p>
                         </div>
                         {corr.status === 'APPROVED' && (
                           <div>
                             <p>{t('auto.approved_by', 'Approved By:')} <span className="font-medium text-gray-900 dark:text-gray-300">{corr.approved_by_name || 'System Admin'}</span></p>
                             <p>{t('auto.date', 'Date:')} {corr.approved_at ? formatIST(corr.approved_at, 'dd MMM yyyy, hh:mm a') : '--'}</p>
                           </div>
                         )}
                       </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Future Payroll Readiness Placeholder */}
            <section className="space-y-4 opacity-50 pointer-events-none">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {t('auto.payroll_impact_upcoming', 'Payroll Impact (Upcoming)')}
              </h3>
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{t('auto.lop_impact', 'LOP Impact')}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{t('auto.0_days', '0 Days')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{t('auto.late_penalty', 'Late Penalty')}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">₹0.00</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{t('auto.overtime', 'Overtime')}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{t('auto.0_hrs', '0 Hrs')}</p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
