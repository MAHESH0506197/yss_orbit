// yss_orbit\frontend\src\pages\hrms\OffboardingPage.tsx
import React, { useState } from 'react';
import { formatIST } from '@/utils/date';
import {
  LogOut, Search, Clock, AlertCircle, CheckCircle,
  FileText, Package, CreditCard, Shield, X,
  ChevronRight, Plus, User,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type ExitStatus = 'NOTICE_PERIOD' | 'PENDING_CLEARANCE' | 'SETTLEMENT_PENDING' | 'COMPLETED';
type ClearanceStatus = 'PENDING' | 'CLEARED' | 'WAIVED';

interface ClearanceItem {
  id: string;
  department: string;
  item: string;
  status: ClearanceStatus;
  clearedBy?: string;
  icon: React.ReactNode;
}

interface OffboardingRecord {
  id: string;
  employeeName: string;
  empCode: string;
  designation: string;
  department: string;
  lastWorkingDate: string;
  resignationDate: string;
  exitType: 'RESIGNATION' | 'TERMINATION' | 'RETIREMENT' | 'CONTRACT_END';
  status: ExitStatus;
  noticePeriodDays: number;
  noticePeriodServed: number;
  settlementAmount?: number;
  clearance: ClearanceItem[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_OFFBOARDINGS: OffboardingRecord[] = [
  {
    id: 'off1', employeeName: 'Deepak Sharma', empCode: 'EMP023', designation: 'Senior SDE',
    department: 'Engineering', lastWorkingDate: '2026-06-30', resignationDate: '2026-05-31',
    exitType: 'RESIGNATION', status: 'NOTICE_PERIOD', noticePeriodDays: 30, noticePeriodServed: 12,
    clearance: [
      { id: 'c1', department: 'IT', item: 'Laptop & Equipment Return', status: 'PENDING', icon: <Package size={14} /> },
      { id: 'c2', department: 'Admin', item: 'Access Card & ID Return', status: 'PENDING', icon: <CreditCard size={14} /> },
      { id: 'c3', department: 'HR', item: 'Experience Letter Issued', status: 'PENDING', icon: <FileText size={14} /> },
      { id: 'c4', department: 'IT', item: 'System Access Revoked', status: 'PENDING', icon: <Shield size={14} /> },
      { id: 'c5', department: 'Finance', item: 'Full & Final Settlement', status: 'PENDING', icon: <CreditCard size={14} /> },
    ],
  },
  {
    id: 'off2', employeeName: 'Anita Verma', empCode: 'EMP031', designation: 'HR Executive',
    department: 'HR', lastWorkingDate: '2026-06-15', resignationDate: '2026-05-15',
    exitType: 'RESIGNATION', status: 'PENDING_CLEARANCE', noticePeriodDays: 30, noticePeriodServed: 30,
    clearance: [
      { id: 'c6',  department: 'IT',     item: 'Laptop & Equipment Return',  status: 'CLEARED', clearedBy: 'IT Team', icon: <Package size={14} /> },
      { id: 'c7',  department: 'Admin',  item: 'Access Card & ID Return',    status: 'CLEARED', clearedBy: 'Admin',   icon: <CreditCard size={14} /> },
      { id: 'c8',  department: 'HR',     item: 'Experience Letter Issued',   status: 'PENDING', icon: <FileText size={14} /> },
      { id: 'c9',  department: 'IT',     item: 'System Access Revoked',      status: 'CLEARED', clearedBy: 'IT Team', icon: <Shield size={14} /> },
      { id: 'c10', department: 'Finance', item: 'Full & Final Settlement',   status: 'PENDING', icon: <CreditCard size={14} /> },
    ],
  },
  {
    id: 'off3', employeeName: 'Rajesh Nair', empCode: 'EMP008', designation: 'Finance Manager',
    department: 'Finance', lastWorkingDate: '2026-05-31', resignationDate: '2026-04-30',
    exitType: 'RESIGNATION', status: 'COMPLETED', noticePeriodDays: 30, noticePeriodServed: 30,
    settlementAmount: 285000,
    clearance: [],
  },
];

const EXIT_COLORS: Record<string, string> = {
  RESIGNATION: 'hsl(var(--warning))', TERMINATION: 'hsl(var(--destructive))',
  RETIREMENT: 'hsl(var(--success))', CONTRACT_END: 'hsl(var(--muted-foreground))',
};

const STATUS_CFG: Record<ExitStatus, { color: string; bg: string; label: string }> = {
  NOTICE_PERIOD:      { color: 'hsl(var(--warning))',     bg: 'hsl(var(--warning)/0.1)',     label: 'Notice Period' },
  PENDING_CLEARANCE:  { color: 'hsl(var(--primary))',     bg: 'hsl(var(--primary)/0.1)',     label: 'Pending Clearance' },
  SETTLEMENT_PENDING: { color: 'hsl(var(--accent))',      bg: 'hsl(var(--accent)/0.1)',      label: 'Settlement Pending' },
  COMPLETED:          { color: 'hsl(var(--success))',     bg: 'hsl(var(--success)/0.1)',     label: 'Completed' },
};

const CLEARANCE_CFG: Record<ClearanceStatus, { color: string; bg: string; icon: React.ReactNode }> = {
  PENDING: { color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))',          icon: <Clock size={11} /> },
  CLEARED: { color: 'hsl(var(--success))',          bg: 'hsl(var(--success)/0.1)',    icon: <CheckCircle size={11} /> },
  WAIVED:  { color: 'hsl(var(--warning))',          bg: 'hsl(var(--warning)/0.1)',    icon: <AlertCircle size={11} /> },
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const OffboardingPage: React.FC = () => {
  const [offboardings, setOffboardings] = useState<OffboardingRecord[]>(MOCK_OFFBOARDINGS);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OffboardingRecord | null>(MOCK_OFFBOARDINGS[0] ?? null);

  const filtered = offboardings.filter(o =>
    !search || o.employeeName.toLowerCase().includes(search.toLowerCase()) || o.empCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleClearItem = (recordId: string, clearanceId: string) => {
    setOffboardings(obs => obs.map(ob => {
      if (ob.id !== recordId) return ob;
      const updated = { ...ob, clearance: ob.clearance.map(c => c.id === clearanceId ? { ...c, status: 'CLEARED' as ClearanceStatus, clearedBy: 'HR Admin' } : c) };
      // If all cleared, move to next status
      const allCleared = updated.clearance.every(c => c.status !== 'PENDING');
      return { ...updated, status: allCleared ? 'SETTLEMENT_PENDING' : updated.status };
    }));
    setSelected(prev => {
      if (!prev || prev.id !== recordId) return prev;
      const updated = { ...prev, clearance: prev.clearance.map(c => c.id === clearanceId ? { ...c, status: 'CLEARED' as ClearanceStatus, clearedBy: 'HR Admin' } : c) };
      return updated;
    });
  };

  const stats = {
    total: offboardings.length,
    notice: offboardings.filter(o => o.status === 'NOTICE_PERIOD').length,
    clearance: offboardings.filter(o => o.status === 'PENDING_CLEARANCE').length,
    completed: offboardings.filter(o => o.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--destructive)/0.1)]">
            <LogOut size={22} className="text-[hsl(var(--destructive))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Offboarding</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage exits, notice periods, clearance, and final settlements</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 shadow-md shadow-[hsl(var(--primary)/0.3)]">
          <Plus size={16} />Initiate Exit
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Exits (Month)', value: stats.total, color: 'var(--foreground)' },
          { label: 'Notice Period', value: stats.notice, color: 'var(--warning)' },
          { label: 'Pending Clearance', value: stats.clearance, color: 'var(--primary)' },
          { label: 'Completed', value: stats.completed, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* List */}
        <div className="xl:col-span-1 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          {filtered.map(ob => {
            const cfg = STATUS_CFG[ob.status];
            const noticePct = Math.min(100, Math.round((ob.noticePeriodServed / ob.noticePeriodDays) * 100));
            return (
              <div
                key={ob.id}
                onClick={() => setSelected(ob)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md ${selected?.id === ob.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)] shadow-sm' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{ob.employeeName}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{ob.designation} • {ob.empCode}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))]">
                    <div className="h-1.5 rounded-full" style={{ width: `${noticePct}%`, background: EXIT_COLORS[ob.exitType] }} />
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{ob.noticePeriodServed}/{ob.noticePeriodDays}d</span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">LWD: {ob.lastWorkingDate} • {ob.exitType.replace('_', ' ')}</p>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        {selected && (
          <div className="xl:col-span-2 space-y-4">
            {/* Info card */}
            <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--muted)/0.5)] flex items-center justify-center text-lg font-bold text-[hsl(var(--foreground))]">
                    {selected.employeeName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="font-bold text-[hsl(var(--foreground))]">{selected.employeeName}</h2>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{selected.designation} Â· {selected.department} Â· {selected.empCode}</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ color: EXIT_COLORS[selected.exitType], background: `${EXIT_COLORS[selected.exitType]}18` }}>
                  {selected.exitType.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Resignation Date', selected.resignationDate],
                  ['Last Working Day', selected.lastWorkingDate],
                  ['Notice Period', `${selected.noticePeriodDays} days`],
                ].map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-[hsl(var(--muted)/0.4)]">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-0.5">{k}</p>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{v}</p>
                  </div>
                ))}
              </div>
              {/* Notice progress */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1.5">
                  <span>Notice Period Progress</span>
                  <span>{selected.noticePeriodServed} of {selected.noticePeriodDays} days</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (selected.noticePeriodServed / selected.noticePeriodDays) * 100)}%`, background: EXIT_COLORS[selected.exitType] }} />
                </div>
              </div>
              {selected.settlementAmount && (
                <div className="mt-4 p-3 rounded-xl bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.2)]">
                  <p className="text-xs text-[hsl(var(--success))] font-semibold">âœ“ Settlement Paid: â‚¹{formatIST(selected.settlementAmount, 'PP pp')}</p>
                </div>
              )}
            </div>

            {/* Clearance */}
            {selected.clearance.length > 0 && (
              <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm p-5">
                <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4">Exit Clearance Checklist</h3>
                <div className="space-y-2">
                  {selected.clearance.map(item => {
                    const cfg = CLEARANCE_CFG[item.status];
                    return (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.2)] transition-colors">
                        <span style={{ color: cfg.color }}>{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{item.item}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">{item.department}{item.clearedBy ? ` • Cleared by: ${item.clearedBy}` : ''}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                          {cfg.icon}{item.status}
                        </span>
                        {item.status === 'PENDING' && (
                          <button
                            onClick={() => handleClearItem(selected.id, item.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] text-xs font-medium hover:bg-[hsl(var(--success)/0.2)] transition-colors shrink-0"
                          >
                            <CheckCircle size={11} />Mark Cleared
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selected.status === 'COMPLETED' && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.2)]">
                <CheckCircle size={20} className="text-[hsl(var(--success))] shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-[hsl(var(--foreground))]">Offboarding Complete</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">All clearance done and F&F settlement paid. Employee record archived.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OffboardingPage;

