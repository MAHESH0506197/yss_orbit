/**
 * ESSMyPayslipsPage.tsx
 * Employee Self-Service — My Payslips
 *
 * Features:
 *  • List of payslips with month/year, status badge, gross/net pay
 *  • Download payslip PDF
 *  • YTD (Year-To-Date) earnings summary cards
 *  • Uses: usePayslips(undefined, true) for ESS-scoped payslips
 */
import React, { useState } from 'react';
import {
  FileText, Download, CreditCard, TrendingUp, IndianRupee, Loader2,
  ChevronDown, ChevronRight, Eye,
} from 'lucide-react';
import { parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { usePayslips, downloadPayslip } from '@/features/payroll/api/usePayroll';
import { formatIST } from '@/utils/date';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(amount: number | string | undefined) {
  if (amount === undefined || amount === null) return '—';
  return `₹${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID:      'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400',
    PROCESSED: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400',
    DRAFT:     'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400',
    PENDING:   'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-700 border ${map[status] ?? map.PENDING}`}>
      {status}
    </span>
  );
}

// ── Payslip Row ───────────────────────────────────────────────────────────────
function PayslipRow({ slip }: { slip: any }) {
  const [expanded, setExpanded] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const blobData = await downloadPayslip(slip.id);
      const url = window.URL.createObjectURL(new Blob([blobData], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `Payslip_${slip.month}_${slip.year}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Payslip downloaded');
    } catch {
      toast.error('Download failed — contact HR if this persists');
    } finally {
      setDownloading(false);
    }
  };

  const monthLabel = slip.month && slip.year
    ? formatIST(new Date(slip.year, slip.month - 1, 1), 'MMMM yyyy')
    : slip.pay_period ?? 'Unknown Period';

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        className="hover:bg-[hsl(var(--muted)/0.3)] cursor-pointer transition-colors"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? <ChevronDown size={14} className="text-[hsl(var(--primary))]" /> : <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))]" />}
            <FileText size={14} className="text-[hsl(var(--muted-foreground))]" />
            <span className="font-600 text-[hsl(var(--foreground))]">{monthLabel}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <StatusPill status={slip.status ?? 'PAID'} />
        </td>
        <td className="px-4 py-3 font-600 text-[hsl(var(--foreground))]">{fmtCurrency(slip.gross_pay)}</td>
        <td className="px-4 py-3 text-[hsl(var(--muted-foreground))]">{fmtCurrency(slip.total_deductions)}</td>
        <td className="px-4 py-3 font-700 text-emerald-600 dark:text-emerald-400">{fmtCurrency(slip.net_pay)}</td>
        <td className="px-4 py-3">
          <button
            id={`payslip-download-${slip.id}`}
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-600 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.08)] transition-colors disabled:opacity-40"
            title="Download PDF"
          >
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            PDF
          </button>
        </td>
      </tr>

      {/* Expanded: Earnings / Deductions breakdown */}
      {expanded && (
        <tr className="bg-[hsl(var(--background-3)/0.4)]">
          <td colSpan={6} className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Earnings */}
              {slip.earnings_breakdown && (
                <div>
                  <p className="text-xs font-700 text-[hsl(var(--foreground))] mb-2 uppercase tracking-wide">Earnings</p>
                  <div className="space-y-1.5">
                    {Object.entries(slip.earnings_breakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-[hsl(var(--muted-foreground))]">{k}</span>
                        <span className="font-600 text-[hsl(var(--foreground))]">{fmtCurrency(v as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Deductions */}
              {slip.deductions_breakdown && (
                <div>
                  <p className="text-xs font-700 text-[hsl(var(--foreground))] mb-2 uppercase tracking-wide">Deductions</p>
                  <div className="space-y-1.5">
                    {Object.entries(slip.deductions_breakdown).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-[hsl(var(--muted-foreground))]">{k}</span>
                        <span className="font-600 text-rose-600 dark:text-rose-400">{fmtCurrency(v as number)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export const ESSMyPayslipsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [filterYear, setFilterYear] = useState(currentYear);

  // my_payslips=true scopes to the logged-in employee via backend ESS scope
  const { data: payslips = [], isLoading } = usePayslips(undefined, true);

  const filtered = (Array.isArray(payslips) ? payslips : [])
    .filter((s: any) => !filterYear || s.year === filterYear || !s.year)
    .sort((a: any, b: any) => {
      if (a.year !== b.year) return (b.year ?? 0) - (a.year ?? 0);
      return (b.month ?? 0) - (a.month ?? 0);
    });

  // YTD stats
  const ytdGross = filtered.reduce((acc: number, s: any) => acc + Number(s.gross_pay ?? 0), 0);
  const ytdNet   = filtered.reduce((acc: number, s: any) => acc + Number(s.net_pay ?? 0), 0);
  const ytdTax   = filtered.reduce((acc: number, s: any) => acc + Number(s.deductions_breakdown?.TDS ?? 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-800 text-[hsl(var(--foreground))]">My Payslips</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">View and download your monthly payslips</p>
        </div>
        <select
          value={filterYear}
          onChange={e => setFilterYear(Number(e.target.value))}
          className="h-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 text-sm font-600 focus:outline-none focus:border-[hsl(var(--primary))]"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* YTD Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'YTD Gross Earnings', value: fmtCurrency(ytdGross), icon: <IndianRupee size={16} />, color: 'text-emerald-600' },
          { label: 'YTD Net Take-Home',  value: fmtCurrency(ytdNet),   icon: <CreditCard size={16} />, color: 'text-blue-600' },
          { label: 'YTD Tax Deducted',   value: fmtCurrency(ytdTax),   icon: <TrendingUp size={16} />, color: 'text-rose-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="glass rounded-2xl px-5 py-4 flex items-center gap-4">
            <span className={`p-2 rounded-xl bg-[hsl(var(--background-3))] ${color}`}>{icon}</span>
            <div>
              <p className="text-lg font-800 text-[hsl(var(--foreground))]">{value}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payslips Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-[hsl(var(--primary))]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[hsl(var(--muted-foreground))]">
            <FileText size={36} className="opacity-25 mb-3" />
            <p className="text-sm font-500">No payslips found for {filterYear}</p>
            <p className="text-xs mt-1">Payslips are generated after each payroll run</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[hsl(var(--border))] bg-[hsl(var(--background-3)/0.5)]">
                <tr>
                  {['Pay Period', 'Status', 'Gross Pay', 'Deductions', 'Net Pay', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-700 text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filtered.map((slip: any) => (
                  <PayslipRow key={slip.id} slip={slip} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
