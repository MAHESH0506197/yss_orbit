// yss_orbit\frontend\src\pages\hrms\LeaveManagementPage.tsx
import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Plus, Search, Filter, ChevronDown, X, Send,
  Users, BarChart3, Settings, TrendingUp,
  ArrowRight, Info, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WITHDRAW_REQUESTED';
type LeaveView = 'MY_LEAVE' | 'TEAM_LEAVE' | 'SETTINGS' | 'REPORTS';

interface LeaveType {
  id: string;
  name: string;
  code: string;
  color: string;
  totalEntitled: number;
  usedDays: number;
  pendingDays: number;
  lapsedDays: number;
  carriedForward: number;
  encashable: boolean;
}

interface LeaveRequest {
  id: string;
  leaveType: string;
  leaveTypeColor: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approvedBy?: string;
  rejectionReason?: string;
  halfDay?: 'MORNING' | 'AFTERNOON';
}

interface TeamLeaveRecord {
  id: string;
  employeeName: string;
  avatar: string;
  department: string;
  leaveType: string;
  leaveTypeColor: string;
  fromDate: string;
  toDate: string;
  days: number;
  status: LeaveStatus;
  appliedOn: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MY_LEAVE_TYPES: LeaveType[] = [
  { id: 'lt1', name: 'Annual Leave',        code: 'AL',  color: 'hsl(var(--primary))',     totalEntitled: 18, usedDays: 7,  pendingDays: 2,  lapsedDays: 0, carriedForward: 3,  encashable: true },
  { id: 'lt2', name: 'Sick Leave',          code: 'SL',  color: 'hsl(var(--destructive))', totalEntitled: 12, usedDays: 3,  pendingDays: 0,  lapsedDays: 0, carriedForward: 0,  encashable: false },
  { id: 'lt3', name: 'Casual Leave',        code: 'CL',  color: 'hsl(var(--accent))',      totalEntitled: 12, usedDays: 5,  pendingDays: 0,  lapsedDays: 0, carriedForward: 0,  encashable: false },
  { id: 'lt4', name: 'Comp Off',            code: 'CO',  color: 'hsl(var(--teal))',        totalEntitled: 4,  usedDays: 1,  pendingDays: 1,  lapsedDays: 0, carriedForward: 0,  encashable: false },
  { id: 'lt5', name: 'Paternity Leave',     code: 'PAT', color: 'hsl(var(--warning))',     totalEntitled: 15, usedDays: 0,  pendingDays: 0,  lapsedDays: 0, carriedForward: 0,  encashable: false },
  { id: 'lt6', name: 'Loss of Pay',         code: 'LOP', color: 'hsl(var(--muted-foreground))', totalEntitled: 0, usedDays: 0, pendingDays: 0, lapsedDays: 0, carriedForward: 0, encashable: false },
];

const MY_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'lr1', leaveType: 'Annual Leave', leaveTypeColor: 'hsl(var(--primary))', fromDate: '2026-06-16', toDate: '2026-06-17', days: 2, reason: 'Family vacation', status: 'PENDING', appliedOn: '2026-06-10' },
  { id: 'lr2', leaveType: 'Sick Leave', leaveTypeColor: 'hsl(var(--destructive))', fromDate: '2026-05-28', toDate: '2026-05-28', days: 1, reason: 'Medical appointment', status: 'APPROVED', appliedOn: '2026-05-27', approvedBy: 'Sneha Kapoor' },
  { id: 'lr3', leaveType: 'Annual Leave', leaveTypeColor: 'hsl(var(--primary))', fromDate: '2026-05-15', toDate: '2026-05-19', days: 5, reason: 'Annual leave', status: 'APPROVED', appliedOn: '2026-05-01', approvedBy: 'Sneha Kapoor' },
  { id: 'lr4', leaveType: 'Casual Leave', leaveTypeColor: 'hsl(var(--accent))', fromDate: '2026-04-25', toDate: '2026-04-25', days: 1, reason: 'Personal work', status: 'APPROVED', appliedOn: '2026-04-24', approvedBy: 'Sneha Kapoor' },
  { id: 'lr5', leaveType: 'Casual Leave', leaveTypeColor: 'hsl(var(--accent))', fromDate: '2026-04-10', toDate: '2026-04-11', days: 2, reason: 'Personal errand', status: 'REJECTED', appliedOn: '2026-04-08', rejectionReason: 'Quarter end crunch — no approvals this week.' },
  { id: 'lr6', leaveType: 'Comp Off', leaveTypeColor: 'hsl(var(--teal))', fromDate: '2026-06-20', toDate: '2026-06-20', days: 1, reason: 'Worked on Sunday 2026-06-07', status: 'PENDING', appliedOn: '2026-06-11' },
];

const TEAM_LEAVE_REQUESTS: TeamLeaveRecord[] = [
  { id: 'tl1', employeeName: 'Kiran Rao',     avatar: 'KR', department: 'Engineering', leaveType: 'Annual Leave', leaveTypeColor: 'hsl(var(--primary))',     fromDate: '2026-06-12', toDate: '2026-06-13', days: 2, status: 'PENDING',  appliedOn: '2026-06-09' },
  { id: 'tl2', employeeName: 'Meena Pillai',  avatar: 'MP', department: 'HR',          leaveType: 'Sick Leave',   leaveTypeColor: 'hsl(var(--destructive))', fromDate: '2026-06-11', toDate: '2026-06-11', days: 1, status: 'PENDING',  appliedOn: '2026-06-11' },
  { id: 'tl3', employeeName: 'Rohan Gupta',   avatar: 'RG', department: 'Finance',     leaveType: 'Casual Leave', leaveTypeColor: 'hsl(var(--accent))',      fromDate: '2026-06-05', toDate: '2026-06-05', days: 1, status: 'APPROVED', appliedOn: '2026-06-03' },
  { id: 'tl4', employeeName: 'Ananya Singh',  avatar: 'AS', department: 'Engineering', leaveType: 'Annual Leave', leaveTypeColor: 'hsl(var(--primary))',     fromDate: '2026-06-09', toDate: '2026-06-10', days: 2, status: 'APPROVED', appliedOn: '2026-06-02' },
  { id: 'tl5', employeeName: 'Vikram Das',    avatar: 'VD', department: 'Sales',       leaveType: 'Comp Off',     leaveTypeColor: 'hsl(var(--teal))',        fromDate: '2026-06-14', toDate: '2026-06-14', days: 1, status: 'PENDING',  appliedOn: '2026-06-10' },
];

const STATUS_CFG: Record<LeaveStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  PENDING:            { label: 'Pending',            color: 'hsl(var(--warning))',    bg: 'hsl(var(--warning)/0.1)',    icon: <Clock size={11} /> },
  APPROVED:           { label: 'Approved',           color: 'hsl(var(--success))',    bg: 'hsl(var(--success)/0.1)',    icon: <CheckCircle size={11} /> },
  REJECTED:           { label: 'Rejected',           color: 'hsl(var(--destructive))',bg: 'hsl(var(--destructive)/0.1)',icon: <XCircle size={11} /> },
  CANCELLED:          { label: 'Cancelled',          color: 'hsl(var(--muted-foreground))',bg: 'hsl(var(--muted))',     icon: <X size={11} /> },
  WITHDRAW_REQUESTED: { label: 'Withdraw Requested', color: 'hsl(var(--accent))',    bg: 'hsl(var(--accent)/0.1)',     icon: <AlertCircle size={11} /> },
};

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Balance Card ─────────────────────────────────────────────────────────────

const BalanceCard: React.FC<{ lt: LeaveType }> = ({ lt }) => {
  const available = lt.totalEntitled + lt.carriedForward - lt.usedDays - lt.pendingDays;
  const pct = lt.totalEntitled > 0 ? ((lt.usedDays + lt.pendingDays) / (lt.totalEntitled + lt.carriedForward)) * 100 : 0;
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl p-4 border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: lt.color }}>
            {lt.code}
          </div>
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{lt.name}</span>
        </div>
        {lt.encashable && (
          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]">Encashable</span>
        )}
      </div>
      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] mb-3 overflow-hidden">
        <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pct)}%`, background: lt.color }} />
      </div>
      <div className="grid grid-cols-4 gap-1 text-center">
        {[
          { label: 'Entitled', value: lt.totalEntitled + lt.carriedForward },
          { label: 'Used', value: lt.usedDays },
          { label: 'Pending', value: lt.pendingDays },
          { label: 'Available', value: Math.max(0, available) },
        ].map(s => (
          <div key={s.label}>
            <p className="text-xs font-bold text-[hsl(var(--foreground))]">{s.value}</p>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Apply Leave Modal ────────────────────────────────────────────────────────

const ApplyLeaveModal: React.FC<{ onClose: () => void; onApply: (req: Partial<LeaveRequest>) => void }> = ({ onClose, onApply }) => {
  const [form, setForm] = useState({ leaveTypeId: 'lt1', fromDate: '', toDate: '', halfDay: '', reason: '' });
  const days = form.fromDate && form.toDate
    ? Math.max(1, Math.round((new Date(form.toDate).getTime() - new Date(form.fromDate).getTime()) / 86400000) + 1)
    : 0;
  const selectedLT = MY_LEAVE_TYPES.find(l => l.id === form.leaveTypeId)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center"><Calendar size={17} className="text-white" /></div>
            <div><h2 className="font-bold text-[hsl(var(--foreground))]">Apply for Leave</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">Submit a new leave request</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5 block">Leave Type</label>
            <select value={form.leaveTypeId} onChange={e => setForm(f => ({ ...f, leaveTypeId: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
              {MY_LEAVE_TYPES.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({Math.max(0, lt.totalEntitled + lt.carriedForward - lt.usedDays - lt.pendingDays)} days available)</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5 block">From Date</label>
              <input type="date" value={form.fromDate} onChange={e => setForm(f => ({ ...f, fromDate: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5 block">To Date</label>
              <input type="date" value={form.toDate} min={form.fromDate} onChange={e => setForm(f => ({ ...f, toDate: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
            </div>
          </div>
          {days > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)]">
              <Info size={13} className="text-[hsl(var(--primary))]" />
              <span className="text-sm text-[hsl(var(--foreground))]">{days} working day{days > 1 ? 's' : ''} · {selectedLT.name}</span>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5 block">Reason</label>
            <textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Brief reason for leave…" className="w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all">Cancel</button>
          <button
            onClick={() => { onApply({ leaveType: selectedLT.name, leaveTypeColor: selectedLT.color, fromDate: form.fromDate, toDate: form.toDate, days, reason: form.reason, status: 'PENDING', appliedOn: new Date().toISOString().split('T')[0] }); onClose(); }}
            disabled={!form.fromDate || !form.toDate || !form.reason}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── My Leave View ────────────────────────────────────────────────────────────

const MyLeaveView: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>(MY_LEAVE_REQUESTS);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | ''>('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => requests.filter(r => {
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchSearch = !search || r.leaveType.toLowerCase().includes(search.toLowerCase()) || r.reason.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }), [requests, filterStatus, search]);

  const handleApply = (req: Partial<LeaveRequest>) => {
    const newReq: LeaveRequest = { id: `lr${Date.now()}`, leaveType: req.leaveType!, leaveTypeColor: req.leaveTypeColor!, fromDate: req.fromDate!, toDate: req.toDate!, days: req.days!, reason: req.reason!, status: 'PENDING', appliedOn: req.appliedOn! };
    setRequests(prev => [newReq, ...prev]);
  };

  const handleCancel = (id: string) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'CANCELLED' } : r));
  const handleWithdraw = (id: string) => setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'WITHDRAW_REQUESTED' } : r));

  const totalPending = requests.filter(r => r.status === 'PENDING').length;
  const totalApproved = requests.filter(r => r.status === 'APPROVED').length;
  const totalUsedDays = MY_LEAVE_TYPES.reduce((s, lt) => s + lt.usedDays, 0);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Requests', value: totalPending, color: 'var(--warning)' },
          { label: 'Approved This Year', value: totalApproved, color: 'var(--success)' },
          { label: 'Days Used', value: totalUsedDays, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm text-center">
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Balance cards */}
      <div>
        <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-3">Leave Balances — FY 2026-27</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {MY_LEAVE_TYPES.map(lt => <BalanceCard key={lt.id} lt={lt} />)}
        </div>
      </div>

      {/* Leave history */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))]">My Leave Requests</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="pl-8 pr-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] w-36" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
              <option value="">All Status</option>
              {(Object.keys(STATUS_CFG) as LeaveStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
            </select>
            <button onClick={() => setShowApplyModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-semibold hover:opacity-90 transition-all shadow-sm">
              <Plus size={13} />Apply Leave
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
                {['Leave Type', 'Period', 'Days', 'Reason', 'Status', 'Applied On', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => {
                const cfg = STATUS_CFG[req.status];
                return (
                  <tr key={req.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: req.leaveTypeColor, background: `${req.leaveTypeColor}18` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: req.leaveTypeColor }} />
                        {req.leaveType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--foreground))]">
                      <p className="font-medium">{req.fromDate} {req.fromDate !== req.toDate ? `→ ${req.toDate}` : ''}</p>
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-bold text-[hsl(var(--foreground))]">{req.days}d</span></td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[hsl(var(--foreground))] max-w-48 truncate" title={req.reason}>{req.reason}</p>
                      {req.rejectionReason && <p className="text-[10px] text-[hsl(var(--destructive))] mt-0.5 max-w-48 truncate" title={req.rejectionReason}>↳ {req.rejectionReason}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">{req.appliedOn}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {req.status === 'PENDING' && (
                          <button onClick={() => handleCancel(req.id)} className="px-2 py-1 rounded-lg bg-[hsl(var(--destructive)/0.08)] text-[hsl(var(--destructive))] text-[10px] font-medium hover:bg-[hsl(var(--destructive)/0.15)] transition-colors">Cancel</button>
                        )}
                        {req.status === 'APPROVED' && (
                          <button onClick={() => handleWithdraw(req.id)} className="px-2 py-1 rounded-lg bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] text-[10px] font-medium hover:bg-[hsl(var(--warning)/0.2)] transition-colors">Withdraw</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No leave requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {showApplyModal && <ApplyLeaveModal onClose={() => setShowApplyModal(false)} onApply={handleApply} />}
    </div>
  );
};

// ─── Team Leave View (MSS) ────────────────────────────────────────────────────

const TeamLeaveView: React.FC = () => {
  const [records, setRecords] = useState<TeamLeaveRecord[]>(TEAM_LEAVE_REQUESTS);
  const [filterStatus, setFilterStatus] = useState<LeaveStatus | ''>('PENDING');

  const filtered = records.filter(r => !filterStatus || r.status === filterStatus);
  const pendingCount = records.filter(r => r.status === 'PENDING').length;

  const handleApprove = (id: string) => setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
  const handleReject  = (id: string) => setRecords(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pending Approval', value: pendingCount, color: 'var(--warning)' },
          { label: 'Approved (Month)', value: records.filter(r => r.status === 'APPROVED').length, color: 'var(--success)' },
          { label: 'Team Members on Leave Today', value: 2, color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm text-center">
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.2)]">
          <AlertCircle size={15} className="text-[hsl(var(--warning))] shrink-0" />
          <p className="text-sm text-[hsl(var(--foreground))]"><strong>{pendingCount} leave request{pendingCount > 1 ? 's' : ''}</strong> pending your approval.</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))]">Team Leave Requests</h3>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
            <option value="">All Status</option>
            {(Object.keys(STATUS_CFG) as LeaveStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
                {['Employee', 'Leave Type', 'Period', 'Days', 'Status', 'Applied', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                const cfg = STATUS_CFG[rec.status];
                return (
                  <tr key={rec.id} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">{rec.avatar}</div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{rec.employeeName}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{rec.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: rec.leaveTypeColor, background: `${rec.leaveTypeColor}18` }}>{rec.leaveType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--foreground))]">{rec.fromDate}{rec.fromDate !== rec.toDate ? ` → ${rec.toDate}` : ''}</td>
                    <td className="px-4 py-3"><span className="text-sm font-bold text-[hsl(var(--foreground))]">{rec.days}d</span></td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.icon}{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))]">{rec.appliedOn}</td>
                    <td className="px-4 py-3">
                      {rec.status === 'PENDING' && (
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleApprove(rec.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] text-xs font-medium hover:bg-[hsl(var(--success)/0.2)] transition-colors">
                            <CheckCircle size={11} />Approve
                          </button>
                          <button onClick={() => handleReject(rec.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] text-xs font-medium hover:bg-[hsl(var(--destructive)/0.2)] transition-colors">
                            <XCircle size={11} />Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Reports View ─────────────────────────────────────────────────────────────

const ReportsView: React.FC = () => {
  const deptData = [
    { dept: 'Engineering', used: 42, pending: 5, color: 'hsl(var(--primary))' },
    { dept: 'HR',          used: 18, pending: 2, color: 'hsl(var(--accent))' },
    { dept: 'Finance',     used: 24, pending: 3, color: 'hsl(var(--teal))' },
    { dept: 'Sales',       used: 31, pending: 4, color: 'hsl(var(--warning))' },
    { dept: 'Design',      used: 15, pending: 1, color: 'hsl(var(--success))' },
  ];
  const maxUsed = Math.max(...deptData.map(d => d.used));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Leave Days (YTD)', value: '1,284', color: 'var(--primary)', sub: 'Across 247 employees' },
          { label: 'Avg Days Per Employee', value: '5.2', color: 'var(--accent)', sub: 'FY 2026-27' },
          { label: 'Leave Encashment (YTD)', value: '₹3,84,200', color: 'var(--success)', sub: '32 employees' },
          { label: 'LOP Cases (Month)', value: '4', color: 'var(--destructive)', sub: 'June 2026' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
        <h3 className="font-bold text-[hsl(var(--foreground))] mb-4">Leave Usage by Department (FY 2026-27)</h3>
        <div className="space-y-3">
          {deptData.map(d => (
            <div key={d.dept} className="flex items-center gap-3">
              <span className="text-xs text-[hsl(var(--muted-foreground))] w-24 shrink-0">{d.dept}</span>
              <div className="flex-1 h-6 rounded-lg bg-[hsl(var(--muted)/0.5)] overflow-hidden relative">
                <div className="h-6 rounded-lg transition-all duration-700 flex items-center pl-2" style={{ width: `${(d.used / maxUsed) * 100}%`, background: d.color }}>
                  <span className="text-[10px] font-bold text-white">{d.used}d</span>
                </div>
              </div>
              {d.pending > 0 && <span className="text-[10px] text-[hsl(var(--warning))] font-medium">{d.pending} pending</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Settings View ────────────────────────────────────────────────────────────

const SettingsView: React.FC = () => (
  <div className="space-y-4">
    {MY_LEAVE_TYPES.map(lt => (
      <div key={lt.id} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 flex items-center gap-4 shadow-sm">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: lt.color }}>{lt.code}</div>
        <div className="flex-1">
          <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{lt.name}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            {lt.totalEntitled} days entitled · {lt.carriedForward > 0 ? `${lt.carriedForward} carried forward · ` : ''}
            {lt.encashable ? '✓ Encashable' : 'Non-encashable'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-[hsl(var(--foreground))]">{Math.max(0, lt.totalEntitled + lt.carriedForward - lt.usedDays - lt.pendingDays)} days left</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">of {lt.totalEntitled + lt.carriedForward} total</p>
        </div>
      </div>
    ))}
    <div className="p-4 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))]">
      <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Leave Policy</p>
      <div className="space-y-1">
        {[
          'Annual Leave can be applied minimum 3 days in advance.',
          'Sick Leave can be applied retroactively within 2 days.',
          'Comp-off must be applied within 30 days of compensatory work.',
          'Annual Leave carries forward up to 6 days per year.',
          'Leave balance resets on April 1 each year (FY cycle).',
        ].map(rule => <p key={rule} className="text-xs text-[hsl(var(--foreground))]">• {rule}</p>)}
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS: { key: LeaveView; label: string; icon: React.ReactNode }[] = [
  { key: 'MY_LEAVE',   label: 'My Leave',   icon: <Calendar size={15} /> },
  { key: 'TEAM_LEAVE', label: 'Team Leave', icon: <Users size={15} /> },
  { key: 'REPORTS',    label: 'Reports',    icon: <BarChart3 size={15} /> },
  { key: 'SETTINGS',   label: 'Settings',   icon: <Settings size={15} /> },
];

export const LeaveManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LeaveView>('MY_LEAVE');

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.12)]">
            <Calendar size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Leave Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage leave requests, balances, and team approvals</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'MY_LEAVE'   && <MyLeaveView />}
      {activeTab === 'TEAM_LEAVE' && <TeamLeaveView />}
      {activeTab === 'REPORTS'    && <ReportsView />}
      {activeTab === 'SETTINGS'   && <SettingsView />}
    </div>
  );
};

export default LeaveManagementPage;
