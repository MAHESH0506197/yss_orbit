// yss_orbit\frontend\src\pages\hrms\HRAnalyticsPage.tsx
import React, { useState } from 'react';
import {
  Users, TrendingUp, TrendingDown, UserPlus, UserMinus,
  Building2, BarChart3, PieChart, Activity, Calendar,
  ArrowUp, ArrowDown, Minus, Target, Award, AlertTriangle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'YTD';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const HEADCOUNT_TREND = [
  { month: 'Jan', total: 182, new: 8,  exits: 3 },
  { month: 'Feb', total: 187, new: 6,  exits: 1 },
  { month: 'Mar', total: 193, new: 9,  exits: 3 },
  { month: 'Apr', total: 199, new: 7,  exits: 1 },
  { month: 'May', total: 204, new: 6,  exits: 1 },
  { month: 'Jun', total: 208, new: 5,  exits: 1 },
];

const DEPT_BREAKDOWN = [
  { dept: 'Engineering',  count: 82,  pct: 39.4, color: 'hsl(var(--primary))' },
  { dept: 'Product',      count: 28,  pct: 13.5, color: 'hsl(var(--accent))' },
  { dept: 'Design',       count: 18,  pct: 8.7,  color: 'hsl(var(--teal))' },
  { dept: 'Analytics',    count: 22,  pct: 10.6, color: 'hsl(var(--warning))' },
  { dept: 'HR',           count: 14,  pct: 6.7,  color: 'hsl(var(--success))' },
  { dept: 'Finance',      count: 16,  pct: 7.7,  color: 'hsl(var(--destructive))' },
  { dept: 'Infra',        count: 12,  pct: 5.8,  color: '#8b5cf6' },
  { dept: 'Sales',        count: 16,  pct: 7.7,  color: '#f97316' },
];

const ATTRITION_BY_DEPT = [
  { dept: 'Engineering',  attrition: 4.2, industry: 6.0 },
  { dept: 'Product',      attrition: 3.5, industry: 5.5 },
  { dept: 'Design',       attrition: 2.8, industry: 5.0 },
  { dept: 'Analytics',    attrition: 5.1, industry: 6.5 },
  { dept: 'HR',           attrition: 6.0, industry: 7.0 },
  { dept: 'Finance',      attrition: 3.2, industry: 4.5 },
];

const GENDER_DIST = [
  { label: 'Male',    value: 131, pct: 63, color: 'hsl(var(--primary))' },
  { label: 'Female',  value: 71,  pct: 34, color: 'hsl(var(--accent))' },
  { label: 'Other',   value: 6,   pct: 3,  color: 'hsl(var(--teal))' },
];

const EMP_TYPE = [
  { label: 'Full-Time',  value: 178, pct: 85.6, color: 'hsl(var(--success))' },
  { label: 'Contract',   value: 18,  pct: 8.7,  color: 'hsl(var(--warning))' },
  { label: 'Intern',     value: 12,  pct: 5.8,  color: 'hsl(var(--muted-foreground))' },
];

const TENURE_BANDS = [
  { label: '< 1 yr',   count: 38,  color: 'hsl(var(--primary))' },
  { label: '1–3 yrs',  count: 72,  color: 'hsl(var(--teal))' },
  { label: '3–5 yrs',  count: 54,  color: 'hsl(var(--accent))' },
  { label: '5–8 yrs',  count: 30,  color: 'hsl(var(--warning))' },
  { label: '8+ yrs',   count: 14,  color: 'hsl(var(--success))' },
];

const RECENT_EXITS = [
  { name: 'Kartik Nair',    dept: 'Engineering', reason: 'Better Opportunity', date: '2026-06-01', type: 'VOLUNTARY' },
  { name: 'Sonia Aggarwal', dept: 'Analytics',   reason: 'Higher Studies',     date: '2026-05-20', type: 'VOLUNTARY' },
  { name: 'Ravi Pillai',    dept: 'HR',          reason: 'Personal Reasons',   date: '2026-05-15', type: 'VOLUNTARY' },
  { name: 'Neha Joshi',     dept: 'Finance',      reason: 'Relocation',        date: '2026-04-30', type: 'VOLUNTARY' },
];

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────

const MiniBarChart: React.FC<{ data: { label: string; value: number; color: string }[]; maxVal?: number }> = ({ data, maxVal }) => {
  const max = maxVal ?? Math.max(...data.map(d => d.value));
  return (
    <div className="space-y-2.5">
      {data.map(d => (
        <div key={d.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[hsl(var(--foreground))] font-medium">{d.label}</span>
            <span className="text-[hsl(var(--muted-foreground))]">{d.value}</span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${(d.value / max) * 100}%`, background: d.color }} />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Trend Line (SVG sparkline) ───────────────────────────────────────────────

const Sparkline: React.FC<{ values: number[]; color: string; height?: number }> = ({ values, color, height = 40 }) => {
  const w = 160; const h = height;
  const min = Math.min(...values); const max = Math.max(...values);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts.split(' ').pop()!.split(',')[0]} cy={pts.split(' ').pop()!.split(',')[1]} r="3" fill={color} />
    </svg>
  );
};

// ─── Headcount Area Chart (SVG) ───────────────────────────────────────────────

const HeadcountChart: React.FC = () => {
  const W = 100; const H = 80;
  const totals = HEADCOUNT_TREND.map(d => d.total);
  const min = Math.min(...totals) - 5; const max = Math.max(...totals) + 5;
  const toX = (i: number) => (i / (totals.length - 1)) * W;
  const toY = (v: number) => H - ((v - min) / (max - min)) * H;
  const pts = totals.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPath = `M${toX(0)},${H} ` + totals.map((v, i) => `L${toX(i)},${toY(v)}`).join(' ') + ` L${toX(totals.length - 1)},${H} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 100 }}>
        <defs>
          <linearGradient id="hcGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#hcGrad)" />
        <polyline points={pts} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {totals.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="1.5" fill="hsl(var(--primary))" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {HEADCOUNT_TREND.map(d => (
          <span key={d.month} className="text-[10px] text-[hsl(var(--muted-foreground))]">{d.month}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Donut Chart (SVG) ────────────────────────────────────────────────────────

const DonutChart: React.FC<{ data: { label: string; value: number; pct: number; color: string }[]; size?: number }> = ({ data, size = 100 }) => {
  const r = 36; const cx = size / 2; const cy = size / 2;
  let cumAngle = -90;
  const slices = data.map(d => {
    const angle = (d.pct / 100) * 360;
    const start = cumAngle; cumAngle += angle;
    const startRad = (start * Math.PI) / 180;
    const endRad = (cumAngle * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad); const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);   const y2 = cy + r * Math.sin(endRad);
    const large = angle > 180 ? 1 : 0;
    return { ...d, path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z` };
  });
  return (
    <svg width={size} height={size}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.9" />)}
      <circle cx={cx} cy={cy} r={22} fill="hsl(var(--card))" />
    </svg>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const HRAnalyticsPage: React.FC = () => {
  const [period, setPeriod] = useState<Period>('YTD');

  const currentHC = HEADCOUNT_TREND[HEADCOUNT_TREND.length - 1]!.total;
  const prevHC    = HEADCOUNT_TREND[0]!.total;
  const hcGrowth  = Math.round(((currentHC - prevHC) / prevHC) * 100);
  const totalNewHires = HEADCOUNT_TREND.reduce((s, d) => s + d.new, 0);
  const totalExits    = HEADCOUNT_TREND.reduce((s, d) => s + d.exits, 0);
  const attritionRate = ((totalExits / currentHC) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.12)]">
            <BarChart3 size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">HR Analytics</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Workforce insights · FY 2026-27</p>
          </div>
        </div>
        <div className="flex gap-1 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1">
          {(['Q1','Q2','Q3','Q4','YTD'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${period === p ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Headcount',  value: currentHC,      sub: `+${hcGrowth}% vs Jan`,    color: 'var(--primary)',     icon: <Users size={18} />,      trend: 'up' },
          { label: 'New Hires (YTD)', value: totalNewHires,   sub: 'Across all depts',          color: 'var(--success)',     icon: <UserPlus size={18} />,   trend: 'up' },
          { label: 'Exits (YTD)',     value: totalExits,       sub: 'All voluntary',             color: 'var(--destructive)', icon: <UserMinus size={18} />,  trend: 'down' },
          { label: 'Attrition Rate',  value: `${attritionRate}%`, sub: 'Industry avg: 6.2%',   color: 'var(--warning)',     icon: <TrendingDown size={18} />, trend: 'neutral' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ background: `hsl(${s.color}/0.12)`, color: `hsl(${s.color})` }}>{s.icon}</div>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${s.trend === 'up' ? 'text-[hsl(var(--success))] bg-[hsl(var(--success)/0.1)]' : s.trend === 'down' ? 'text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.1)]' : 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]'}`}>
                {s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.label}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Row 2: Headcount trend + Dept breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Headcount Trend */}
        <div className="lg:col-span-2 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Headcount Trend — Jan–Jun 2026</h3>
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-[hsl(var(--primary))] inline-block" />Total</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-[hsl(var(--success))] inline-block" />New Hires</span>
              <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-[hsl(var(--destructive))] inline-block" />Exits</span>
            </div>
          </div>
          <HeadcountChart />
          <div className="grid grid-cols-6 gap-2 mt-3">
            {HEADCOUNT_TREND.map(d => (
              <div key={d.month} className="text-center">
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">+{d.new} / -{d.exits}</p>
                <p className="text-xs font-bold text-[hsl(var(--foreground))]">{d.total}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dept Breakdown */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">By Department</h3>
          <div className="flex justify-center mb-4">
            <DonutChart data={DEPT_BREAKDOWN.map(d => ({ label: d.dept, value: d.count, pct: d.pct, color: d.color }))} size={120} />
          </div>
          <div className="space-y-2">
            {DEPT_BREAKDOWN.map(d => (
              <div key={d.dept} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-[hsl(var(--foreground))]">{d.dept}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${d.pct}%`, background: d.color }} />
                  </div>
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))] w-8 text-right">{d.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Attrition + Gender + Tenure + Employment Type */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
        {/* Attrition by dept */}
        <div className="lg:col-span-2 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-1">Attrition vs Industry Avg</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">YTD annualised attrition rate (%)</p>
          <div className="space-y-3">
            {ATTRITION_BY_DEPT.map(d => (
              <div key={d.dept}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[hsl(var(--foreground))]">{d.dept}</span>
                  <span className={`font-semibold ${d.attrition < d.industry ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--warning))]'}`}>{d.attrition}%</span>
                </div>
                <div className="relative h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div className="absolute h-full rounded-full bg-[hsl(var(--primary)/0.3)]" style={{ width: `${(d.industry / 10) * 100}%` }} />
                  <div className={`absolute h-full rounded-full ${d.attrition < d.industry ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--warning))]'}`} style={{ width: `${(d.attrition / 10) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-[hsl(var(--primary)/0.3)] inline-block" />Industry Avg</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-[hsl(var(--success))] inline-block" />Our Rate (Below avg)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-[hsl(var(--warning))] inline-block" />Our Rate (Above avg)</span>
          </div>
        </div>

        {/* Gender */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Gender Distribution</h3>
          <div className="flex justify-center mb-3">
            <DonutChart data={GENDER_DIST} size={100} />
          </div>
          <div className="space-y-2">
            {GENDER_DIST.map(g => (
              <div key={g.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ background: g.color }} /><span>{g.label}</span></div>
                <span className="font-semibold" style={{ color: g.color }}>{g.value} ({g.pct}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Employment Type */}
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Employment Type</h3>
          <div className="space-y-3 mb-4">
            {EMP_TYPE.map(e => (
              <div key={e.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[hsl(var(--foreground))]">{e.label}</span>
                  <span className="font-semibold" style={{ color: e.color }}>{e.value}</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${e.pct}%`, background: e.color }} />
                </div>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Tenure Bands</h3>
          <MiniBarChart data={TENURE_BANDS.map(t => ({ label: t.label, value: t.count, color: t.color }))} />
        </div>
      </div>

      {/* Row 4: Recent Exits */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
        <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Recent Exits</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                {['Employee','Department','Exit Reason','Date','Type'].map(h => (
                  <th key={h} className="text-left py-2 pr-4 text-[hsl(var(--muted-foreground))] font-semibold uppercase tracking-wide text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_EXITS.map((e, i) => (
                <tr key={i} className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <td className="py-2.5 pr-4 font-medium text-[hsl(var(--foreground))]">{e.name}</td>
                  <td className="py-2.5 pr-4 text-[hsl(var(--muted-foreground))]">{e.dept}</td>
                  <td className="py-2.5 pr-4 text-[hsl(var(--foreground))]">{e.reason}</td>
                  <td className="py-2.5 pr-4 font-mono text-[hsl(var(--muted-foreground))]">{e.date}</td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]">{e.type}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HRAnalyticsPage;
