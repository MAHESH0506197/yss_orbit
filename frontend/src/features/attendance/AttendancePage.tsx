import { useTranslation } from 'react-i18next';
﻿// yss_orbit\frontend\src\features\attendance\pages\AttendancePage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendance, getAttendanceSummary, checkIn, checkOut } from '@/features/attendance/api';
import { SummaryCards } from '@/features/attendance/components/SummaryCards';
import { Button } from '@/components/common/Button';
import { AnyPermissionGate } from '../.././components/auth/PermissionGate';

export default function AttendancePage() {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!);
  const queryClient = useQueryClient();

  const { data: attendance, isLoading: isAttendanceLoading, isError: isAttendanceError, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance', date],
    queryFn: () => getAttendance(date),
  });

  const { data: summary, isLoading: isSummaryLoading, isError: isSummaryError, refetch: refetchSummary } = useQuery({
    queryKey: ['attendanceSummary', date],
    queryFn: () => getAttendanceSummary(date),
  });

  const checkInMutation = useMutation({
    mutationFn: checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value);
  };

  const handleRetry = () => {
    refetchAttendance();
    refetchSummary();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('auto.daily_attendance', 'Daily Attendance')}</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">{t('auto.monitor_employee_presence_check_ins_and_leave_stat', 'Monitor employee presence, check-ins, and leave status.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[var(--color-text)]">{t('auto.date', 'Date:')}</label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] shadow-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {(isSummaryError || isAttendanceError) ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-danger)] p-6 rounded-lg text-center space-y-4">
          <p className="text-[var(--color-danger)]">{t('auto.failed_to_load_attendance_data_please_check_your_c', 'Failed to load attendance data. Please check your connection and try again.')}</p>
          <Button onClick={handleRetry} variant="outline">{t('auto.retry_loading_data', 'Retry Loading Data')}</Button>
        </div>
      ) : (
        <>
          <SummaryCards summary={summary || { present: 0, absent: 0, onLeave: 0, halfDay: 0, total: 0 }} isLoading={isSummaryLoading} />

          <div className="bg-[var(--color-surface)] shadow-sm rounded-lg border border-[var(--color-border)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] flex justify-between items-center bg-[var(--color-surface-hover)]">
              <h2 className="text-lg font-medium text-[var(--color-text)]">{t('auto.employee_logs', 'Employee Logs')}</h2>
            </div>
            
            {isAttendanceLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-[var(--color-surface-hover)] rounded w-3/4"></div>
                      <div className="h-4 bg-[var(--color-surface-hover)] rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden">
                  {attendance?.length === 0 ? (
                    <div className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                      {isAttendanceError ? "You do not have permission to view attendance records." : "No attendance records found for this date."}
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border)]">
                      {attendance?.map((record) => (
                        <div key={record.id} className="p-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <div className="h-10 w-10 flex-shrink-0 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] flex items-center justify-center rounded-full font-bold text-sm">
                                {record.employeeName.charAt(0)}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-[var(--color-text)]">{record.employeeName}</div>
                                <div className="text-xs text-[var(--color-text-muted)]">{record.employeeId}</div>
                              </div>
                            </div>
                            <div>
                              {record.status === 'present' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-bg,rgba(34,197,94,0.1))] text-[var(--color-success,rgb(21,128,61))]">{t('auto.present', 'Present')}</span>}
                              {record.status === 'absent' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-danger-bg,rgba(239,68,68,0.1))] text-[var(--color-danger,rgb(185,28,28))]">{t('auto.absent', 'Absent')}</span>}
                              {record.status === 'on_leave' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-bg,rgba(234,179,8,0.1))] text-[var(--color-warning,rgb(161,98,7))]">{t('auto.on_leave', 'On Leave')}</span>}
                              {record.status === 'half_day' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-info-bg,rgba(59,130,246,0.1))] text-[var(--color-info,rgb(29,78,216))]">{t('auto.half_day', 'Half Day')}</span>}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm text-[var(--color-text-muted)] mt-3">
                            <div><span className="font-medium text-[var(--color-text)]">{t('auto.in', 'In:')}</span> {record.checkIn || '--:--'}</div>
                            <div><span className="font-medium text-[var(--color-text)]">{t('auto.out', 'Out:')}</span> {record.checkOut || '--:--'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--color-border)]">
                    <thead className="bg-[var(--color-surface-hover)]">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('auto.employee', 'Employee')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('auto.business_unit', 'Business Unit')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('auto.check_in', 'Check In')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('auto.check_out', 'Check Out')}</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('auto.status', 'Status')}</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{t('auto.actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--color-surface)] divide-y divide-[var(--color-border)]">
                      {attendance?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-[var(--color-text-muted)]">
                            {isAttendanceError ? "You do not have permission to view attendance records." : "No attendance records found for this date."}
                          </td>
                        </tr>
                      ) : (
                        attendance?.map((record) => (
                          <tr key={record.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 flex-shrink-0 bg-[var(--color-secondary)] text-[var(--color-on-secondary)] flex items-center justify-center rounded-full font-bold text-xs">
                                  {record.employeeName.charAt(0)}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-[var(--color-text)]">{record.employeeName}</div>
                                  <div className="text-xs text-[var(--color-text-muted)]">{record.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-muted)]">
                              {record.businessUnit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                              {record.checkIn ? record.checkIn : <span className="text-[var(--color-text-muted)] italic">--:--</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text)]">
                              {record.checkOut ? record.checkOut : <span className="text-[var(--color-text-muted)] italic">--:--</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.status === 'present' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-success-bg,rgba(34,197,94,0.1))] text-[var(--color-success,rgb(21,128,61))]">{t('auto.present', 'Present')}</span>}
                              {record.status === 'absent' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-danger-bg,rgba(239,68,68,0.1))] text-[var(--color-danger,rgb(185,28,28))]">{t('auto.absent', 'Absent')}</span>}
                              {record.status === 'on_leave' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-warning-bg,rgba(234,179,8,0.1))] text-[var(--color-warning,rgb(161,98,7))]">{t('auto.on_leave', 'On Leave')}</span>}
                              {record.status === 'half_day' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-info-bg,rgba(59,130,246,0.1))] text-[var(--color-info,rgb(29,78,216))]">{t('auto.half_day', 'Half Day')}</span>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              <AnyPermissionGate permissions={['hrms.attendance.manage']}>
                                {!record.checkIn && record.status !== 'on_leave' && record.status !== 'absent' && (
                                  <Button 
                                    size="sm" 
                                    onClick={() => checkInMutation.mutate(record.employeeId)}
                                    isLoading={checkInMutation.isPending && checkInMutation.variables === record.employeeId}
                                  >
                                    {t('auto.check_in', 'Check In')}
                                  </Button>
                                )}
                                {record.checkIn && !record.checkOut && (
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => checkOutMutation.mutate(record.employeeId)}
                                    isLoading={checkOutMutation.isPending && checkOutMutation.variables === record.employeeId}
                                  >
                                    {t('auto.check_out', 'Check Out')}
                                  </Button>
                                )}
                              </AnyPermissionGate>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
