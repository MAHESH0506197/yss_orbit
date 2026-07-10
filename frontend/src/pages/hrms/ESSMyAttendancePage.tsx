/**
 * ESSMyAttendancePage.tsx
 * Employee Self-Service — My Attendance
 *
 * Features:
 *  • Live punch-in / punch-out widget with timer
 *  • Today's attendance status card
 *  • Monthly calendar view with colour-coded attendance
 *  • Attendance correction request modal
 *  • Uses: useMyAttendance, usePunch, useAttendanceList, useRequestCorrection
 */
import React, { useState, useEffect } from 'react';
import {
  Clock, CheckCircle2, XCircle, AlertCircle, Play, Square,
  ChevronLeft, ChevronRight, Edit3, Calendar, Timer, Loader2,
} from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isWeekend, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { formatIST } from '@/utils/date';
import {
  useMyAttendance,
  usePunch,
  useAttendanceList,
  useRequestCorrection,
} from '@/features/hrms/api/useAttendance';

// ── helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT:      { label: 'Present',      cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' },
    ABSENT:       { label: 'Absent',       cls: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400' },
    HALF_DAY:     { label: 'Half Day',     cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400' },
    PAID_LEAVE:   { label: 'Leave',        cls: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400' },
    WEEK_OFF:     { label: 'Week Off',     cls: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400' },
    HOLIDAY:      { label: 'Holiday',      cls: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400' },
    CORRECTION_PENDING: { label: 'Correction', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  };
  return map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' };
}

function calDotColor(status?: string) {
  const map: Record<string, string> = {
    PRESENT: 'bg-emerald-500',
    ABSENT: 'bg-rose-500',
    HALF_DAY: 'bg-amber-400',
    PAID_LEAVE: 'bg-blue-400',
    HOLIDAY: 'bg-purple-400',
    WEEK_OFF: 'bg-gray-300',
  };
  return map[status ?? ''] ?? '';
}

// ── Live Clock ────────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="text-4xl font-800 tabular-nums text-[hsl(var(--foreground))]">
      {formatIST(now, 'HH:mm:ss')}
    </span>
  );
}

// ── Elapsed Timer ─────────────────────────────────────────────────────────────
function ElapsedTimer({ since }: { since: string }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(since).getTime()) / 1000);
      const h = Math.floor(diff / 3600).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
      const s = (diff % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [since]);
  return <span className="tabular-nums font-mono">{elapsed}</span>;
}

// ── Correction Modal ──────────────────────────────────────────────────────────
interface CorrectionModalProps {
  recordId: string;
  onClose: () => void;
}
function CorrectionModal({ recordId, onClose }: CorrectionModalProps) {
  const [reason, setReason] = useState('');
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const correction = useRequestCorrection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Reason is required'); return; }
    try {
      await correction.mutateAsync({
        record: recordId,
        reason,
        requested_in_time: inTime || undefined,
        requested_out_time: outTime || undefined,
      });
      toast.success('Correction request submitted');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to submit correction');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div>
          <h3 className="text-lg font-700 text-[hsl(var(--foreground))]">Request Attendance Correction</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Submit corrected punch times for HR review.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">Corrected In-Time</label>
              <input type="time" value={inTime} onChange={e => setInTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]" />
            </div>
            <div>
              <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">Corrected Out-Time</label>
              <input type="time" value={outTime} onChange={e => setOutTime(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">Reason <span className="text-rose-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} placeholder="Explain why the correction is needed..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))] resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-600 text-[hsl(var(--muted-foreground))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={correction.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-600 hover:opacity-90 disabled:opacity-50 transition-opacity">
              {correction.isPending ? <Loader2 size={14} className="animate-spin" /> : <Edit3 size={14} />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export const ESSMyAttendancePage: React.FC = () => {
  const [viewMonth, setViewMonth] = useState(new Date());
  const [correctionRecordId, setCorrectionRecordId] = useState<string | null>(null);

  const { data: today, isLoading: todayLoading } = useMyAttendance();
  const punchMutation = usePunch();

  // Fetch current month's attendance records for this employee
  const monthStart = formatIST(startOfMonth(viewMonth), 'yyyy-MM-dd');
  const monthEnd   = formatIST(endOfMonth(viewMonth), 'yyyy-MM-dd');
  const { data: monthData, isLoading: monthLoading } = useAttendanceList({
    date_from: monthStart,
    date_to:   monthEnd,
    my_records: true,
  });

  const records: any[] = Array.isArray(monthData?.results)
    ? monthData.results
    : Array.isArray(monthData) ? monthData : [];

  const recordByDate = (date: Date) =>
    records.find(r => isSameDay(parseISO(r.attendance_date), date));

  const isPunchedIn = !!today?.actual_in && !today?.actual_out;

  const handlePunch = async () => {
    try {
      await punchMutation.mutateAsync('WEB');
    } catch { /* toast handled in hook */ }
  };

  // Monthly stats
  const daysInMonth = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const presentDays = records.filter(r => r.status === 'PRESENT' || r.status === 'HALF_DAY').length;
  const absentDays  = records.filter(r => r.status === 'ABSENT').length;
  const leaveDays   = records.filter(r => r.status === 'PAID_LEAVE').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── Page Title ── */}
      <div>
        <h1 className="text-2xl font-800 text-[hsl(var(--foreground))]">My Attendance</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          {formatIST(new Date(), 'EEEE, d MMMM yyyy')}
        </p>
      </div>

      {/* ── Punch Widget + Today Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Punch Widget */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center gap-5 text-center min-h-[220px]">
          <LiveClock />
          {todayLoading ? (
            <Loader2 className="animate-spin text-[hsl(var(--primary))]" size={24} />
          ) : (
            <>
              {isPunchedIn && today?.actual_in && (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Working for <span className="font-600 text-[hsl(var(--primary))]">
                    <ElapsedTimer since={today.actual_in} />
                  </span>
                </p>
              )}
              <button
                id="ess-punch-btn"
                onClick={handlePunch}
                disabled={punchMutation.isPending}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-700 transition-all shadow-lg disabled:opacity-50 ${
                  isPunchedIn
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/30'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                }`}
              >
                {punchMutation.isPending
                  ? <Loader2 size={16} className="animate-spin" />
                  : isPunchedIn ? <Square size={16} /> : <Play size={16} />
                }
                {isPunchedIn ? 'Punch Out' : 'Punch In'}
              </button>
              {today?.actual_in && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  In: <span className="font-600">{formatIST(today.actual_in, 'HH:mm')}</span>
                  {today.actual_out && <>  ·  Out: <span className="font-600">{formatIST(today.actual_out, 'HH:mm')}</span></>}
                </p>
              )}
            </>
          )}
        </div>

        {/* Today Status Card */}
        <div className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-700 text-[hsl(var(--foreground))]">Today's Status</h2>
            {today?.id && (
              <button onClick={() => setCorrectionRecordId(today.id)}
                className="flex items-center gap-1 text-xs text-[hsl(var(--primary))] hover:underline">
                <Edit3 size={11} /> Request Correction
              </button>
            )}
          </div>

          {todayLoading ? (
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : today ? (
            <div className="space-y-3">
              {(() => { const s = statusBadge(today.status); return (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-700 border ${s.cls}`}>{s.label}</span>
              ); })()}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Punch In',       value: today.actual_in    ? formatIST(today.actual_in, 'HH:mm') : '—' },
                  { label: 'Punch Out',      value: today.actual_out   ? formatIST(today.actual_out, 'HH:mm') : '—' },
                  { label: 'Working Hours',  value: today.work_hours   ? `${today.work_hours}` : '—' },
                  { label: 'Source',         value: today.punches?.[0]?.source || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl bg-[hsl(var(--background-3))] px-3 py-2">
                    <span className="block text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{label}</span>
                    <span className="font-600 text-[hsl(var(--foreground))]">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-2 text-[hsl(var(--muted-foreground))]">
              <XCircle size={32} className="opacity-30" />
              <p className="text-sm">No attendance record for today</p>
              <p className="text-xs">Punch in to start your workday</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Present Days', value: presentDays, icon: <CheckCircle2 size={18} />, color: 'text-emerald-600' },
          { label: 'Absent Days',  value: absentDays,  icon: <XCircle size={18} />,      color: 'text-rose-600' },
          { label: 'Leave Days',   value: leaveDays,   icon: <Calendar size={18} />,     color: 'text-blue-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
            <span className={color}>{icon}</span>
            <div>
              <p className="text-2xl font-800 text-[hsl(var(--foreground))]">{value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Monthly Calendar ── */}
      <div className="glass rounded-2xl p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-700 text-[hsl(var(--foreground))]">
            <Timer size={14} className="inline mr-1.5 text-[hsl(var(--primary))]" />
            {formatIST(viewMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}
              className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setViewMonth(new Date())}
              className="px-3 py-1 rounded-lg text-xs font-600 hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors">
              Today
            </button>
            <button onClick={() => setViewMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}
              className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Day Labels */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="text-center text-[10px] font-700 text-[hsl(var(--muted-foreground))] uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        {monthLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : (() => {
          const firstDay = startOfMonth(viewMonth).getDay();
          const cells = [...Array(firstDay).fill(null), ...daysInMonth];
          const rows = Math.ceil(cells.length / 7);
          return (
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const rec = recordByDate(day);
                const dot = calDotColor(rec?.status);
                const todayClass = isToday(day) ? 'ring-2 ring-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)]' : '';
                const weekendClass = isWeekend(day) && !rec ? 'opacity-40' : '';
                return (
                  <div key={day.toISOString()}
                    onClick={() => rec?.id && setCorrectionRecordId(rec.id)}
                    title={rec ? statusBadge(rec.status).label : undefined}
                    className={`relative flex flex-col items-center justify-center rounded-xl py-2 transition-all cursor-default ${rec?.id ? 'hover:bg-[hsl(var(--muted))] cursor-pointer' : ''} ${todayClass} ${weekendClass}`}>
                    <span className={`text-xs font-600 ${isToday(day) ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'}`}>
                      {formatIST(day, 'd')}
                    </span>
                    {dot && <span className={`mt-1 w-1.5 h-1.5 rounded-full ${dot}`} />}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-[hsl(var(--border))]">
          {[
            { label: 'Present', color: 'bg-emerald-500' },
            { label: 'Absent',  color: 'bg-rose-500' },
            { label: 'Half Day', color: 'bg-amber-400' },
            { label: 'Leave',  color: 'bg-blue-400' },
            { label: 'Holiday', color: 'bg-purple-400' },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Correction Modal */}
      {correctionRecordId && (
        <CorrectionModal recordId={correctionRecordId} onClose={() => setCorrectionRecordId(null)} />
      )}
    </div>
  );
};
