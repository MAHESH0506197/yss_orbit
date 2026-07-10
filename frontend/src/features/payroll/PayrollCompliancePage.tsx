import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\pages\payroll\PayrollCompliancePage.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  XCircle,
  BadgeCheck,
  Banknote,
  Receipt,
  Scale,
  Landmark,
  CircleDot,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// ─────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────
type DueDateStatus = 'FILED' | 'DUE_SOON' | 'OVERDUE' | 'UPCOMING';
type TabKey = 'PF' | 'ESI' | 'PT' | 'LWF' | 'TDS';
type AlertSeverity = 'critical' | 'warning' | 'info';

interface CalendarDueDate {
  day: number;
  label: string;
  status: DueDateStatus;
  amount?: string;
}

interface StatutoryRegister {
  tab: TabKey;
  label: string;
  icon: React.ElementType;
  gradient: string;
  liability: string;
  employeesCovered: number;
  dueDate: string;
  filingStatus: DueDateStatus;
  challanRef?: string;
  history: FilingHistoryItem[];
  description: string;
}

interface FilingHistoryItem {
  period: string;
  amount: string;
  filedOn: string;
  challanNo: string;
  status: 'FILED' | 'LATE' | 'PENDING';
}

interface TaxSummaryItem {
  label: string;
  amount: string;
  subLabel: string;
  color: string;
  bg: string;
  icon: React.ElementType;
}

interface ComplianceAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  actionLabel?: string;
  count?: number;
}

// ─────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────

// Calendar month: June 2026
const CALENDAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);
const JUNE_START_DAY = 1; // Monday = 1 (June 1, 2026 is Monday)
const TODAY = 11;

const DUE_DATES: CalendarDueDate[] = [
  { day: 7, label: 'TDS Deposit', status: 'FILED', amount: '₹3,42,000' },
  { day: 15, label: 'PF Challan', status: 'DUE_SOON', amount: '₹4,48,200' },
  { day: 15, label: 'ESI Challan', status: 'DUE_SOON', amount: '₹1,07,100' },
  { day: 21, label: 'PT Karnataka', status: 'UPCOMING', amount: '₹24,750' },
  { day: 30, label: 'LWF Biannual', status: 'UPCOMING', amount: '₹12,350' },
];

const STATUTORY_REGISTERS: StatutoryRegister[] = [
  {
    tab: 'PF',
    label: 'Provident Fund',
    icon: Banknote,
    gradient: 'from-blue-500 to-indigo-600',
    liability: '₹4,48,200',
    employeesCovered: 247,
    dueDate: 'Jun 15, 2026',
    filingStatus: 'DUE_SOON',
    challanRef: 'PFCHAL-JUN26-0089',
    description: 'Includes Employee (12%) + Employer (12%) contributions. Admin charges @ 0.50%.',
    history: [
      { period: 'May 2026', amount: '₹4,35,600', filedOn: 'May 13, 2026', challanNo: 'PFCHAL-MAY26-0072', status: 'FILED' },
      { period: 'Apr 2026', amount: '₹4,28,400', filedOn: 'Apr 14, 2026', challanNo: 'PFCHAL-APR26-0058', status: 'FILED' },
      { period: 'Mar 2026', amount: '₹4,22,100', filedOn: 'Mar 16, 2026', challanNo: 'PFCHAL-MAR26-0044', status: 'LATE' },
      { period: 'Feb 2026', amount: '₹4,18,900', filedOn: 'Feb 13, 2026', challanNo: 'PFCHAL-FEB26-0031', status: 'FILED' },
    ],
  },
  {
    tab: 'ESI',
    label: 'Employees State Insurance',
    icon: ShieldCheck,
    gradient: 'from-teal-500 to-cyan-600',
    liability: '₹1,07,100',
    employeesCovered: 189,
    dueDate: 'Jun 15, 2026',
    filingStatus: 'DUE_SOON',
    challanRef: 'ESICHAL-JUN26-0031',
    description: 'Employee 0.75% + Employer 3.25% of gross wages. Applicable for salary ≤ ₹21,000.',
    history: [
      { period: 'May 2026', amount: '₹1,04,200', filedOn: 'May 14, 2026', challanNo: 'ESICHAL-MAY26-0024', status: 'FILED' },
      { period: 'Apr 2026', amount: '₹1,02,800', filedOn: 'Apr 13, 2026', challanNo: 'ESICHAL-APR26-0019', status: 'FILED' },
      { period: 'Mar 2026', amount: '₹1,01,500', filedOn: 'Mar 16, 2026', challanNo: 'ESICHAL-MAR26-0014', status: 'LATE' },
      { period: 'Feb 2026', amount: '₹99,800', filedOn: 'Feb 14, 2026', challanNo: 'ESICHAL-FEB26-0009', status: 'FILED' },
    ],
  },
  {
    tab: 'PT',
    label: 'Professional Tax',
    icon: Landmark,
    gradient: 'from-violet-500 to-purple-700',
    liability: '₹24,750',
    employeesCovered: 247,
    dueDate: 'Jun 21, 2026',
    filingStatus: 'UPCOMING',
    challanRef: undefined,
    description: 'Karnataka PT slab: ₹200/month for salary > ₹15,000. Employer deducts and remits.',
    history: [
      { period: 'May 2026', amount: '₹24,600', filedOn: 'May 20, 2026', challanNo: 'PTKAR-MAY26-0017', status: 'FILED' },
      { period: 'Apr 2026', amount: '₹24,200', filedOn: 'Apr 19, 2026', challanNo: 'PTKAR-APR26-0014', status: 'FILED' },
      { period: 'Mar 2026', amount: '₹23,800', filedOn: 'Mar 22, 2026', challanNo: 'PTKAR-MAR26-0011', status: 'LATE' },
      { period: 'Feb 2026', amount: '₹23,600', filedOn: 'Feb 18, 2026', challanNo: 'PTKAR-FEB26-0008', status: 'FILED' },
    ],
  },
  {
    tab: 'LWF',
    label: 'Labour Welfare Fund',
    icon: Scale,
    gradient: 'from-emerald-500 to-green-600',
    liability: '₹12,350',
    employeesCovered: 247,
    dueDate: 'Jun 30, 2026',
    filingStatus: 'UPCOMING',
    challanRef: undefined,
    description: 'Biannual LWF contribution. Employee ₹25 + Employer ₹75 per person (Karnataka).',
    history: [
      { period: 'Dec 2025', amount: '₹12,100', filedOn: 'Dec 29, 2025', challanNo: 'LWFKAR-DEC25-0005', status: 'FILED' },
      { period: 'Jun 2025', amount: '₹11,800', filedOn: 'Jun 28, 2025', challanNo: 'LWFKAR-JUN25-0003', status: 'FILED' },
      { period: 'Dec 2024', amount: '₹11,500', filedOn: 'Jan 02, 2025', challanNo: 'LWFKAR-DEC24-0002', status: 'LATE' },
    ],
  },
  {
    tab: 'TDS',
    label: 'Tax Deducted at Source',
    icon: Receipt,
    gradient: 'from-amber-500 to-orange-600',
    liability: '₹3,42,000',
    employeesCovered: 247,
    dueDate: 'Jun 7, 2026',
    filingStatus: 'FILED',
    challanRef: 'TDS-JUN26-CHALLAN-0041',
    description: 'Section 192 TDS on salary. OLTAS challan type 281 filed via TRACES portal.',
    history: [
      { period: 'May 2026', amount: '₹3,38,500', filedOn: 'Jun 7, 2026', challanNo: 'TDS-JUN26-CHALLAN-0041', status: 'FILED' },
      { period: 'Apr 2026', amount: '₹3,30,200', filedOn: 'May 7, 2026', challanNo: 'TDS-MAY26-CHALLAN-0036', status: 'FILED' },
      { period: 'Mar 2026', amount: '₹3,25,000', filedOn: 'Apr 7, 2026', challanNo: 'TDS-APR26-CHALLAN-0029', status: 'FILED' },
      { period: 'Feb 2026', amount: '₹3,18,700', filedOn: 'Mar 7, 2026', challanNo: 'TDS-MAR26-CHALLAN-0022', status: 'FILED' },
    ],
  },
];

const TAX_SUMMARY_ITEMS: TaxSummaryItem[] = [
  {
    label: 'Provident Fund',
    amount: '₹13,30,200',
    subLabel: 'Apr–Jun 2026 · 3 months',
    color: 'hsl(var(--primary))',
    bg: 'hsl(var(--primary) / 0.08)',
    icon: Banknote,
  },
  {
    label: 'ESI Contribution',
    amount: '₹3,14,100',
    subLabel: 'Apr–Jun 2026 · 189 employees',
    color: 'hsl(var(--teal))',
    bg: 'hsl(var(--teal) / 0.08)',
    icon: ShieldCheck,
  },
  {
    label: 'Professional Tax',
    amount: '₹73,600',
    subLabel: 'Apr–Jun 2026 · Karnataka',
    color: 'hsl(var(--accent))',
    bg: 'hsl(var(--accent) / 0.08)',
    icon: Landmark,
  },
  {
    label: 'TDS on Salary',
    amount: '₹9,93,700',
    subLabel: 'Apr–Jun 2026 · Sec 192',
    color: 'hsl(var(--warning))',
    bg: 'hsl(var(--warning) / 0.08)',
    icon: Receipt,
  },
];

const COMPLIANCE_ALERTS: ComplianceAlert[] = [
  {
    id: 'alert-01',
    severity: 'critical',
    title: 'PF Challan Due in 4 Days',
    description: 'PF challan of ₹4,48,200 for June 2026 is due on Jun 15. Initiate payment now to avoid penalty.',
    actionLabel: 'Pay Now',
  },
  {
    id: 'alert-02',
    severity: 'critical',
    title: 'ESI Challan Due in 4 Days',
    description: 'ESI challan of ₹1,07,100 for June 2026 is due on Jun 15. Ensure ESIC portal credentials are ready.',
    actionLabel: 'Pay Now',
  },
  {
    id: 'alert-03',
    severity: 'warning',
    title: 'Missing PAN — 12 Employees',
    description: 'TDS will be deducted at 20% for employees without a valid PAN. Update PAN details to avoid excess deduction.',
    actionLabel: 'Review',
    count: 12,
  },
  {
    id: 'alert-04',
    severity: 'warning',
    title: 'PT Not Configured — 3 States',
    description: 'Employees in Maharashtra, Telangana, and Tamil Nadu do not have Professional Tax configured.',
    actionLabel: 'Configure',
    count: 3,
  },
  {
    id: 'alert-05',
    severity: 'warning',
    title: 'Below Minimum Wage — 5 Employees',
    description: 'Unskilled wage category employees in Bengaluru Urban may be below statutory minimum wage of ₹16,022/month.',
    actionLabel: 'Review',
    count: 5,
  },
  {
    id: 'alert-06',
    severity: 'info',
    title: 'Form 24Q Q4 — Due Jun 31',
    description: 'Quarterly TDS return (Form 24Q) for Q4 FY 2025-26 is due by Jun 31, 2026. Prepare TRACES filing.',
    actionLabel: 'Prepare',
  },
];

const STATUS_CONFIG: Record<DueDateStatus, { label: string; dot: string; bg: string; text: string }> = {
  FILED: { label: 'Filed', dot: 'hsl(var(--success))', bg: 'hsl(var(--success) / 0.1)', text: 'hsl(var(--success))' },
  DUE_SOON: { label: 'Due Soon', dot: 'hsl(var(--warning))', bg: 'hsl(var(--warning) / 0.1)', text: 'hsl(var(--warning))' },
  OVERDUE: { label: 'Overdue', dot: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive) / 0.1)', text: 'hsl(var(--destructive))' },
  UPCOMING: { label: 'Upcoming', dot: 'hsl(var(--primary))', bg: 'hsl(var(--primary) / 0.1)', text: 'hsl(var(--primary))' },
};

const HISTORY_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  FILED: { bg: 'hsl(var(--success) / 0.1)', text: 'hsl(var(--success))', label: 'Filed' },
  LATE: { bg: 'hsl(var(--warning) / 0.1)', text: 'hsl(var(--warning))', label: 'Late Filed' },
  PENDING: { bg: 'hsl(var(--destructive) / 0.1)', text: 'hsl(var(--destructive))', label: 'Pending' },
};

const FY_OPTIONS = ['2025-26', '2024-25', '2023-24'];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─────────────────────────────────────────
// STATUS BADGE COMPONENT
// ─────────────────────────────────────────
const StatusBadge: React.FC<{ status: DueDateStatus }> = ({ status }) => {
  const { t } = useTranslation();


  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

// ─────────────────────────────────────────
// COMPLIANCE CALENDAR COMPONENT
// ─────────────────────────────────────────
const ComplianceCalendar: React.FC = () => {
  const { t } = useTranslation();

  const getDueDateForDay = (day: number) => DUE_DATES.filter(d => d.day === day);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
            {t('auto.compliance_calendar_june_2026', 'Compliance Calendar — June 2026')}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-opacity-100"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEK_DAYS.map(d => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold uppercase tracking-wider py-1"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Offset for June 1 = Monday (no offset needed) */}
        {Array.from({ length: JUNE_START_DAY - 1 }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {CALENDAR_DAYS.map(day => {
          const dues = getDueDateForDay(day);
          const isToday = day === TODAY;
          const hasOverdue = dues.some(d => d.status === 'OVERDUE');
          const hasDueSoon = dues.some(d => d.status === 'DUE_SOON');
          const hasFiled = dues.some(d => d.status === 'FILED');
          const hasUpcoming = dues.some(d => d.status === 'UPCOMING');

          let cellBg = 'transparent';
          let cellBorder = '1px solid transparent';
          let textColor = 'hsl(var(--foreground))';

          if (isToday) {
            cellBg = 'hsl(var(--primary) / 0.15)';
            cellBorder = '1px solid hsl(var(--primary) / 0.4)';
            textColor = 'hsl(var(--primary))';
          }

          const dotColor = hasOverdue
            ? 'hsl(var(--destructive))'
            : hasDueSoon
            ? 'hsl(var(--warning))'
            : hasFiled
            ? 'hsl(var(--success))'
            : hasUpcoming
            ? 'hsl(var(--primary))'
            : null;

          return (
            <div
              key={day}
              className="relative flex flex-col items-center justify-start pt-1 pb-1 rounded-lg cursor-pointer hover:scale-[1.05] transition-all duration-150 min-h-10"
              style={{ background: cellBg, border: cellBorder }}
            >
              <span
                className="text-xs font-semibold leading-none"
                style={{ color: textColor }}
              >
                {day}
              </span>
              {dotColor && (
                <span
                  className="w-1.5 h-1.5 rounded-full mt-0.5"
                  style={{ background: dotColor }}
                />
              )}
              {dues.length > 1 && (
                <span
                  className="text-[8px] font-bold leading-none mt-0.5"
                  style={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  +{dues.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid hsl(var(--border))' }}>
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
            <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {cfg.label}
            </span>
          </div>
        ))}
      </div>

      {/* Upcoming dues list */}
      <div className="mt-4 space-y-2">
        {DUE_DATES.map((d, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{ background: 'hsl(var(--background-3))' }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: STATUS_CONFIG[d.status].bg, color: STATUS_CONFIG[d.status].text }}
              >
                {d.day}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{d.label}</p>
                {d.amount && (
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{d.amount}</p>
                )}
              </div>
            </div>
            <StatusBadge status={d.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// STATUTORY REGISTER TAB COMPONENT
// ─────────────────────────────────────────
const StatutoryRegisterPanel: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabKey>('PF');
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const reg = STATUTORY_REGISTERS.find(r => r.tab === activeTab)!;
  const statusCfg = STATUS_CONFIG[reg.filingStatus];
  const Icon = reg.icon;

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Tabs */}
      <div
        className="flex overflow-x-auto"
        style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--background-3))' }}
      >
        {STATUTORY_REGISTERS.map(r => {
          const isActive = r.tab === activeTab;
          const RegIcon = r.icon;
          return (
            <button
              key={r.tab}
              onClick={() => setActiveTab(r.tab)}
              className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 border-b-2"
              style={{
                borderBottomColor: isActive ? 'hsl(var(--primary))' : 'transparent',
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                background: isActive ? 'hsl(var(--primary) / 0.06)' : 'transparent',
              }}
            >
              <RegIcon size={15} />
              {r.tab}
            </button>
          );
        })}
      </div>

      <div className="p-5 space-y-5">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${reg.gradient} shadow-sm`}>
              <Icon size={22} color="white" />
            </div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'hsl(var(--foreground))' }}>{reg.label}</h3>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{reg.description}</p>
            </div>
          </div>
          <StatusBadge status={reg.filingStatus} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Liability Amount', value: reg.liability, icon: TrendingUp, color: 'hsl(var(--primary))' },
            { label: 'Employees Covered', value: reg.employeesCovered.toString(), icon: Users, color: 'hsl(var(--teal))' },
            { label: 'Due Date', value: reg.dueDate, icon: Calendar, color: 'hsl(var(--warning))' },
          ].map(metric => (
            <div
              key={metric.label}
              className="rounded-xl p-3 text-center"
              style={{ background: 'hsl(var(--background-3))' }}
            >
              <metric.icon size={16} className="mx-auto mb-1" style={{ color: metric.color }} />
              <p className="text-xs font-medium leading-tight" style={{ color: 'hsl(var(--muted-foreground))' }}>{metric.label}</p>
              <p className="text-sm font-bold mt-0.5" style={{ color: 'hsl(var(--foreground))' }}>{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Challan ref + download */}
        {reg.challanRef && (
          <div
            className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'hsl(var(--success) / 0.08)', border: '1px solid hsl(var(--success) / 0.2)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'hsl(var(--success))' }} />
              <div>
                <p className="text-xs font-semibold" style={{ color: 'hsl(var(--success))' }}>{t('auto.challan_reference', 'Challan Reference')}</p>
                <p className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{reg.challanRef}</p>
              </div>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-[1.05]"
              style={{ background: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))' }}
            >
              <Download size={12} />
              {t('auto.download', 'Download')}
            </button>
          </div>
        )}

        {/* Filing History Toggle */}
        <div>
          <button
            onClick={() => setHistoryExpanded(p => !p)}
            className="flex items-center justify-between w-full text-sm font-semibold py-2 transition-colors"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            <div className="flex items-center gap-2">
              <Clock size={14} style={{ color: 'hsl(var(--muted-foreground))' }} />
              {t('auto.filing_history', 'Filing History')}
            </div>
            {historyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {historyExpanded && (
            <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--border))' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'hsl(var(--background-3))', borderBottom: '1px solid hsl(var(--border))' }}>
                    {['Period', 'Amount', 'Filed On', 'Challan No', 'Status'].map(h => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left font-semibold uppercase tracking-wider"
                        style={{ color: 'hsl(var(--muted-foreground))' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reg.history.map((h, i) => {
                    const hs = HISTORY_STATUS_STYLE[h.status] ?? { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))', label: h.status };
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: i < reg.history.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
                      >
                        <td className="px-3 py-2.5 font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{h.period}</td>
                        <td className="px-3 py-2.5 font-mono font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{h.amount}</td>
                        <td className="px-3 py-2.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{h.filedOn}</td>
                        <td className="px-3 py-2.5 font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>{h.challanNo}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-semibold"
                            style={{ background: hs.bg, color: hs.text }}
                          >
                            {hs.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// TAX SUMMARY COMPONENT
// ─────────────────────────────────────────
const TaxComplianceSummary: React.FC = () => {
  const { t } = useTranslation();

  const [selectedFY, setSelectedFY] = useState('2025-26');
  const total = '₹27,11,600';

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <FileText size={16} style={{ color: 'hsl(var(--primary))' }} />
          <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
            {t('auto.india_tax_compliance_summary', 'India Tax Compliance Summary')}
          </h3>
        </div>
        <select
          value={selectedFY}
          onChange={e => setSelectedFY(e.target.value)}
          className="text-xs px-2 py-1.5 rounded-lg outline-none transition-all font-semibold"
          style={{
            background: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        >
          {FY_OPTIONS.map(fy => <option key={fy}>{t('auto.fy', 'FY')} {fy}</option>)}
        </select>
      </div>

      {/* Breakdown items */}
      <div className="space-y-3 mb-5">
        {TAX_SUMMARY_ITEMS.map((item) => {
          const ItemIcon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 rounded-xl hover:scale-[1.01] transition-all duration-150 cursor-default"
              style={{ background: item.bg, border: `1px solid ${item.color}30` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.color}20` }}
                >
                  <ItemIcon size={15} style={{ color: item.color }} />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{item.label}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{item.subLabel}</p>
                </div>
              </div>
              <span className="text-sm font-bold font-mono" style={{ color: item.color }}>{item.amount}</span>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div
        className="flex items-center justify-between p-4 rounded-xl mb-5"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--accent) / 0.1) 100%)',
          border: '1px solid hsl(var(--primary) / 0.2)',
        }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.total_ytd_liability', 'Total YTD Liability')}</p>
          <p className="text-xl font-bold gradient-text">{total}</p>
        </div>
        <div
          className="px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
        >
          {t('auto.apr_jun_2026', 'Apr–Jun 2026')}
        </div>
      </div>

      {/* Form status */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('auto.form_filing_status', 'Form Filing Status')}
        </p>
        {[
          { form: 'Form 24Q Q1', detail: 'Apr–Jun 2026 TDS Return', status: 'UPCOMING' as DueDateStatus },
          { form: 'Form 24Q Q4', detail: 'Jan–Mar 2026 TDS Return', status: 'FILED' as DueDateStatus },
          { form: 'Form 16 Generation', detail: 'FY 2025-26 · 247 employees', status: 'FILED' as DueDateStatus },
          { form: 'Form 26QB', detail: 'Property TDS · N/A', status: 'UPCOMING' as DueDateStatus },
        ].map((f) => (
          <div
            key={f.form}
            className="flex items-center justify-between p-2.5 rounded-xl"
            style={{ background: 'hsl(var(--background-3))' }}
          >
            <div>
              <p className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{f.form}</p>
              <p className="text-[10px]" style={{ color: 'hsl(var(--muted-foreground))' }}>{f.detail}</p>
            </div>
            <StatusBadge status={f.status} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// ALERTS PANEL COMPONENT
// ─────────────────────────────────────────
const AlertsPanel: React.FC = () => {
  const { t } = useTranslation();

  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = COMPLIANCE_ALERTS.filter(a => !dismissed.includes(a.id));

  const severityConfig: Record<AlertSeverity, { icon: React.ElementType; bg: string; border: string; text: string; iconColor: string }> = {
    critical: {
      icon: XCircle,
      bg: 'hsl(var(--destructive) / 0.07)',
      border: 'hsl(var(--destructive) / 0.25)',
      text: 'hsl(var(--destructive))',
      iconColor: 'hsl(var(--destructive))',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'hsl(var(--warning) / 0.08)',
      border: 'hsl(var(--warning) / 0.25)',
      text: 'hsl(var(--warning))',
      iconColor: 'hsl(var(--warning))',
    },
    info: {
      icon: Info,
      bg: 'hsl(var(--primary) / 0.07)',
      border: 'hsl(var(--primary) / 0.2)',
      text: 'hsl(var(--primary))',
      iconColor: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={16} style={{ color: 'hsl(var(--destructive))' }} />
        <h3 className="font-semibold text-sm" style={{ color: 'hsl(var(--foreground))' }}>
          {t('auto.compliance_alerts', 'Compliance Alerts')}
        </h3>
        {visible.length > 0 && (
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}
          >
            {visible.length}
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <BadgeCheck size={36} style={{ color: 'hsl(var(--success))' }} className="mb-2" />
          <p className="text-sm font-semibold" style={{ color: 'hsl(var(--success))' }}>{t('auto.all_clear', 'All clear!')}</p>
          <p className="text-xs mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.no_active_compliance_alerts', 'No active compliance alerts')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map(alert => {
            const cfg = severityConfig[alert.severity];
            const SevIcon = cfg.icon;
            return (
              <div
                key={alert.id}
                className="relative rounded-xl p-4 transition-all duration-200 hover:scale-[1.01]"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <div className="flex items-start gap-3">
                  <SevIcon size={16} style={{ color: cfg.iconColor }} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold" style={{ color: cfg.text }}>
                        {alert.title}
                        {alert.count !== undefined && (
                          <span
                            className="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
                            style={{ background: `${cfg.text}20`, color: cfg.text }}
                          >
                            {alert.count}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: 'hsl(var(--muted-foreground))' }}>
                      {alert.description}
                    </p>
                    {alert.actionLabel && (
                      <button
                        className="mt-2 text-xs font-semibold px-3 py-1 rounded-lg transition-all duration-200 hover:scale-[1.05]"
                        style={{ background: `${cfg.text}15`, color: cfg.text }}
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setDismissed(p => [...p, alert.id])}
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors hover:bg-black/10"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                  >
                    <CircleDot size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// MAIN PAGE COMPONENT
// ─────────────────────────────────────────
export const PayrollCompliancePage: React.FC = () => {
  const { t } = useTranslation();

  const criticalCount = COMPLIANCE_ALERTS.filter(a => a.severity === 'critical').length;

  return (
    <div className="min-h-screen p-6 space-y-8" style={{ background: 'hsl(var(--background))' }}>

      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'hsl(var(--teal) / 0.12)', border: '1px solid hsl(var(--teal) / 0.2)' }}
            >
              <ShieldCheck size={20} style={{ color: 'hsl(var(--teal))' }} />
            </div>
            <div
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'hsl(var(--teal) / 0.1)', color: 'hsl(var(--teal))' }}
            >
              {t('auto.compliance', 'Compliance')}
            </div>
            {criticalCount > 0 && (
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold animate-pulse"
                style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}
              >
                <AlertTriangle size={11} />
                {criticalCount} {t('auto.critical', 'Critical')}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="gradient-text-teal">{t('auto.payroll_compliance', 'Payroll Compliance')}</span>
          </h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('auto.track_statutory_filings_challans_and_compliance_ob', 'Track statutory filings, challans, and compliance obligations — PF · ESI · PT · TDS · LWF')}
          </p>
        </div>

        {/* Overall compliance score */}
        <div
          className="glass rounded-2xl px-5 py-3 flex items-center gap-4"
          style={{ border: '1px solid hsl(var(--border))' }}
        >
          <div className="text-center">
            <div className="text-2xl font-bold gradient-text-teal">87%</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('auto.compliance_score', 'Compliance Score')}
            </div>
          </div>
          <div
            className="w-px h-10 self-center"
            style={{ background: 'hsl(var(--border))' }}
          />
          <div className="space-y-1">
            {[
              { label: 'Filed', count: 3, color: 'hsl(var(--success))' },
              { label: 'Due Soon', count: 2, color: 'hsl(var(--warning))' },
              { label: 'Upcoming', count: 2, color: 'hsl(var(--primary))' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
                <span className="text-[10px] font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
                <span className="text-[10px] font-bold ml-auto" style={{ color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column: Calendar + Alerts */}
        <div className="space-y-6">
          <ComplianceCalendar />
          <AlertsPanel />
        </div>

        {/* Right columns: Statutory Register + Tax Summary */}
        <div className="xl:col-span-2 space-y-6">
          <StatutoryRegisterPanel />
          <TaxComplianceSummary />
        </div>
      </div>
    </div>
  );
};

export default PayrollCompliancePage;
