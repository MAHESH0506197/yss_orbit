// yss_orbit\frontend\src\pages\hrms\PayrollAnalyticsPage.tsx
import React, { useState } from 'react';
import { formatIST } from '@/utils/date';
import {
  CreditCard, TrendingUp, TrendingDown, BarChart3,
  IndianRupee, Users, Shield, AlertCircle, Download,
  ArrowUp, ArrowDown, Building2,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MONTHLY_COST = [
  { month: 'Jan', gross: 2_82_50_000, net: 2_30_40_000, pf: 19_80_000, esi: 3_10_000, tds: 28_40_000 },
  { month: 'Feb', gross: 2_85_00_000, net: 2_32_10_000, pf: 20_10_000, esi: 3_20_000, tds: 28_80_000 },
  { month: 'Mar', gross: 3_10_50_000, net: 2_50_20_000, pf: 21_80_000, esi: 3_40_000, tds: 34_10_000 },
  { month: 'Apr', gross: 2_88_00_000, net: 2_34_50_000, pf: 20_40_000, esi: 3_20_000, tds: 29_50_000 },
  { month: 'May', gross: 2_92_50_000, net: 2_38_10_000, pf: 20_70_000, esi: 3_30_000, tds: 30_10_000 },
  { month: 'Jun', gross: 2_95_00_000, net: 2_40_60_000, pf: 21_00_000, esi: 3_30_000, tds: 29_80_000 },
];

const DEPT_COST = [
  { dept: 'Engineering', cost: 1_04_20_000, hc: 82,  avgCTC: '₹15.1L', color: 'hsl(var(--primary))' },
  { dept: 'Product',     cost: 44_80_000,   hc: 28,  avgCTC: '₹19.1L', color: 'hsl(var(--accent))' },
  { dept: 'Design',      cost: 22_50_000,   hc: 18,  avgCTC: '₹15.0L', color: 'hsl(var(--teal))' },
  { dept: 'Analytics',   cost: 26_40_000,   hc: 22,  avgCTC: '₹14.4L', color: 'hsl(var(--warning))' },
  { dept: 'HR',          cost: 14_00_000,   hc: 14,  avgCTC: '₹12.0L', color: 'hsl(var(--success))' },
  { dept: 'Finance',     cost: 17_60_000,   hc: 16,  avgCTC: '₹13.2L', color: 'hsl(var(--destructive))' },
  { dept: 'Infra',       cost: 15_60_000,   hc: 12,  avgCTC: '₹15.6L', color: '#8b5cf6' },
  { dept: 'Sales',       cost: 19_20_000,   hc: 16,  avgCTC: '₹14.4L', color: '#f97316' },
];

const STATUTORY = [
  { label: 'Employer PF (12%)', ytd: '₹1,25,80,000', trend: '+4.2%', color: 'hsl(var(--primary))' },
  { label: 'Employee PF (12%)', ytd: '₹1,25,80,000', trend: '+4.2%', color: 'hsl(var(--teal))' },
  { label: 'Employer ESI (3.25%)', ytd: '₹19,50,000', trend: '+2.1%', color: 'hsl(var(--accent))' },
  { label: 'Employee ESI (0.75%)', ytd: '₹4,50,000',  trend: '+2.1%', color: 'hsl(var(--warning))' },
  { label: 'Professional Tax', ytd: '₹8,40,000',      trend: '0.0%',  color: 'hsl(var(--muted-foreground))' },
  { label: 'TDS Deducted',     ytd: '₹1,80,70,000',   trend: '+6.8%', color: 'hsl(var(--destructive))' },
  { label: 'Labour Welfare Fund', ytd: '₹83,000',     trend: '0.0%',  color: 'hsl(var(--success))' },
];

const CTC_BANDS = [
  { band: '< ₹6L',    count: 12, pct: 5.8,  color: 'hsl(var(--muted-foreground))' },
  { band: '₹6–10L',   count: 38, pct: 18.3, color: 'hsl(var(--success))' },
  { band: '₹10–16L',  count: 74, pct: 35.6, color: 'hsl(var(--primary))' },
  { band: '₹16–24L',  count: 52, pct: 25.0, color: 'hsl(var(--accent))' },
  { band: '₹24–36L',  count: 22, pct: 10.6, color: 'hsl(var(--warning))' },
  { band: '> ₹36L',   count: 10, pct: 4.8,  color: 'hsl(var(--destructive))' },
];

const fmt = (n: number) => {
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(1)}L`;
  return `₹${formatIST(n, 'PP pp')}`;
};

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

const PayrollBarChart: React.FC = () => {
  const W = 100; const H = 60;
  const maxGross = Math.max(...MONTHLY_COST.map(d => d.gross));
  const barW = 12; const gap = (W - MONTHLY_COST.length * barW) / (MONTHLY_COST.length + 1);

  return (
    <svg viewBox={`0 0 ${W} ${H + 10}`} className="w-full" style={{ height: 120 }}>
      <defs>
        <linearGradient id="grossGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity="0.9" />
          <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      {MONTHLY_COST.map((d, i) => {
        const x = gap + i * (barW + gap);
        const grossH = (d.gross / maxGross) * H;
        const netH   = (d.net   / maxGross) * H;
        return (
          <g key={d.month}>
            <rect x={x} y={H - grossH} width={barW * 0.45} height={grossH} rx="1" fill="url(#grossGrad)" />
            <rect x={x + barW * 0.5} y={H - netH} width={barW * 0.45} height={netH} rx="1" fill="url(#netGrad)" />
            <text x={x + barW / 2} y={H + 8} textAnchor="middle" fontSize="4.5" fill="hsl(var(--muted-foreground))">{d.month}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const PayrollAnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'dept' | 'statutory' | 'ctc'>('overview');

  const latestMonth = MONTHLY_COST[MONTHLY_COST.length - 1]!;
  const prevMonth   = MONTHLY_COST[MONTHLY_COST.length - 2]!;
  const grossChg    = (((latestMonth.gross - prevMonth.gross) / prevMonth.gross) * 100).toFixed(1);
  const ytdGross    = MONTHLY_COST.reduce((s, d) => s + d.gross, 0);
  const ytdNet      = MONTHLY_COST.reduce((s, d) => s + d.net,   0);
  const ytdTDS      = MONTHLY_COST.reduce((s, d) => s + d.tds,   0);

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: 'overview',  label: 'Monthly Trend' },
    { key: 'dept',      label: 'By Department' },
    { key: 'statutory', label: 'Statutory' },
    { key: 'ctc',       label: 'CTC Distribution' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--success)/0.12)]">
            <IndianRupee size={22} className="text-[hsl(var(--success))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Payroll Analytics</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Cost trends & compliance · FY 2026-27</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors">
          <Download size={13} />Export
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'YTD Gross Payroll',    value: fmt(ytdGross), sub: 'Jan–Jun 2026',      color: 'var(--primary)',    trend: `+${grossChg}% MoM` },
          { label: 'YTD Net Disbursement', value: fmt(ytdNet),   sub: 'After all deductions', color: 'var(--success)',  trend: '88.2% of gross' },
          { label: 'YTD TDS Deducted',     value: fmt(ytdTDS),   sub: 'Remitted to IT Dept',  color: 'var(--warning)',  trend: '₹1.8Cr total' },
          { label: 'Jun Payroll',          value: fmt(latestMonth.gross), sub: 'Current month', color: 'var(--teal)',   trend: `${grossChg}% vs May` },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm">
            <p className="text-xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">{s.sub}</p>
            <p className="text-[10px] font-semibold text-[hsl(var(--primary))] mt-1">{s.trend}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1 mb-5 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.key ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`}>{t.label}</button>
        ))}
      </div>

      {/* Monthly Trend */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Monthly Gross vs Net Payroll</h3>
              <div className="flex gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-[hsl(var(--primary))] inline-block" />Gross</span>
                <span className="flex items-center gap-1"><span className="w-3 h-1.5 rounded-full bg-[hsl(var(--success))] inline-block" />Net</span>
              </div>
            </div>
            <PayrollBarChart />
            <div className="grid grid-cols-6 gap-2 mt-2">
              {MONTHLY_COST.map(d => (
                <div key={d.month} className="text-center">
                  <p className="text-[10px] font-bold text-[hsl(var(--foreground))]">{fmt(d.gross)}</p>
                  <p className="text-[9px] text-[hsl(var(--success))]">{fmt(d.net)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {MONTHLY_COST.map(d => (
              <div key={d.month} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))]">{d.month} 2026</p>
                </div>
                {[
                  { label: 'Gross',  value: fmt(d.gross), color: 'var(--primary)' },
                  { label: 'Net Pay', value: fmt(d.net),  color: 'var(--success)' },
                  { label: 'PF',     value: fmt(d.pf),    color: 'var(--teal)' },
                  { label: 'TDS',    value: fmt(d.tds),   color: 'var(--warning)' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between text-xs py-0.5">
                    <span className="text-[hsl(var(--muted-foreground))]">{r.label}</span>
                    <span className="font-semibold" style={{ color: `hsl(${r.color})` }}>{r.value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* By Department */}
      {activeTab === 'dept' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">Monthly Payroll Cost by Department</h3>
          <div className="space-y-4">
            {DEPT_COST.map(d => {
              const maxCost = Math.max(...DEPT_COST.map(x => x.cost));
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="font-medium text-[hsl(var(--foreground))]">{d.dept}</span>
                      <span className="text-[hsl(var(--muted-foreground))]">({d.hc} employees)</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[hsl(var(--muted-foreground))]">Avg CTC: {d.avgCTC}</span>
                      <span className="font-bold" style={{ color: d.color }}>{fmt(d.cost)}</span>
                    </div>
                  </div>
                  <div className="h-3 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(d.cost / maxCost) * 100}%`, background: d.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex justify-between text-sm font-bold">
            <span className="text-[hsl(var(--foreground))]">Total Monthly Cost</span>
            <span className="text-[hsl(var(--primary))]">{fmt(DEPT_COST.reduce((s, d) => s + d.cost, 0))}</span>
          </div>
        </div>
      )}

      {/* Statutory */}
      {activeTab === 'statutory' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {STATUTORY.map(s => (
              <div key={s.label} className="flex items-center justify-between p-4 bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">{s.label}</span>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: s.color }}>{s.ytd}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">YTD Total</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.trend === '0.0%' ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]' : 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]'}`}>{s.trend} YoY</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTC Distribution */}
      {activeTab === 'ctc' && (
        <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-5 shadow-sm">
          <h3 className="text-sm font-bold text-[hsl(var(--foreground))] mb-4">CTC Band Distribution — 208 Employees</h3>
          <div className="space-y-4">
            {CTC_BANDS.map(b => (
              <div key={b.band}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-[hsl(var(--foreground))]">{b.band}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[hsl(var(--muted-foreground))]">{b.pct}%</span>
                    <span className="font-bold w-8 text-right" style={{ color: b.color }}>{b.count}</span>
                  </div>
                </div>
                <div className="h-5 rounded-lg bg-[hsl(var(--muted))] overflow-hidden">
                  <div className="h-full rounded-lg flex items-center pl-2 transition-all duration-700" style={{ width: `${b.pct * 2}%`, background: b.color }}>
                    <span className="text-[9px] font-bold text-white">{b.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-[hsl(var(--border))] grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Median CTC',  value: '₹13.8L', color: 'var(--primary)' },
              { label: 'Mean CTC',    value: '₹15.2L', color: 'var(--teal)' },
              { label: 'Max CTC',     value: '₹52.0L', color: 'var(--warning)' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-lg font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollAnalyticsPage;
