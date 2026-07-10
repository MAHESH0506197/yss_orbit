import { useTranslation } from 'react-i18next';
﻿// yss_orbit\frontend\src\pages\payroll\PayrollDashboardPage.tsx
import React, { useState } from 'react';
import {
  IndianRupee,
  Users,
  ShieldCheck,
  FileWarning,
  Play,
  Download,
  FileSpreadsheet,
  BookOpen,
  Eye,
  CheckCircle,
  Lock,
  ChevronRight,
  X,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Loader2,
  BadgeCheck,
  Banknote,
  Building2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type PayrollStatus = 'DRAFT' | 'PROCESSING' | 'PROCESSED' | 'APPROVED' | 'LOCKED';

interface PayrollRun {
  id: string;
  month: number;
  year: number;
  status: PayrollStatus;
  total_employees: number;
  total_gross: string;
  total_deductions: string;
  total_net: string;
  processed_at: string;
  approved_at?: string;
  locked_at?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_PAYROLL_RUNS: PayrollRun[] = [
  {
    id: 'PR-2026-06',
    month: 6,
    year: 2026,
    status: 'DRAFT',
    total_employees: 248,
    total_gross: 'â‚¹48,92,400',
    total_deductions: 'â‚¹6,83,140',
    total_net: 'â‚¹42,09,260',
    processed_at: '—',
  },
  {
    id: 'PR-2026-05',
    month: 5,
    year: 2026,
    status: 'APPROVED',
    total_employees: 246,
    total_gross: 'â‚¹48,55,200',
    total_deductions: 'â‚¹6,78,340',
    total_net: 'â‚¹41,76,860',
    processed_at: '2026-05-29 10:14',
    approved_at: '2026-05-30 14:02',
  },
  {
    id: 'PR-2026-04',
    month: 4,
    year: 2026,
    status: 'LOCKED',
    total_employees: 244,
    total_gross: 'â‚¹47,88,000',
    total_deductions: 'â‚¹6,71,200',
    total_net: 'â‚¹41,16,800',
    processed_at: '2026-04-29 09:45',
    approved_at: '2026-04-30 11:20',
    locked_at: '2026-05-01 09:00',
  },
  {
    id: 'PR-2026-03',
    month: 3,
    year: 2026,
    status: 'LOCKED',
    total_employees: 241,
    total_gross: 'â‚¹47,22,000',
    total_deductions: 'â‚¹6,60,800',
    total_net: 'â‚¹40,61,200',
    processed_at: '2026-03-28 11:30',
    approved_at: '2026-03-29 15:40',
    locked_at: '2026-04-01 09:00',
  },
  {
    id: 'PR-2026-02',
    month: 2,
    year: 2026,
    status: 'LOCKED',
    total_employees: 238,
    total_gross: 'â‚¹46,64,400',
    total_deductions: 'â‚¹6,53,100',
    total_net: 'â‚¹40,11,300',
    processed_at: '2026-02-26 10:05',
    approved_at: '2026-02-27 14:50',
    locked_at: '2026-03-01 09:00',
  },
  {
    id: 'PR-2026-01',
    month: 1,
    year: 2026,
    status: 'LOCKED',
    total_employees: 235,
    total_gross: 'â‚¹45,93,000',
    total_deductions: 'â‚¹6,43,500',
    total_net: 'â‚¹39,49,500',
    processed_at: '2026-01-29 09:20',
    approved_at: '2026-01-30 13:10',
    locked_at: '2026-02-01 09:00',
  },
];

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PayrollStatus, {
  label: string;
  dot: string;
  badge: string;
  icon: React.ReactNode;
}> = {
  DRAFT: {
    label: 'Draft',
    dot: 'bg-[hsl(var(--muted-foreground))]',
    badge: 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border-strong))]',
    icon: <Clock size={12} />,
  },
  PROCESSING: {
    label: 'Processing',
    dot: 'bg-[hsl(var(--primary))] animate-pulse',
    badge: 'bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] border border-[hsl(var(--primary)/0.3)]',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  PROCESSED: {
    label: 'Processed',
    dot: 'bg-[hsl(var(--teal))]',
    badge: 'bg-[hsl(var(--teal)/0.1)] text-[hsl(var(--teal))] border border-[hsl(var(--teal)/0.3)]',
    icon: <BadgeCheck size={12} />,
  },
  APPROVED: {
    label: 'Approved',
    dot: 'bg-[hsl(var(--accent))]',
    badge: 'bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] border border-[hsl(var(--accent)/0.3)]',
    icon: <CheckCircle size={12} />,
  },
  LOCKED: {
    label: 'Locked',
    dot: 'bg-[hsl(var(--success))]',
    badge: 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] border border-[hsl(var(--success)/0.3)]',
    icon: <Lock size={12} />,
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  trend?: string;
  trendUp?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon, gradient, trend, trendUp }) => (
  <div className="glass rounded-2xl p-5 hover:scale-[1.01] transition-all duration-200 group relative overflow-hidden">
    {/* Subtle gradient shimmer */}
    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${gradient}`} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-lg ${gradient}`}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trendUp
              ? 'bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]'
              : 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]'
          }`}>
            <ArrowUpRight size={10} className={trendUp ? '' : 'rotate-90'} />
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-800 text-[hsl(var(--foreground))] leading-tight">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{subtitle}</p>
    </div>
  </div>
);

interface StatusBadgeProps {
  status: PayrollStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const { t } = useTranslation();


  const cfg = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-500 ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Run Payroll Modal ────────────────────────────────────────────────────────

interface RunPayrollModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (month: number, year: number) => void;
}

const RunPayrollModal: React.FC<RunPayrollModalProps> = ({ open, onClose, onConfirm }) => {
  const { t } = useTranslation();

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [confirming, setConfirming] = useState(false);

  if (!open) return null;

  const handleConfirm = () => {
    setConfirming(true);
    setTimeout(() => {
      setConfirming(false);
      onConfirm(month, year);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[hsl(var(--foreground)/0.4)] backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative glass-strong rounded-2xl w-full max-w-md shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-white">
              <Play size={18} />
            </div>
            <div>
              <h2 className="text-base font-700 text-[hsl(var(--foreground))]">{t('auto.run_payroll', 'Run Payroll')}</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('auto.initiate_a_new_payroll_processing_cycle', 'Initiate a new payroll processing cycle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-all duration-150"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Warning */}
          <div className="flex gap-3 p-4 rounded-xl bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.25)]">
            <AlertTriangle size={16} className="text-[hsl(var(--warning))] shrink-0 mt-0.5" />
            <div className="text-xs text-[hsl(var(--foreground))]">
              <p className="font-600 mb-0.5">{t('auto.important_notice', 'Important Notice')}</p>
              <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
                {t('auto.running_payroll_will_calculate_salaries_for_all_ac', 'Running payroll will calculate salaries for all active employees. Ensure attendance and leave records are finalized before proceeding.')}
              </p>
            </div>
          </div>

          {/* Month + Year pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                {t('auto.month', 'Month')}
              </label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--background-3))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] transition-all"
              >
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-600 text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-2">
                {t('auto.year', 'Year')}
              </label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-[hsl(var(--background-3))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--foreground))] focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] transition-all"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary pill */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)]">
            <Calendar size={14} className="text-[hsl(var(--primary))]" />
            <span className="text-sm text-[hsl(var(--foreground))]">
              {t('auto.processing_payroll_for', 'Processing payroll for')} <strong>{MONTHS[month - 1]} {year}</strong>
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-500 text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all duration-150"
          >
            {t('auto.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-sm font-600 flex items-center justify-center gap-2 hover:opacity-90 transition-all duration-150 disabled:opacity-70 shadow-lg"
          >
            {confirming ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t('auto.initiating', 'Initiating...')}
              </>
            ) : (
              <>
                <Play size={15} />
                {t('auto.confirm_run', 'Confirm & Run')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Status Workflow Indicator ────────────────────────────────────────────────

const WORKFLOW_STEPS: { key: PayrollStatus; label: string; icon: React.ReactNode }[] = [
  { key: 'DRAFT', label: 'Draft', icon: <Clock size={13} /> },
  { key: 'PROCESSING', label: 'Processing', icon: <Loader2 size={13} /> },
  { key: 'PROCESSED', label: 'Processed', icon: <BadgeCheck size={13} /> },
  { key: 'APPROVED', label: 'Approved', icon: <CheckCircle size={13} /> },
  { key: 'LOCKED', label: 'Locked', icon: <Lock size={13} /> },
];

const STATUS_ORDER: PayrollStatus[] = ['DRAFT', 'PROCESSING', 'PROCESSED', 'APPROVED', 'LOCKED'];

const WorkflowIndicator: React.FC<{ current: PayrollStatus }> = ({ current }) => {
  const { t } = useTranslation();

  const currentIdx = STATUS_ORDER.indexOf(current);
  return (
    <div className="flex items-center gap-0">
      {WORKFLOW_STEPS.map((step, i) => {
        const isPast = i < currentIdx;
        const isActive = i === currentIdx;
        const isFuture = i > currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-500 transition-all ${
              isActive
                ? 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-md'
                : isPast
                ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]'
                : 'text-[hsl(var(--muted-foreground))] opacity-50'
            }`}>
              {step.icon}
              <span className="hidden sm:inline">{step.label}</span>
            </div>
            {i < WORKFLOW_STEPS.length - 1 && (
              <div className={`w-6 h-px mx-0.5 ${
                i < currentIdx ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--border-strong))]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ─── Quick Action Card ────────────────────────────────────────────────────────

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  onClick?: () => void;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, icon, gradient, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-4 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.03)] hover:scale-[1.01] transition-all duration-200 group text-left"
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${gradient} group-hover:shadow-lg transition-shadow`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-600 text-[hsl(var(--foreground))] group-hover:text-[hsl(var(--primary))] transition-colors">{title}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))] leading-snug">{description}</p>
    </div>
    <ChevronRight size={15} className="text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))] group-hover:translate-x-0.5 transition-all shrink-0" />
  </button>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const PayrollDashboardPage: React.FC = () => {
  const { t } = useTranslation();

  const [runs, setRuns] = useState<PayrollRun[]>(MOCK_PAYROLL_RUNS);
  const [showRunModal, setShowRunModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRunConfirm = (month: number, year: number) => {
    showToast(`Payroll for ${MONTHS[month - 1]} ${year} has been queued for processing.`);
  };

  const handleApprove = (id: string) => {
    setRuns(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'APPROVED', approved_at: new Date().toISOString() } : r)
    );
    showToast('Payroll run approved successfully.');
  };

  const handleLock = (id: string) => {
    setRuns(prev =>
      prev.map(r => r.id === id ? { ...r, status: 'LOCKED', locked_at: new Date().toISOString() } : r)
    );
    showToast('Payroll run locked and finalized.');
  };

  const currentRun = runs[0];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4 sm:p-6 lg:p-8">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl glass-strong shadow-2xl border border-[hsl(var(--success)/0.3)] animate-slide-in max-w-sm">
          <CheckCircle size={16} className="text-[hsl(var(--success))] shrink-0" />
          <p className="text-sm text-[hsl(var(--foreground))]">{toastMsg}</p>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-500 text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{t('auto.payroll_workspace', 'Payroll Workspace')}</span>
              <span className="text-[hsl(var(--border-strong))]">â€º</span>
              <span className="text-xs font-500 text-[hsl(var(--primary))]">{t('auto.dashboard', 'Dashboard')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-800 text-[hsl(var(--foreground))]">
              {t('auto.payroll', 'Payroll')} <span className="gradient-text">{t('auto.dashboard', 'Dashboard')}</span>
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {t('auto.fy_2025_26_june_2026_248_active_employees', 'FY 2025â€“26 Â· June 2026 Â· 248 Active Employees')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-500 text-[hsl(var(--foreground))] bg-[hsl(var(--card))] hover:border-[hsl(var(--border-strong))] hover:bg-[hsl(var(--background-3))] transition-all duration-150">
              <Download size={15} />
              {t('auto.export', 'Export')}
            </button>
            <button
              onClick={() => setShowRunModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-sm font-600 hover:opacity-90 transition-all duration-150 shadow-lg hover:shadow-xl hover:scale-[1.02]"
            >
              <Play size={15} />
              {t('auto.run_payroll', 'Run Payroll')}
            </button>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title={t('auto.total_payroll_this_month', 'Total Payroll This Month')}
            value="â‚¹48,92,400"
            subtitle="Jun 2026 Â· Gross Salary"
            icon={<IndianRupee size={20} />}
            gradient="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
            trend="+2.8%"
            trendUp
          />
          <KpiCard
            title={t('auto.employees_processed', 'Employees Processed')}
            value="246 / 248"
            subtitle="2 pending attendance lock"
            icon={<Users size={20} />}
            gradient="bg-gradient-to-br from-[hsl(var(--teal))] to-[hsl(var(--primary))]"
            trend="+4 this month"
            trendUp
          />
          <KpiCard
            title={t('auto.pf_esi_liability', 'PF / ESI Liability')}
            value="â‚¹5,88,640"
            subtitle="PF â‚¹4,12,320 Â· ESI â‚¹1,76,320"
            icon={<ShieldCheck size={20} />}
            gradient="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(220,70%,35%)]"
            trend="Due Jun 15"
            trendUp={false}
          />
          <KpiCard
            title={t('auto.pending_it_declarations', 'Pending IT Declarations')}
            value="34"
            subtitle="Of 248 employees Â· FY 2025â€“26"
            icon={<FileWarning size={20} />}
            gradient="bg-gradient-to-br from-[hsl(var(--warning))] to-[hsl(38,92%,38%)]"
            trend="34 unverified"
            trendUp={false}
          />
        </div>

        {/* ── Workflow Indicator ── */}
        <div className="glass rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="shrink-0">
            <p className="text-xs font-600 text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-0.5">{t('auto.current_run_status', 'Current Run Status')}</p>
            <p className="text-sm font-600 text-[hsl(var(--foreground))]">{currentRun?.id}</p>
          </div>
          <div className="hidden sm:block w-px h-8 bg-[hsl(var(--border))] mx-2" />
          <WorkflowIndicator current={currentRun?.status ?? "DRAFT"} />
          <div className="sm:ml-auto flex items-center gap-2">
            <TrendingUp size={13} className="text-[hsl(var(--muted-foreground))]" />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{t('auto.draft_processed_approved_locked', 'Draft â†’ Processed â†’ Approved â†’ Locked')}</span>
          </div>
        </div>

        {/* ── Main Content: Table + Sidebar ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

          {/* ── Payroll Run Table ── */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
              <div>
                <h2 className="text-base font-700 text-[hsl(var(--foreground))]">{t('auto.payroll_runs', 'Payroll Runs')}</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('auto.last_6_payroll_cycles', 'Last 6 payroll cycles')}</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-500">
                {t('auto.fy_2025_26', 'FY 2025â€“26')}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[hsl(var(--border))]">
                    {['Period', 'Employees', 'Gross Salary', 'Net Salary', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-600 text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--border)/0.6)]">
                  {runs.map((run) => (
                    <tr
                      key={run.id}
                      className="hover:bg-[hsl(var(--primary)/0.03)] transition-colors duration-100 group"
                    >
                      {/* Period */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-600 text-[hsl(var(--foreground))]">
                            {MONTHS[run.month - 1]} {run.year}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono mt-0.5">{run.id}</p>
                        </div>
                      </td>
                      {/* Employees */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                            <Users size={13} className="text-[hsl(var(--primary))]" />
                          </div>
                          <span className="text-sm font-500 text-[hsl(var(--foreground))]">{run.total_employees}</span>
                        </div>
                      </td>
                      {/* Gross */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-600 text-[hsl(var(--foreground))]">{run.total_gross}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{t('auto.deductions', 'Deductions:')} {run.total_deductions}</p>
                      </td>
                      {/* Net */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-700 text-[hsl(var(--teal))]">{run.total_net}</p>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4">
                        <StatusBadge status={run.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--primary)/0.1)] hover:text-[hsl(var(--primary))] transition-all duration-150" title={t('auto.view', 'View')}>
                            <Eye size={14} />
                          </button>
                          {run.status === 'PROCESSED' && (
                            <button
                              onClick={() => handleApprove(run.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-500 bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent)/0.2)] transition-all duration-150"
                            >
                              <CheckCircle size={12} />
                              {t('auto.approve', 'Approve')}
                            </button>
                          )}
                          {run.status === 'APPROVED' && (
                            <button
                              onClick={() => handleLock(run.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-500 bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.2)] transition-all duration-150"
                            >
                              <Lock size={12} />
                              {t('auto.lock', 'Lock')}
                            </button>
                          )}
                          {run.status === 'LOCKED' && (
                            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-500 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))] transition-all duration-150">
                              <Download size={12} />
                              {t('auto.download', 'Download')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right Sidebar: Quick Actions ── */}
          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="text-sm font-700 text-[hsl(var(--foreground))] mb-4">{t('auto.quick_actions', 'Quick Actions')}</h3>
              <div className="space-y-3">
                <QuickActionCard
                  title={t('auto.run_payroll', 'Run Payroll')}
                  description="Initiate a new payroll cycle"
                  icon={<Play size={16} />}
                  gradient="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
                  onClick={() => setShowRunModal(true)}
                />
                <QuickActionCard
                  title={t('auto.bank_statement', 'Bank Statement')}
                  description="Download NEFT/RTGS transfer file"
                  icon={<Banknote size={16} />}
                  gradient="bg-gradient-to-br from-[hsl(var(--teal))] to-[hsl(var(--primary))]"
                  onClick={() => showToast('Bank statement download initiated.')}
                />
                <QuickActionCard
                  title={t('auto.pf_esi_register', 'PF / ESI Register')}
                  description="ECR & ESI challans for this month"
                  icon={<ShieldCheck size={16} />}
                  gradient="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(220,70%,35%)]"
                  onClick={() => showToast('Generating PF/ESI register...')}
                />
                <QuickActionCard
                  title={t('auto.salary_register', 'Salary Register')}
                  description="Full salary statement & MIS report"
                  icon={<FileSpreadsheet size={16} />}
                  gradient="bg-gradient-to-br from-[hsl(var(--warning))] to-[hsl(38,92%,38%)]"
                  onClick={() => showToast('Salary register export queued.')}
                />
              </div>
            </div>

            {/* ── Summary Panel ── */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-[hsl(var(--muted-foreground))]" />
                <h3 className="text-sm font-700 text-[hsl(var(--foreground))]">{t('auto.jun_2026_summary', 'Jun 2026 Summary')}</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Gross Salary', value: 'â‚¹48,92,400', color: 'text-[hsl(var(--foreground))]' },
                  { label: 'PF (Employer)', value: 'â‚¹2,93,544', color: 'text-[hsl(var(--muted-foreground))]' },
                  { label: 'ESI (Employer)', value: 'â‚¹1,71,234', color: 'text-[hsl(var(--muted-foreground))]' },
                  { label: 'TDS Deducted', value: 'â‚¹1,24,800', color: 'text-[hsl(var(--muted-foreground))]' },
                  { label: 'Professional Tax', value: 'â‚¹49,600', color: 'text-[hsl(var(--muted-foreground))]' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">{item.label}</span>
                    <span className={`text-xs font-600 ${item.color}`}>{item.value}</span>
                  </div>
                ))}
                <div className="h-px bg-[hsl(var(--border))]" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-600 text-[hsl(var(--foreground))]">{t('auto.net_take_home', 'Net Take-Home')}</span>
                  <span className="text-sm font-700 text-[hsl(var(--teal))]">â‚¹42,09,260</span>
                </div>
              </div>
            </div>

            {/* ── Compliance Reminder ── */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.08)] border border-[hsl(var(--primary)/0.2)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-white shrink-0">
                  <BookOpen size={14} />
                </div>
                <div>
                  <p className="text-xs font-700 text-[hsl(var(--foreground))] mb-1">{t('auto.compliance_deadlines', 'Compliance Deadlines')}</p>
                  <ul className="text-xs text-[hsl(var(--muted-foreground))] space-y-1">
                    <li>{t('auto.pf_ecr_jun_15_2026', '• PF ECR: Jun 15, 2026')}</li>
                    <li>{t('auto.esi_jun_21_2026', '• ESI: Jun 21, 2026')}</li>
                    <li>{t('auto.tds_form_24q_jun_30_2026', '• TDS Form 24Q: Jun 30, 2026')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Run Payroll Modal ── */}
      <RunPayrollModal
        open={showRunModal}
        onClose={() => setShowRunModal(false)}
        onConfirm={handleRunConfirm}
      />
    </div>
  );
};

export default PayrollDashboardPage;

