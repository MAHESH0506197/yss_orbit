/**
 * MSSAttendancePage.tsx
 * Manager Self-Service — Team Attendance
 *
 * Features:
 *  • Today's team attendance summary (present/absent/on-leave counts)
 *  • Team attendance table with status per employee
 *  • Approve correction requests
 *  • Date range filter
 *  • Uses: useAttendanceList, useRequestCorrection
 */
import React, { useState } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, AlertCircle, UserCheck,
  Calendar, ChevronDown, Loader2, Edit3, Filter,
} from 'lucide-react';
import { startOfDay, endOfDay, parseISO, isToday } from 'date-fns';
import toast from 'react-hot-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAttendanceList, useAttendanceStats, useApproveCorrection } from '@/features/hrms/api/useAttendance';
import { formatIST } from '@/utils/date';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PRESENT:            'bg-emerald-500',
    ABSENT:             'bg-rose-500',
    HALF_DAY:           'bg-amber-400',
    PAID_LEAVE:         'bg-blue-400',
    WEEK_OFF:           'bg-gray-300',
    HOLIDAY:            'bg-purple-400',
    CORRECTION_PENDING: 'bg-orange-400',
  };
  const labels: Record<string, string> = {
    PRESENT: 'Present', ABSENT: 'Absent', HALF_DAY: 'Half Day',
    PAID_LEAVE: 'On Leave', WEEK_OFF: 'Week Off', HOLIDAY: 'Holiday',
    CORRECTION_PENDING: 'Correction Pending',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[status] ?? 'bg-gray-300'}`} />
      <span className="text-xs font-500 text-[hsl(var(--foreground))]">{labels[status] ?? status}</span>
    </span>
  );
}

// ── Correction Approval ───────────────────────────────────────────────────────
function CorrectionApproveBtn({ correctionId }: { correctionId: string }) {
  const mutation = useApproveCorrection();

  return (
    <button
      id={`mss-correction-approve-${correctionId}`}
      onClick={() => mutation.mutate(correctionId)}
      disabled={mutation.isPending}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-700 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors disabled:opacity-40"
    >
      {mutation.isPending ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
      Approve
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export const MSSAttendancePage: React.FC = () => {
  const today = formatIST(new Date(), 'yyyy-MM-dd');
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo,   setDateTo]   = useState(today);
  const [statusFilter, setStatusFilter] = useState('');

  const filters = {
    date_from:   dateFrom,
    date_to:     dateTo,
    ...(statusFilter ? { status: statusFilter } : {}),
    team_view:   true,   // backend will scope to direct reports
  };

  const { data: listData, isLoading } = useAttendanceList(filters);
  const { data: stats } = useAttendanceStats({ date_from: today, date_to: today, team_view: true });

  const records: any[] = Array.isArray(listData?.results)
    ? listData.results
    : Array.isArray(listData) ? listData : [];

  // Pending corrections from all records
  const pendingCorrections = records.filter(r => r.status === 'CORRECTION_PENDING' && r.correction_id);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-800 text-[hsl(var(--foreground))]">Team Attendance</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Monitor and manage attendance for your direct reports
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Present Today',  value: stats?.present ?? 0,  color: 'text-emerald-600', dot: 'bg-emerald-500' },
          { label: 'Absent Today',   value: stats?.absent  ?? 0,  color: 'text-rose-600',    dot: 'bg-rose-500' },
          { label: 'On Leave',       value: stats?.on_leave ?? 0, color: 'text-blue-600',    dot: 'bg-blue-400' },
          { label: 'Corrections',    value: pendingCorrections.length, color: 'text-orange-600', dot: 'bg-orange-400' },
        ].map(({ label, value, color, dot }) => (
          <div key={label} className="glass rounded-2xl px-5 py-4 flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full shrink-0 ${dot}`} />
            <div>
              <p className={`text-2xl font-800 ${color}`}>{value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending corrections alert */}
      {pendingCorrections.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
          <AlertCircle size={16} className="text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-orange-700 dark:text-orange-400 font-700 mb-2">
              {pendingCorrections.length} attendance correction{pendingCorrections.length !== 1 ? 's' : ''} pending your review
            </p>
            <div className="flex flex-wrap gap-2">
              {pendingCorrections.map(r => (
                <div key={r.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg px-3 py-1.5 border border-orange-100 dark:border-orange-900">
                  <span className="text-xs text-[hsl(var(--foreground))]">{r.employee_name || r.employee}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">{r.attendance_date}</span>
                  <CorrectionApproveBtn correctionId={r.correction_id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-[hsl(var(--muted-foreground))]" />
        <div className="flex items-center gap-2">
          <label className="text-xs font-600 text-[hsl(var(--muted-foreground))]">From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:border-[hsl(var(--primary))]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-600 text-[hsl(var(--muted-foreground))]">To</label>
          <input type="date" value={dateTo} min={dateFrom} onChange={e => setDateTo(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:border-[hsl(var(--primary))]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-600 text-[hsl(var(--muted-foreground))]">Status</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm focus:outline-none focus:border-[hsl(var(--primary))]">
            <option value="">All</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="PAID_LEAVE">On Leave</option>
            <option value="CORRECTION_PENDING">Correction Pending</option>
          </select>
        </div>
        <button onClick={() => { setDateFrom(today); setDateTo(today); setStatusFilter(''); }}
          className="ml-auto text-xs text-[hsl(var(--primary))] hover:underline font-600">
          Reset
        </button>
      </div>

      {/* Attendance Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
            <Users size={36} className="opacity-25 mb-3" />
            <p className="text-sm">No attendance records for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[hsl(var(--background-3)/0.5)] border-b border-[hsl(var(--border))]">
                <tr>
                  {['Employee', 'Date', 'Status', 'Punch In', 'Punch Out', 'Hours', 'Action'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-700 text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {records.map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-[hsl(var(--muted)/0.2)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-700 text-[10px] shrink-0">
                          {(rec.employee_name ?? 'E').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-600 text-[hsl(var(--foreground))] text-xs">{rec.employee_name || rec.employee}</p>
                          {rec.employee_code && <p className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{rec.employee_code}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                      {rec.attendance_date ? formatIST(parseISO(rec.attendance_date), 'EEE, d MMM') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusDot status={rec.status} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[hsl(var(--foreground))]">
                      {rec.punch_in ? formatIST(rec.punch_in, 'HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[hsl(var(--foreground))]">
                      {rec.punch_out ? formatIST(rec.punch_out, 'HH:mm') : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-600 text-[hsl(var(--foreground))]">
                      {rec.working_hours ? `${rec.working_hours}h` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {rec.status === 'CORRECTION_PENDING' && rec.correction_id
                        ? <CorrectionApproveBtn correctionId={rec.correction_id} />
                        : <span className="text-[10px] text-[hsl(var(--muted-foreground))]">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
