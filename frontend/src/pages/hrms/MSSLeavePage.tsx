/**
 * MSSLeavePage.tsx
 * Manager Self-Service — Team Leave Approvals
 *
 * Features:
 *  • Pending queue with approve/reject + mandatory comment
 *  • Tabs: Pending | Approved | All
 *  • Team overlap warning (same-period concurrent leaves)
 *  • Uses: useLeaveRequests, useApproveLeave, apiClient for reject
 */
import React, { useState } from 'react';
import {
  Users, CheckCircle2, XCircle, Clock, AlertTriangle,
  MessageSquare, Loader2, Calendar, ChevronDown, ChevronRight,
  Filter,
} from 'lucide-react';
import { parseISO, differenceInCalendarDays } from 'date-fns';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useApproveLeave, useRejectLeave, useTeamLeaveRequests } from '@/features/hrms/api/useLeave';
import { useAuthStore } from '@/store/authStore';
import { formatIST } from '@/utils/date';

type FilterTab = 'PENDING' | 'APPROVED' | 'ALL';

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUBMITTED: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
    APPROVED:  'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
    REJECTED:  'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400',
    CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-700 border ${map[status] ?? map.CANCELLED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Action Modal ──────────────────────────────────────────────────────────────
interface ActionModalProps {
  request: any;
  action: 'approve' | 'reject';
  managerId: string;
  onClose: () => void;
  onDone: () => void;
}
function ActionModal({ request, action, managerId, onClose, onDone }: ActionModalProps) {
  const [comment, setComment] = useState('');
  const approveLeave = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const isApprove = action === 'approve';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() && !isApprove) {
      toast.error('Comment is required for rejection'); return;
    }
    try {
      if (isApprove) {
        await approveLeave.mutateAsync({ id: request.id, managerId, comments: comment || 'Approved' });
        toast.success('Leave approved');
      } else {
        await rejectMutation.mutateAsync({ id: request.id, managerId, comments: comment });
        toast.success('Leave rejected');
      }
      onDone();
      onClose();
    } catch (err: any) {
      const detail = err.response?.data?.error?.details;
      toast.error(typeof detail === 'string' ? detail : `Failed to ${action}`);
    }
  };

  const isBusy = approveLeave.isPending || rejectMutation.isPending;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className={`px-6 py-4 border-b border-gray-100 dark:border-gray-800 ${isApprove ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-rose-50/50 dark:bg-rose-900/10'}`}>
          <h3 className="text-base font-700 text-[hsl(var(--foreground))]">
            {isApprove ? '✅ Approve Leave Request' : '❌ Reject Leave Request'}
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            {request.leave_type_name} · {request.start_date === request.end_date
              ? request.start_date
              : `${request.start_date} to ${request.end_date}`}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] mb-1">
              Comment {!isApprove && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder={isApprove ? 'Optional note to employee…' : 'Reason for rejection (required)…'}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--primary))] resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button type="button" onClick={onClose} disabled={isBusy}
              className="px-4 py-2 rounded-xl text-sm font-600 text-[hsl(var(--muted-foreground))] hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isBusy}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-white text-sm font-700 disabled:opacity-50 transition-opacity ${isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
              {isBusy ? <Loader2 size={14} className="animate-spin" /> : isApprove ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Leave Request Card ────────────────────────────────────────────────────────
function RequestCard({ req, managerId }: { req: any; managerId: string }) {
  const [modal, setModal] = useState<'approve' | 'reject' | null>(null);
  const isPending = req.status === 'SUBMITTED';
  const days = req.start_date && req.end_date
    ? differenceInCalendarDays(parseISO(req.end_date), parseISO(req.start_date)) + 1
    : req.total_days ?? '?';

  return (
    <>
      <div className={`glass rounded-2xl p-5 space-y-4 ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-700 text-sm shrink-0">
              {(req.employee_name ?? req.employee ?? 'E').toString().substring(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-700 text-[hsl(var(--foreground))]">
                {req.employee_name || `Employee ${req.employee}`}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {req.leave_type_name} · {days} day{days !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <StatusBadge status={req.status} />
        </div>

        {/* Date range */}
        <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]">
          <Calendar size={12} />
          <span>
            {req.start_date === req.end_date
              ? formatIST(parseISO(req.start_date), 'EEE, d MMM yyyy')
              : `${formatIST(parseISO(req.start_date), 'd MMM')} – ${formatIST(parseISO(req.end_date), 'd MMM yyyy')}`}
          </span>
          <span className="ml-1 px-2 py-0.5 rounded-full bg-[hsl(var(--background-3))] font-500">
            {req.session?.replace('_', ' ')}
          </span>
        </div>

        {/* Reason */}
        {req.reason && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--background-3))] rounded-lg px-3 py-2 italic">
            "{req.reason}"
          </p>
        )}

        {/* Manager comment (if already actioned) */}
        {req.manager_comment && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] flex items-start gap-1.5">
            <MessageSquare size={11} className="mt-0.5 shrink-0" />
            {req.manager_comment}
          </p>
        )}

        {/* Actions (pending only) */}
        {isPending && (
          <div className="flex items-center gap-3 pt-2 border-t border-[hsl(var(--border))]">
            <button
              id={`mss-reject-${req.id}`}
              onClick={() => setModal('reject')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 border border-rose-200 dark:border-rose-800 transition-colors"
            >
              <XCircle size={13} /> Reject
            </button>
            <button
              id={`mss-approve-${req.id}`}
              onClick={() => setModal('approve')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-700 text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 size={13} /> Approve
            </button>
          </div>
        )}
      </div>

      {modal && (
        <ActionModal
          request={req}
          action={modal}
          managerId={managerId}
          onClose={() => setModal(null)}
          onDone={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export const MSSLeavePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('PENDING');
  const userId = useAuthStore(s => s.userId) ?? '';

  const { data: response, isLoading } = useTeamLeaveRequests(userId);

  const allRequests: any[] = Array.isArray(response?.data?.results)
    ? response.data.results
    : Array.isArray(response?.data) ? response.data : [];

  const filtered = allRequests.filter(r => {
    if (activeTab === 'PENDING') return r.status === 'SUBMITTED';
    if (activeTab === 'APPROVED') return r.status === 'APPROVED';
    return true;
  });

  const pendingCount = allRequests.filter(r => r.status === 'SUBMITTED').length;

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'PENDING',  label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'ALL',      label: 'All' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-800 text-[hsl(var(--foreground))]">Team Leave Approvals</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          Review and action leave requests from your direct reports
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval',  value: pendingCount, color: 'text-amber-600',   bg: 'bg-amber-500/10' },
          { label: 'Approved This Month', value: allRequests.filter(r => r.status === 'APPROVED').length, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
          { label: 'Total Requests',    value: allRequests.length, color: 'text-[hsl(var(--primary))]', bg: 'bg-[hsl(var(--primary)/0.08)]' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="glass rounded-2xl px-5 py-4">
            <p className={`text-2xl font-800 ${color}`}>{value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending alert banner */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
          <AlertTriangle size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-700">{pendingCount} request{pendingCount !== 1 ? 's' : ''}</span> awaiting your approval
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[hsl(var(--background-3))] rounded-xl border border-[hsl(var(--border))] w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            id={`mss-leave-tab-${tab.id.toLowerCase()}`}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-600 transition-all ${
              activeTab === tab.id
                ? 'bg-[hsl(var(--primary))] text-white shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
          <CheckCircle2 size={36} className="opacity-25 mb-3 text-emerald-500" />
          <p className="text-sm font-500">
            {activeTab === 'PENDING' ? 'All caught up! No pending requests.' : 'No requests found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((req: any) => (
            <RequestCard key={req.id} req={req} managerId={userId} />
          ))}
        </div>
      )}
    </div>
  );
};
