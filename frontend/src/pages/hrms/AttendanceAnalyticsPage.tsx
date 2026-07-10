// yss_orbit\frontend\src\pages\hrms\AttendanceAnalyticsPage.tsx
import React, { useState } from 'react';
import {
  Clock, TrendingUp, TrendingDown, BarChart3,
  AlertTriangle, CheckCircle, Users, Calendar,
  ArrowUp, ArrowDown, Wifi, WifiOff,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const DAILY_PUNCH = [
  { day: 'Mon', present: 192, late: 12, wfh: 38, absent: 8 },
  { day: 'Tue', present: 196, late: 8,  wfh: 41, absent: 4 },
  { day: 'Wed', present: 194, late: 14, wfh: 39, absent: 6 },
  { day: 'Thu', present: 198, late: 6,  wfh: 42, absent: 2 },
  { day: 'Fri', present: 188, late: 10, wfh: 51, absent: 11 },
];

const MONTHLY_ATT = [
  { month: 'Jan', pct: 94.2, late: 8.1, wfh: 21.2, absent: 5.8 },
  { month: 'Feb', pct: 95.1, late: 7.4, wfh: 22.1, absent: 4.9 },
  { month: 'Mar', pct: 93.8, late: 9.2, wfh: 20.8, absent: 6.2 },
  { month: 'Apr', pct: 95.6, late: 6.8, wfh: 23.4, absent: 4.4 },
  { month: 'May', pct: 96.1, late: 6.1, wfh: 24.2, absent: 3.9 },
  { month: 'Jun', pct: 95.8, late: 6.4, wfh: 25.5, absent: 4.2 },
];

const DEPT_ATT = [
  { dept: 'Engineering', pct: 96.2, wfhPct: 28, latePct: 5.1 },
  { dept: 'Product',     pct: 97.4, wfhPct: 32, latePct: 3.8 },
  { dept: 'Design',      pct: 95.8, wfhPct: 24, latePct: 6.2 },
  { dept: 'Analytics',   pct: 94.1, wfhPct: 20, latePct: 8.4 },
  { dept: 'HR',          pct: 98.2, wfhPct: 10, latePct: 1.8 },
  { dept: 'Finance',     pct: 97.9, wfhPct: 8,  latePct: 2.1 },
  { dept: 'Infra',       pct: 95.3, wfhPct: 41, latePct: 4.8 },
  { dept: 'Sales',       pct: 93.4, wfhPct: 6,  latePct: 9.6 },
];

const LATE_REASONS = [
  { reason: 'Traffic / Commute',  count: 42, pct: 48, color: 'hsl(var(--warning))' },
  { reason: 'Personal Reason',    count: 22, pct: 25, color: 'hsl(var(--accent))' },
  { reason: 'Meetings Running Late', count: 14, pct: 16, color: 'hsl(var(--primary))' },
  { reason: 'Health Issue',       count: 9,  pct: 10, color: 'hsl(var(--destructive))' },
];

const FREQUENT_LATE = [
  { name: 'Priya Sharma',   dept: 'Analytics',   lateCount: 8, avgDelay: '22 min' },
  { name: 'Karan Mehta',    dept: 'Engineering',  lateCount: 6, avgDelay: '18 min' },
  { name: 'Suman Das',      dept: 'Sales',        lateCount: 9, avgDelay: '31 min' },
  { name: 'Anita Reddy',    dept: 'Analytics',   lateCount: 7, avgDelay: '25 min' },
  { name: 'Rohit Kulkarni', dept: 'Design',       lateCount: 5, avgDelay: '14 min' },
];

const CHECKIN_DIST = [
  { slot: '< 8:30',   count: 18, color: 'hsl(var(--teal))' },
  { slot: '8:30–9:00',count: 82, color: 'hsl(var(--success))' },
  { slot: '9:00–9:15',count: 64, color: 'hsl(var(--primary))' },
  { slot: '9:15–9:30',count: 26, color: 'hsl(var(--warning))' },
  { slot: '> 9:30',   count: 12, color: 'hsl(var(--destructive))' },
];

// ─── Stacked Bar (weekly) ────────────────────────────────────────────────────

const WeeklyStackedBar: React.FC = () => {
  const maxTotal = 208;
  return (
    <div className="space-y-3">
      {DAILY_PUNCH.map(d => {
        const presentPct = (d.present / maxTotal) * 100;
        const latePct    = (d.late    / maxTotal) * 100;
        const wfhPct     = (d.wfh     / maxTotal) * 100;
        const absentPct  = (d.absent  / maxTotal) * 100;
        return (
          <div key={d.day} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[hsl(var(--foreground))] w-8">{d.day}</span>
            <div className="flex-1 h-6 rounded-lg overflow-hidden flex">
              <div className="h-full bg-[hsl(var(--success))] transition-all" style={{ width: `${presentPct}%` }} title={`Present: ${d.present}`} />
              <div className="h-full bg-[hsl(var(--warning))] transition-all" style={{ width: `${latePct}%` }} title={`Late: ${d.late}`} />
              <div className="h-full bg-[hsl(var(--primary)/0.6)] transition-all" style={{ width: `${wfhPct}%` }} title={`WFH: ${d.wfh}`} />
              <div className="h-full bg-[hsl(var(--destructive)/0.7)] transition-all" style={{ width: `${absentPct}%` }} title={`Absent: ${d.absent}`} />
            </div>
            <div className="flex gap-3 text-[10px] w-44">
              <span className="text-[hsl(var(--success))] font-medium">P:{d.present}</span>
              <span className="text-[hsl(var(--warning))]">L:{d.late}</span>
              <span className="text-[hsl(var(--primary))]">W:{d.wfh}</span>
              <span className="text-[hsl(var(--destructive))]">A:{d.absent}</span>
            </div>
          </div>
        );
      })}
      <div className="flex gap-4 mt-2 text-[10px] text-[hsl(var(--muted-foreground))]">
        {[
          { label: 'Present', color: 'hsl(var(--success))' },
          { label: 'Late',    color: 'hsl(var(--warning))' },
          { label: 'WFH',     color: 'hsl(var(--primary)/0.6)' },
          { label: 'Absent',  color: 'hsl(var(--destructive)/0.7)' },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ─── Trend Line ───────────────────────────────────────────────────────────────

const AttTrendLine: React.FC = () => {
  const W = 100; const H = 50;
  const vals = MONTHLY_ATT.map(d => d.pct);
  const min = 92; const max = 98;
  const toX = (i: number) => (i / (vals.length - 1)) * W;
  const toY = (v: number) => H - ((v - min) / (max - min)) * H;
  const pts = vals.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const area = `M${toX(0)},${H} ` + vals.map((v, i) => `L${toX(i)},${toY(v)}`).join(' ') + ` L${toX(vals.length - 1)},${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }}>
        <defs>
          <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#attGrad)" />
        <polyline points={pts} fill="none" stroke="hsl(var(--success))" strokeWidth="1.5" strokeLinecap="round" />
        {vals.map((v, i) => (
          <g key={i}>
            <circle cx={toX(i)} cy={toY(v)} r="2" fill="hsl(var(--success))" />
            <text x={toX(i)} y={toY(v) - 4} textAnchor="middle" fontSize="4" fill="hsl(var(--foreground))" fontWeight="600">{v}%</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between">
        {MONTHLY_ATT.map(d => <span key={d.month} className="text-[10px] text-[hsl(var(--muted-foreground))]">{d.month}</span>)}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const AttendanceAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dept' | 'late' | 'checkin'>('overview');

  const avgAtt  = (MONTHLY_ATT.reduce((s, d) => s + d.pct, 0) / MONTHLY_ATT.length).toFixed(1);
  const avgLate = (MONTHLY_ATT.reduce((s, d) => s + d.late, 0) / MONTHLY_ATT.length).toFixed(1);
  const avgWFH  = (MONTHLY_ATT.reduce((s, d) => s + d.wfh, 0)  / MONTHLY_ATT.length).toFixed(1);
  const currentAtt = MONTHLY_ATT[MONTHLY_ATT.length - 1]!;

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'overview', label: 'Weekly View' },
    { key: 'dept',     label: 'By Department' },
    { key: 'late',     label: 'Late Analysis' },
    { key: 'checkin',  label: 'Check-In Distribution' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-[hsl(var(--teal)/0.12)]"><Clock size={22} className="text-[hsl(var(--teal))]" /></div>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Attendance Analytics</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Punch trends, WFH, late arrivals · FY 2026-27</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Avg Attendance',   value: `${avgAtt}%`,   sub: 'YTD average',             color: 'var(--success)',            icon: <CheckCircle size={18} /> },
          { label: 'Late Arrivals',    value: `${avgLate}%`,  sub: 'Of daily headcount',       color: 'var(--warning)',            icon: <Clock size={18} /> },
          { label: 'WFH Utilisation', value: `${avgWFH}%`,   sub: 'Days worked from home',    color: 'var(--primary)',            icon: <Wifi size={18} /> },
          { label: 'Jun Absenteeism', value: `${currentAtt.absent}%`, sub: 'Current month',   color: 'var(--destructive)',        icon: <WifiOff size={18} /> },
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

      {/* Monthly Trend Line */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm mb-4">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Monthly Attendance Rate Trend</h3>
        <AttTrendLine />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1 mb-5 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{t.label}</button>
        ))}
      </div>

      {/* Weekly View */}
      {activeTab === 'overview' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">This Week — Daily Breakdown</h3>
          <WeeklyStackedBar />
        </div>
      )}

      {/* By Department */}
      {activeTab === 'dept' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Attendance by Department (Jun 2026)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[hsl(var(--border))]">
                  {['Department','Attendance %','WFH %','Late %','Status'].map(h => (
                    <th key={h} className="text-left py-2 pr-4 text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEPT_ATT.sort((a, b) => b.pct - a.pct).map(d => (
                  <tr key={d.dept} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-[hsl(var(--foreground))]">{d.dept}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                          <div className="h-full rounded-full bg-[hsl(var(--success))]" style={{ width: `${d.pct}%` }} />
                        </div>
                        <span className={`font-semibold ${d.pct >= 96 ? 'text-[hsl(var(--success))]' : d.pct >= 94 ? 'text-[hsl(var(--warning))]' : 'text-[hsl(var(--destructive))]'}`}>{d.pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-[hsl(var(--primary))]">{d.wfhPct}%</td>
                    <td className="py-2.5 pr-4 text-[hsl(var(--warning))]">{d.latePct}%</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${d.pct >= 96 ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]' : d.pct >= 94 ? 'bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]' : 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]'}`}>
                        {d.pct >= 96 ? '✓ Good' : d.pct >= 94 ? '⚠ Monitor' : '✕ Alert'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Late Analysis */}
      {activeTab === 'late' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Late Arrival Reasons (YTD)</h3>
            <div className="space-y-4">
              {LATE_REASONS.map(r => (
                <div key={r.reason}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[hsl(var(--foreground))]">{r.reason}</span>
                    <span className="font-semibold" style={{ color: r.color }}>{r.count} ({r.pct}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${r.pct}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Frequent Late Arrivals (Top 5)</h3>
            <div className="space-y-3">
              {FREQUENT_LATE.map((e, i) => (
                <div key={e.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-[hsl(var(--muted)/0.4)] border border-[hsl(var(--border))]">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${i === 0 ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--warning))]'}`}>{i + 1}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{e.name}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{e.dept}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[hsl(var(--destructive))]">{e.lateCount}x late</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Avg {e.avgDelay}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Check-In Distribution */}
      {activeTab === 'checkin' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-1">Check-In Time Distribution</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5">Office shift start: 9:00 AM · Grace period: 9:15 AM</p>
          <div className="flex items-end gap-4 h-40 mb-4">
            {CHECKIN_DIST.map(d => {
              const maxCount = Math.max(...CHECKIN_DIST.map(x => x.count));
              const barH = (d.count / maxCount) * 130;
              return (
                <div key={d.slot} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: d.color }}>{d.count}</span>
                  <div className="w-full rounded-t-lg transition-all duration-700" style={{ height: barH, background: d.color, opacity: 0.85 }} />
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] text-center leading-tight">{d.slot}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="p-3 rounded-xl bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.2)]">
              <p className="text-sm font-bold text-[hsl(var(--success))]">78.8%</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">On-time or early (before 9:15)</p>
            </div>
            <div className="p-3 rounded-xl bg-[hsl(var(--destructive)/0.08)] border border-[hsl(var(--destructive)/0.2)]">
              <p className="text-sm font-bold text-[hsl(var(--destructive))]">5.8%</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">More than 30 min late (after 9:30)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAnalyticsPage;
