/**
 * ESSMyLeavePage.tsx
 * Employee Self-Service — My Leave
 *
 * Features:
 *  • Leave balance cards (per type with progress bar)
 *  • Apply Leave modal (date range, type, session, reason)
 *  • Leave history table with status badges
 *  • Cancel pending leave
 *  • Uses: useLeaveBalances, useLeaveRequests, useApplyLeave
 */
import React, { useState } from 'react';
import {
  Umbrella, Plus, Clock, CheckCircle2, XCircle, AlertCircle,
  Loader2, Calendar, ChevronDown, Trash2,
} from 'lucide-react';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useLeaveBalances, useLeaveRequests, useApplyLeave, useLeaveTypes, useCancelLeave } from '@/features/hrms/api/useLeave';
import { useAuthStore } from '@/store/authStore';
import { useEmployees } from '@/features/hrms/api/useEmployees';
import { formatIST } from '@/utils/date';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
    SUBMITTED: { label: 'Pending',  cls: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400', icon: <Clock size={10} /> },
    APPROVED:  { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400', icon: <CheckCircle2 size={10} /> },
    REJECTED:  { label: 'Rejected', cls: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400', icon: <XCircle size={10} /> },
    CANCELLED: { label: 'Cancelled',cls: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400', icon: <XCircle size={10} /> },
  };
  const s = map[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-700 border ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

// ── Leave Balance Card ────────────────────────────────────────────────────────
function BalanceCard({ balance }: { balance: any }) {
  const used = balance.allocated - balance.remaining;
  const pct  = balance.allocated > 0 ? Math.min(100, (used / balance.allocated) * 100) : 0;
  return (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-700 text-[hsl(var(--foreground))]">{balance.leave_type_name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{balance.year}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-800 text-[hsl(var(--foreground))]">{balance.remaining}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">of {balance.allocated} days</p>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[hsl(var(--background-3))]">
        <div
          className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
        {used} used · {balance.remaining} remaining
        {balance.carry_forward > 0 && <> · {balance.carry_forward} carried fwd</>}
      </p>
    </div>
  );
}

// ── Apply Leave Modal ─────────────────────────────────────────────────────────
function ApplyLeaveModal({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const currentYear = new Date().getFullYear();
  const applyMutation = useApplyLeave();

  const { data: leaveTypes = [] } = useLeaveTypes();

  const [form, setForm] = useState<{
    leave_type: string;
    start_date: string;
    end_date: string;
    session: 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF';
    reason: string;
  }>({
    leave_type: '',
    start_date: '',
    end_date: '',
    session: 'FULL_DAY',
    reason: '',
  });

  const duration = form.start_date && form.end_date
    ? Math.max(0, differenceInCalendarDays(new Date(form.end_date), new Date(form.start_date)) + 1)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leave_type || !form.start_date || !form.end_date || !form.reason.trim()) {
      toast.error('All fields are required'); return;
    }
    try {
      await applyMutation.mutateAsync({ employee: employeeId, ...form });
      toast.success('Leave application submitted');
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.error?.details;
      toast.error(typeof detail === 'string' ? detail : 'Failed to apply leave');
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))]';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-700 text-[hsl(var(--foreground))]">Apply for Leave</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">Submit a leave request for manager approval</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">Leave Type <span className="text-rose-500">*</span></label>
            <select value={form.leave_type} onChange={e => setForm(f => ({ ...f, leave_type: e.target.value }))} className={inputCls}>
              <option value="">Select type…</option>
              {leaveTypes.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">From Date <span className="text-rose-500">*</span></label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">To Date <span className="text-rose-500">*</span></label>
              <input type="date" value={form.end_date} min={form.start_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
          {duration > 0 && (
            <p className="text-xs text-[hsl(var(--primary))] font-600">
              📅 {duration} day{duration !== 1 ? 's' : ''} requested
            </p>
          )}
          <div>
            <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">Session</label>
            <select value={form.session} onChange={e => setForm(f => ({ ...f, session: e.target.value as 'FULL_DAY' | 'FIRST_HALF' | 'SECOND_HALF' }))} className={inputCls}>
              <option value="FULL_DAY">Full Day</option>
              <option value="FIRST_HALF">First Half</option>
              <option value="SECOND_HALF">Second Half</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">Reason <span className="text-rose-500">*</span></label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3}
              placeholder="Briefly explain why you need this leave…"
              className={`${inputCls} resize-none`} />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-600 text-[hsl(var(--muted-foreground))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={applyMutation.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-700 hover:opacity-90 disabled:opacity-50 transition-opacity">
              {applyMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export const ESSMyLeavePage: React.FC = () => {
  const [applyOpen, setApplyOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const userId = useAuthStore(s => s.userId);

  // Resolve userId → employeeId (user_id passed as extra filter via any cast since EmployeeFilters is partial)
  const { data: empResponse } = useEmployees({ search: '' } as any);
  const employees = empResponse?.data ?? [];
  const myEmployeeId = employees[0]?.id ?? '';

  const { data: balances = [], isLoading: balLoading } = useLeaveBalances(myEmployeeId, currentYear);
  const { data: requests = [], isLoading: reqLoading } = useLeaveRequests(myEmployeeId);

  const qc = useQueryClient();
  const cancelMutation = useCancelLeave();
  
  const handleCancel = (id: string) => {
    cancelMutation.mutate(id, {
      onSuccess: () => toast.success('Leave cancelled'),
      onError: () => toast.error('Failed to cancel leave'),
    });
  };

  const sorted = [...(Array.isArray(requests) ? requests : [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-800 text-[hsl(var(--foreground))]">My Leave</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">View balances, apply, and track your leave requests</p>
        </div>
        <button
          id="ess-apply-leave-btn"
          onClick={() => setApplyOpen(true)}
          disabled={!myEmployeeId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-700 hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          <Plus size={16} /> Apply Leave
        </button>
      </div>

      {/* Leave Balances */}
      <div>
        <h2 className="text-sm font-700 text-[hsl(var(--foreground))] mb-3">
          <Umbrella size={14} className="inline mr-1.5 text-[hsl(var(--primary))]" />
          Leave Balances — {currentYear}
        </h2>
        {balLoading ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 size={14} className="animate-spin" /> Loading balances…
          </div>
        ) : (Array.isArray(balances) && balances.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {balances.map((b: any) => <BalanceCard key={b.id ?? b.leave_type_name} balance={b} />)}
          </div>
        ) : (
          <div className="glass rounded-2xl p-8 text-center text-[hsl(var(--muted-foreground))] text-sm">
            No leave balances allocated for {currentYear}
          </div>
        )}
      </div>

      {/* Leave History */}
      <div>
        <h2 className="text-sm font-700 text-[hsl(var(--foreground))] mb-3">
          <Clock size={14} className="inline mr-1.5 text-[hsl(var(--primary))]" />
          My Leave History
        </h2>
        {reqLoading ? (
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <Loader2 size={14} className="animate-spin" /> Loading requests…
          </div>
        ) : sorted.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-[hsl(var(--muted-foreground))] text-sm">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" />
            No leave requests found
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[hsl(var(--background-3)/0.5)] border-b border-[hsl(var(--border))]">
                  <tr>
                    {['Leave Type', 'From', 'To', 'Days', 'Session', 'Status', 'Applied On', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-700 text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border))]">
                  {sorted.map((req: any) => (
                    <tr key={req.id} className="hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                      <td className="px-4 py-3 font-600 text-[hsl(var(--foreground))]">{req.leave_type_name || '—'}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{req.start_date ? formatIST(parseISO(req.start_date), 'dd MMM yy') : '—'}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{req.end_date ? formatIST(parseISO(req.end_date), 'dd MMM yy') : '—'}</td>
                      <td className="px-4 py-3 font-600 text-[hsl(var(--foreground))]">{req.total_days ?? '—'}</td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{req.session?.replace('_', ' ') ?? '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">
                        {req.created_at ? formatIST(req.created_at, 'dd MMM yy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {req.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleCancel(req.id)}
                            disabled={cancelMutation.isPending}
                            className="text-rose-500 hover:text-rose-700 transition-colors disabled:opacity-40"
                            title="Cancel Request"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Apply Modal */}
      {applyOpen && myEmployeeId && (
        <ApplyLeaveModal employeeId={myEmployeeId} onClose={() => setApplyOpen(false)} />
      )}
    </div>
  );
};
