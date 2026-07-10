// yss_orbit\frontend\src\pages\hrms\LeaveAnalyticsPage.tsx
import React, { useState } from 'react';
import {
  Calendar, TrendingUp, TrendingDown, BarChart3,
  AlertTriangle, CheckCircle, Users, Clock,
  Sun, Umbrella, Heart, Star, Coffee, Gift,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun'];

const LEAVE_USAGE_BY_MONTH = [
  { month: 'Jan', annual: 42, sick: 18, casual: 12, compOff: 4, total: 76 },
  { month: 'Feb', annual: 38, sick: 22, casual: 10, compOff: 3, total: 73 },
  { month: 'Mar', annual: 65, sick: 14, casual: 18, compOff: 6, total: 103 },
  { month: 'Apr', annual: 45, sick: 16, casual: 14, compOff: 5, total: 80 },
  { month: 'May', annual: 52, sick: 12, casual: 16, compOff: 8, total: 88 },
  { month: 'Jun', annual: 48, sick: 10, casual: 14, compOff: 4, total: 76 },
];

const LEAVE_BALANCE_SUMMARY = [
  { type: 'Annual Leave',  entitled: 21, avgUsed: 8.2, avgBalance: 12.8, color: 'hsl(var(--primary))' },
  { type: 'Sick Leave',    entitled: 12, avgUsed: 3.1, avgBalance: 8.9,  color: 'hsl(var(--destructive))' },
  { type: 'Casual Leave',  entitled: 12, avgUsed: 4.7, avgBalance: 7.3,  color: 'hsl(var(--accent))' },
  { type: 'Comp Off',      entitled: 6,  avgUsed: 1.8, avgBalance: 4.2,  color: 'hsl(var(--teal))' },
];

const DEPT_LEAVE = [
  { dept: 'Engineering', leaveDays: 312, perEmployee: 3.8, pending: 8 },
  { dept: 'Product',     leaveDays: 118, perEmployee: 4.2, pending: 3 },
  { dept: 'Design',      leaveDays: 74,  perEmployee: 4.1, pending: 2 },
  { dept: 'Analytics',   leaveDays: 95,  perEmployee: 4.3, pending: 4 },
  { dept: 'HR',          leaveDays: 42,  perEmployee: 3.0, pending: 1 },
  { dept: 'Finance',     leaveDays: 55,  perEmployee: 3.4, pending: 2 },
  { dept: 'Infra',       leaveDays: 48,  perEmployee: 4.0, pending: 1 },
  { dept: 'Sales',       leaveDays: 72,  perEmployee: 4.5, pending: 5 },
];

const PENDING_APPROVALS = [
  { name: 'Ravi Sharma',    dept: 'Engineering', type: 'Annual',  days: 5, from: '2026-06-16', to: '2026-06-20', status: 'PENDING',  age: '2 days' },
  { name: 'Priya Nair',     dept: 'Product',     type: 'Annual',  days: 3, from: '2026-06-18', to: '2026-06-20', status: 'PENDING',  age: '1 day' },
  { name: 'Kiran Rao',      dept: 'Analytics',   type: 'Sick',    days: 2, from: '2026-06-12', to: '2026-06-13', status: 'PENDING',  age: '4 days' },
  { name: 'Suman Das',      dept: 'Sales',       type: 'Annual',  days: 7, from: '2026-06-23', to: '2026-06-30', status: 'PENDING',  age: '3 days' },
  { name: 'Amrita Joshi',   dept: 'Design',      type: 'Casual',  days: 1, from: '2026-06-14', to: '2026-06-14', status: 'PENDING',  age: '1 day' },
  { name: 'Deepak Kumar',   dept: 'Finance',     type: 'Comp Off',days: 2, from: '2026-06-19', to: '2026-06-20', status: 'ESCALATED',age: '6 days' },
];

const LEAVE_HEATMAP: number[][] = [
  // 6 months × 5 weeks simplified as intensity values 0-10
  [2,1,3,2,1], [3,4,1,2,3], [8,6,4,3,5], [3,2,4,3,2],
  [4,3,5,4,3], [3,2,4,3,2],
];

const LEAVE_TYPE_DIST = [
  { type: 'Annual Leave',  days: 310, pct: 51.7, color: 'hsl(var(--primary))',     icon: <Sun size={13} /> },
  { type: 'Sick Leave',    days: 92,  pct: 15.3, color: 'hsl(var(--destructive))', icon: <Heart size={13} /> },
  { type: 'Casual Leave',  days: 84,  pct: 14.0, color: 'hsl(var(--accent))',      icon: <Coffee size={13} /> },
  { type: 'Maternity',     days: 68,  pct: 11.3, color: 'hsl(var(--teal))',        icon: <Gift size={13} /> },
  { type: 'Comp Off',      days: 46,  pct: 7.7,  color: 'hsl(var(--warning))',     icon: <Star size={13} /> },
];

// ─── Stacked Month Chart ──────────────────────────────────────────────────────

const LeaveMonthChart: React.FC = () => {
  const maxTotal = Math.max(...LEAVE_USAGE_BY_MONTH.map(d => d.total));
  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--teal))'];
  const W = 100; const H = 70; const barW = 10;
  const gap = (W - LEAVE_USAGE_BY_MONTH.length * barW) / (LEAVE_USAGE_BY_MONTH.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 8}`} className="w-full" style={{ height: 120 }}>
      {LEAVE_USAGE_BY_MONTH.map((d, i) => {
        const x = gap + i * (barW + gap);
        const segments = [d.annual, d.sick, d.casual, d.compOff];
        let y = H;
        return (
          <g key={d.month}>
            {segments.map((seg, j) => {
              const segH = (seg / maxTotal) * H;
              y -= segH;
              return <rect key={j} x={x} y={y} width={barW} height={segH} fill={COLORS[j]} rx={j === segments.length - 1 ? '1' : '0'} opacity="0.85" />;
            })}
            <text x={x + barW / 2} y={H + 7} textAnchor="middle" fontSize="4.5" fill="hsl(var(--muted-foreground))">{d.month}</text>
            <text x={x + barW / 2} y={H - (d.total / maxTotal) * H - 2} textAnchor="middle" fontSize="3.5" fill="hsl(var(--foreground))" fontWeight="600">{d.total}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Heatmap ──────────────────────────────────────────────────────────────────

const LeaveHeatmap: React.FC = () => {
  const intensityColor = (v: number) => {
    if (v === 0) return 'hsl(var(--muted))';
    if (v <= 2)  return 'hsl(var(--primary)/0.2)';
    if (v <= 4)  return 'hsl(var(--primary)/0.4)';
    if (v <= 6)  return 'hsl(var(--primary)/0.6)';
    if (v <= 8)  return 'hsl(var(--primary)/0.8)';
    return 'hsl(var(--primary))';
  };
  return (
    <div>
      <div className="grid grid-cols-6 gap-1 mb-1">
        {MONTHS.map(m => <span key={m} className="text-[9px] text-center text-[hsl(var(--muted-foreground))] font-medium">{m}</span>)}
      </div>
      {[0,1,2,3,4].map(week => (
        <div key={week} className="grid grid-cols-6 gap-1 mb-1">
          {LEAVE_HEATMAP.map((monthData, mi) => (
            <div key={mi} className="h-5 rounded-sm transition-colors" style={{ background: intensityColor(monthData[week] ?? 0) }} title={`${MONTHS[mi]} Week ${week + 1}: ${monthData[week]} leave days`} />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-1 mt-2 text-[9px] text-[hsl(var(--muted-foreground))]">
        <span>Less</span>
        {[0,2,4,6,8,10].map(v => <div key={v} className="w-3 h-3 rounded-sm" style={{ background: intensityColor(v) }} />)}
        <span>More</span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const LeaveAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dept' | 'pending' | 'balance'>('overview');

  const totalLeaveDays  = LEAVE_USAGE_BY_MONTH.reduce((s, d) => s + d.total, 0);
  const pendingCount    = PENDING_APPROVALS.length;
  const escalatedCount  = PENDING_APPROVALS.filter(p => p.status === 'ESCALATED').length;
  const avgLeavePerEmp  = (totalLeaveDays / 208).toFixed(1);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'overview', label: 'Usage Overview' },
    { key: 'dept',     label: 'By Department' },
    { key: 'pending',  label: `Pending (${pendingCount})` },
    { key: 'balance',  label: 'Balance Summary' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[hsl(var(--accent)/0.12)]"><Calendar size={22} className="text-[hsl(var(--accent))]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Leave Analytics</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Utilization, balances & approvals · FY 2026-27</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Leave Days (YTD)', value: totalLeaveDays,   sub: 'All leave types',            color: 'var(--primary)',     icon: <Calendar size={18} /> },
          { label: 'Avg per Employee', value: avgLeavePerEmp,   sub: 'Days taken YTD',             color: 'var(--teal)',        icon: <Users size={18} /> },
          { label: 'Pending Approvals',value: pendingCount,     sub: `${escalatedCount} escalated`,color: 'var(--warning)',     icon: <Clock size={18} /> },
          { label: 'Peak Leave Month', value: 'March',          sub: '103 days taken',             color: 'var(--accent)',      icon: <TrendingUp size={18} /> },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 rounded-lg" style={{ background: `hsl(${s.color}/0.12)`, color: `hsl(${s.color})` }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.label}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1 mb-5 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{t.label}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Monthly Leave Usage</h3>
                <div className="flex gap-3 text-[10px]">
                  {[['Annual','var(--primary)'],['Sick','var(--destructive)'],['Casual','var(--accent)'],['Comp Off','var(--teal)']].map(([l,c]) => (
                    <span key={l} className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded-full inline-block" style={{ background: `hsl(${c})` }} />{l}</span>
                  ))}
                </div>
              </div>
              <LeaveMonthChart />
            </div>
            <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Leave Heatmap — YTD</h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">Intensity of leave taken per month × week</p>
              <LeaveHeatmap />
            </div>
          </div>
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Leave Type Distribution</h3>
            <div className="space-y-4">
              {LEAVE_TYPE_DIST.map(t => (
                <div key={t.type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg" style={{ background: `${t.color}18`, color: t.color }}>{t.icon}</div>
                      <span className="text-xs font-medium text-[hsl(var(--foreground))]">{t.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ color: t.color }}>{t.days} days</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t.pct}%</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.pct}%`, background: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* By Department */}
      {activeTab === 'dept' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Leave Consumption by Department (YTD)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  {['Department','Total Days','Per Employee','Pending','Utilization Bar'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPT_LEAVE.sort((a, b) => b.leaveDays - a.leaveDays).map(d => {
                  const maxDays = Math.max(...DEPT_LEAVE.map(x => x.leaveDays));
                  return (
                    <tr key={d.dept} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-[hsl(var(--foreground))]">{d.dept}</td>
                      <td className="py-2.5 pr-4 font-semibold text-[hsl(var(--primary))]">{d.leaveDays}</td>
                      <td className="py-2.5 pr-4 text-[hsl(var(--foreground))]">{d.perEmployee} days</td>
                      <td className="py-2.5 pr-4">
                        {d.pending > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]">{d.pending} pending</span>}
                      </td>
                      <td className="py-2.5 pr-4 w-32">
                        <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                          <div className="h-full rounded-full bg-[hsl(var(--primary))]" style={{ width: `${(d.leaveDays / maxDays) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-3">
          {escalatedCount > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--destructive)/0.08)] border border-[hsl(var(--destructive)/0.2)]">
              <AlertTriangle size={16} className="text-[hsl(var(--destructive))] shrink-0" />
              <p className="text-sm text-[hsl(var(--destructive))] font-medium">{escalatedCount} leave request{escalatedCount > 1 ? 's' : ''} escalated — pending for more than 5 days</p>
            </div>
          )}
          {PENDING_APPROVALS.map((p, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl border shadow-sm ${p.status === 'ESCALATED' ? 'bg-[hsl(var(--destructive)/0.05)] border-[hsl(var(--destructive)/0.3)]' : 'bg-[hsl(var(--card))] border-[hsl(var(--border))]'}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {p.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{p.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.dept} · {p.type} · {p.days} day{p.days > 1 ? 's' : ''}</p>
                  <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono">{p.from} → {p.to}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === 'ESCALATED' ? 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]' : 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]'}`}>
                  {p.status} · {p.age}
                </span>
                <div className="flex gap-1">
                  <button className="px-2.5 py-1.5 rounded-lg bg-[hsl(var(--success))] text-white text-xs font-semibold hover:opacity-90 transition-all">Approve</button>
                  <button className="px-2.5 py-1.5 rounded-lg border border-[hsl(var(--destructive)/0.4)] text-[hsl(var(--destructive))] text-xs font-semibold hover:bg-[hsl(var(--destructive)/0.05)] transition-all">Reject</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Balance Summary */}
      {activeTab === 'balance' && (
        <div className="space-y-4">
          {LEAVE_BALANCE_SUMMARY.map(lb => (
            <div key={lb.type} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{lb.type}</h3>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Entitled: {lb.entitled} days/year</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {[
                  { label: 'Entitled', value: lb.entitled, color: 'var(--muted-foreground)' },
                  { label: 'Avg Used',    value: lb.avgUsed,    color: lb.color.replace('hsl(', '').replace(')', '') },
                  { label: 'Avg Balance', value: lb.avgBalance, color: 'var(--success)' },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-[hsl(var(--muted)/0.4)]">
                    <p className="text-lg font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(lb.avgUsed / lb.entitled) * 100}%`, background: lb.color }} />
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">{((lb.avgUsed / lb.entitled) * 100).toFixed(0)}% utilisation across org</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveAnalyticsPage;
