import { useTranslation } from 'react-i18next';
// yss_orbit\frontend\src\features\payroll\components\SalaryBuilder.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
  GripVertical,
  Plus,
  Trash2,
  IndianRupee,
  ChevronDown,
  ChevronRight,
  Building2,
  User,
  TrendingUp,
  Layers,
  FileText,
  Eye,
  Sliders,
  CheckCircle,
  Info,
  ArrowRight,
  Printer,
  Download,
  Shield,
  Minus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ComponentType = 'EARNING' | 'DEDUCTION' | 'STATUTORY';
type CalcMethod = 'FLAT' | 'PERCENTAGE_OF_BASIC' | 'PERCENTAGE_OF_GROSS' | 'PERCENTAGE_OF_CTC' | 'STATUTORY';

interface SalaryComponent {
  id: string;
  code: string;
  name: string;
  type: ComponentType;
  calcMethod: CalcMethod;
  percentage?: number;
  flatAmount?: number;
  description: string;
  isMandatory?: boolean;
}

interface ActiveComponent extends SalaryComponent {
  structureId: string;
  customPercentage?: number;
  customFlat?: number;
}

// ─── Mock Component Library ───────────────────────────────────────────────────

const COMPONENT_LIBRARY: SalaryComponent[] = [
  {
    id: 'c1',
    code: 'BASIC',
    name: 'Basic Salary',
    type: 'EARNING',
    calcMethod: 'PERCENTAGE_OF_CTC',
    percentage: 40,
    description: '40% of Annual CTC, taxable',
    isMandatory: true,
  },
  {
    id: 'c2',
    code: 'HRA',
    name: 'House Rent Allowance',
    type: 'EARNING',
    calcMethod: 'PERCENTAGE_OF_BASIC',
    percentage: 50,
    description: '50% of Basic (Metro cities)',
  },
  {
    id: 'c3',
    code: 'SPECIAL_ALLOWANCE',
    name: 'Special Allowance',
    type: 'EARNING',
    calcMethod: 'PERCENTAGE_OF_CTC',
    percentage: 20,
    description: 'Balancing component, fully taxable',
  },
  {
    id: 'c4',
    code: 'CONVEYANCE',
    name: 'Conveyance Allowance',
    type: 'EARNING',
    calcMethod: 'FLAT',
    flatAmount: 1600,
    description: '₹1,600/month, tax-exempt',
  },
  {
    id: 'c5',
    code: 'MEDICAL',
    name: 'Medical Allowance',
    type: 'EARNING',
    calcMethod: 'FLAT',
    flatAmount: 1250,
    description: '₹1,250/month, tax-exempt up to ₹15,000 p.a.',
  },
  {
    id: 'c6',
    code: 'PF_EMPLOYEE',
    name: 'PF (Employee)',
    type: 'STATUTORY',
    calcMethod: 'STATUTORY',
    percentage: 12,
    description: '12% of Basic, max ₹1,800/month',
    isMandatory: true,
  },
  {
    id: 'c7',
    code: 'ESI_EMPLOYEE',
    name: 'ESI (Employee)',
    type: 'STATUTORY',
    calcMethod: 'STATUTORY',
    percentage: 0.75,
    description: '0.75% of Gross (if gross ≤ ₹21,000/month)',
  },
  {
    id: 'c8',
    code: 'TDS',
    name: 'Income Tax (TDS)',
    type: 'DEDUCTION',
    calcMethod: 'STATUTORY',
    description: 'Calculated based on tax regime & declarations',
  },
  {
    id: 'c9',
    code: 'PROFESSIONAL_TAX',
    name: 'Professional Tax',
    type: 'STATUTORY',
    calcMethod: 'FLAT',
    flatAmount: 200,
    description: '₹200/month (state-specific)',
  },
];

const SAMPLE_CTC = 1_200_000; // ₹12,00,000 per annum

// ─── Calculation Engine ───────────────────────────────────────────────────────

interface CalculatedComponent extends ActiveComponent {
  annualAmount: number;
  monthlyAmount: number;
}

function calculateComponents(
  components: ActiveComponent[],
  annualCTC: number
): CalculatedComponent[] {
  const monthly = annualCTC / 12;
  const result: CalculatedComponent[] = [];

  // First pass: calculate earnings
  let basicMonthly = 0;
  let grossMonthly = 0;

  const earnings = components.filter(c => c.type === 'EARNING');
  for (const comp of earnings) {
    let monthlyAmount = 0;
    if (comp.calcMethod === 'PERCENTAGE_OF_CTC') {
      monthlyAmount = (monthly * (comp.customPercentage ?? comp.percentage ?? 0)) / 100;
    } else if (comp.calcMethod === 'PERCENTAGE_OF_BASIC') {
      monthlyAmount = (basicMonthly * (comp.customPercentage ?? comp.percentage ?? 0)) / 100;
    } else if (comp.calcMethod === 'FLAT') {
      monthlyAmount = comp.customFlat ?? comp.flatAmount ?? 0;
    }
    if (comp.code === 'BASIC') basicMonthly = monthlyAmount;
    grossMonthly += monthlyAmount;
    result.push({ ...comp, monthlyAmount, annualAmount: monthlyAmount * 12 });
  }

  // Second pass: deductions / statutory
  const deductions = components.filter(c => c.type !== 'EARNING');
  for (const comp of deductions) {
    let monthlyAmount = 0;
    if (comp.code === 'PF_EMPLOYEE') {
      monthlyAmount = Math.min((basicMonthly * 12) / 100, 1800);
    } else if (comp.code === 'ESI_EMPLOYEE') {
      monthlyAmount = grossMonthly <= 21000 ? grossMonthly * 0.0075 : 0;
    } else if (comp.code === 'TDS') {
      // Simplified TDS: estimate ~10% of gross over exemption
      const annualGross = grossMonthly * 12;
      const taxableIncome = Math.max(0, annualGross - 250000);
      let annualTax = 0;
      if (taxableIncome > 1000000) annualTax = 112500 + (taxableIncome - 1000000) * 0.3;
      else if (taxableIncome > 500000) annualTax = 12500 + (taxableIncome - 500000) * 0.2;
      else if (taxableIncome > 250000) annualTax = (taxableIncome - 250000) * 0.05;
      monthlyAmount = annualTax / 12;
    } else if (comp.calcMethod === 'FLAT') {
      monthlyAmount = comp.customFlat ?? comp.flatAmount ?? 0;
    } else if (comp.calcMethod === 'PERCENTAGE_OF_GROSS') {
      monthlyAmount = (grossMonthly * (comp.customPercentage ?? comp.percentage ?? 0)) / 100;
    }
    result.push({ ...comp, monthlyAmount, annualAmount: monthlyAmount * 12 });
  }

  return result;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  '₹' + Math.round(n).toLocaleString('en-IN');

const TYPE_CONFIG: Record<ComponentType, { label: string; dot: string; badge: string; icon: React.ReactNode }> = {
  EARNING: {
    label: 'Earning',
    dot: 'bg-[hsl(var(--teal))]',
    badge: 'bg-[hsl(var(--teal)/0.1)] text-[hsl(var(--teal))] border-[hsl(var(--teal)/0.3)]',
    icon: <TrendingUp size={10} />,
  },
  DEDUCTION: {
    label: 'Deduction',
    dot: 'bg-[hsl(var(--destructive))]',
    badge: 'bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.3)]',
    icon: <Minus size={10} />,
  },
  STATUTORY: {
    label: 'Statutory',
    dot: 'bg-[hsl(var(--accent))]',
    badge: 'bg-[hsl(var(--accent)/0.1)] text-[hsl(var(--accent))] border-[hsl(var(--accent)/0.3)]',
    icon: <Shield size={10} />,
  },
};

// ─── Component: TypeBadge ─────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: ComponentType }> = ({ type }) => {
  const { t } = useTranslation();

  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-600 border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Component: Library Card ──────────────────────────────────────────────────

interface LibraryCardProps {
  component: SalaryComponent;
  isAdded: boolean;
  onAdd: () => void;
}

const LibraryCard: React.FC<LibraryCardProps> = ({ component, isAdded, onAdd }) => {
  const { t } = useTranslation();
  return (
  <div className={`group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
    isAdded
      ? 'border-[hsl(var(--success)/0.4)] bg-[hsl(var(--success)/0.05)] opacity-60'
      : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--primary)/0.03)] hover:shadow-sm cursor-pointer'
  }`}
    onClick={!isAdded ? onAdd : undefined}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-700 shrink-0 mt-0.5 ${
      component.type === 'EARNING'
        ? 'bg-[hsl(var(--teal)/0.12)] text-[hsl(var(--teal))]'
        : component.type === 'STATUTORY'
        ? 'bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]'
        : 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]'
    }`}>
      {component.code.charAt(0)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 flex-wrap">
        <p className="text-xs font-600 text-[hsl(var(--foreground))] leading-tight">{component.name}</p>
        {component.isMandatory && (
          <span className="text-[9px] font-600 px-1.5 py-0.5 rounded bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]">{t('auto.required', 'REQUIRED')}</span>
        )}
      </div>
      <TypeBadge type={component.type} />
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 leading-snug">{component.description}</p>
      {component.percentage !== undefined && (
        <p className="text-[10px] font-600 text-[hsl(var(--primary))] mt-0.5">{component.percentage}% · {component.calcMethod.replace(/_/g, ' ')}</p>
      )}
      {component.flatAmount !== undefined && (
        <p className="text-[10px] font-600 text-[hsl(var(--primary))] mt-0.5">{fmt(component.flatAmount)}{t('auto.month_flat', '/month flat')}</p>
      )}
    </div>
    <div className={`shrink-0 transition-all duration-150 ${isAdded ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--primary))]'}`}>
      {isAdded ? <CheckCircle size={16} /> : <Plus size={16} />}
    </div>
  </div>
  );
};

// ─── Component: Active Component Row ─────────────────────────────────────────

interface ActiveRowProps {
  comp: CalculatedComponent;
  index: number;
  total: number;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
}

const ActiveRow: React.FC<ActiveRowProps> = ({
  comp, onRemove, onDragStart, onDragOver, onDrop, isDragOver, index
}) => {
  const { t } = useTranslation();
  return (
  <div
    draggable
    onDragStart={e => onDragStart(e, index)}
    onDragOver={e => { e.preventDefault(); onDragOver(e, index); }}
    onDrop={onDrop}
    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-150 group ${
      isDragOver
        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.06)] scale-[1.01]'
        : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--border-strong))]'
    }`}
  >
    {/* Drag handle */}
    <div className="text-[hsl(var(--muted-foreground))] cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-100 transition-opacity">
      <GripVertical size={14} />
    </div>

    {/* Icon */}
    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-700 shrink-0 ${
      comp.type === 'EARNING'
        ? 'bg-[hsl(var(--teal)/0.12)] text-[hsl(var(--teal))]'
        : comp.type === 'STATUTORY'
        ? 'bg-[hsl(var(--accent)/0.12)] text-[hsl(var(--accent))]'
        : 'bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]'
    }`}>
      {comp.code.charAt(0)}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-xs font-600 text-[hsl(var(--foreground))] truncate">{comp.name}</p>
        <TypeBadge type={comp.type} />
      </div>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{comp.description}</p>
    </div>

    {/* Monthly amount */}
    <div className="text-right shrink-0">
      <p className={`text-sm font-700 ${
        comp.type === 'EARNING'
          ? 'text-[hsl(var(--teal))]'
          : 'text-[hsl(var(--destructive))]'
      }`}>
        {comp.type === 'EARNING' ? '+' : '–'}{fmt(comp.monthlyAmount)}
      </p>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t('auto.month', '/month')}</p>
    </div>

    {/* Remove */}
    {!comp.isMandatory && (
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--destructive)/0.1)] hover:text-[hsl(var(--destructive))] transition-all duration-150"
      >
        <Trash2 size={13} />
      </button>
    )}
    {comp.isMandatory && (
      <div className="w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <Info size={12} className="text-[hsl(var(--muted-foreground))]" aria-label="Mandatory component" />
      </div>
    )}
  </div>
  );
};

// ─── Preview Payslip ──────────────────────────────────────────────────────────

interface PayslipPreviewProps {
  calculated: CalculatedComponent[];
  annualCTC: number;
}

const PayslipPreview: React.FC<PayslipPreviewProps> = ({ calculated, annualCTC }) => {
  const { t } = useTranslation();
  const earnings = calculated.filter(c => c.type === 'EARNING');
  const deductions = calculated.filter(c => c.type !== 'EARNING');
  const totalEarnings = earnings.reduce((s, c) => s + c.monthlyAmount, 0);
  const totalDeductions = deductions.reduce((s, c) => s + c.monthlyAmount, 0);
  const netSalary = totalEarnings - totalDeductions;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Paper-style payslip */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-800">{t('auto.yss_orbit_technologies_pvt_ltd', 'YSS Orbit Technologies Pvt. Ltd.')}</h3>
              <p className="text-white/70 text-xs mt-0.5">{t('auto.salary_slip_for_the_month_of_june_2026', 'Salary Slip for the Month of June 2026')}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">{t('auto.employee_id', 'Employee ID')}</p>
              <p className="text-sm font-700">{t('auto.emp_00124', 'EMP-00124')}</p>
            </div>
          </div>

          {/* Employee info row */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Employee Name', value: 'Arjun Mehta' },
              { label: 'Designation', value: 'Sr. Engineer' },
              { label: 'Department', value: 'Engineering' },
              { label: 'Annual CTC', value: fmt(annualCTC) },
            ].map(f => (
              <div key={f.label}>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">{f.label}</p>
                <p className="text-xs font-600 text-white mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Days row */}
        <div className="flex divide-x divide-[hsl(var(--border))] border-b border-[hsl(var(--border))] bg-[hsl(var(--background-3))]">
          {[
            { label: 'Working Days', value: '26' },
            { label: 'Paid Days', value: '26' },
            { label: 'LOP Days', value: '0' },
            { label: 'Payment Mode', value: 'NEFT' },
          ].map(item => (
            <div key={item.label} className="flex-1 px-4 py-3 text-center">
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{item.label}</p>
              <p className="text-sm font-700 text-[hsl(var(--foreground))] mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Earnings & Deductions */}
        <div className="grid grid-cols-2 divide-x divide-[hsl(var(--border))]">
          {/* Earnings */}
          <div className="p-5">
            <p className="text-xs font-700 text-[hsl(var(--foreground))] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-[hsl(var(--teal))]" />
              {t('auto.earnings', 'Earnings')}
            </p>
            <div className="space-y-2.5">
              {earnings.map(e => (
                <div key={e.id} className="flex justify-between items-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{e.name}</span>
                  <span className="text-xs font-600 text-[hsl(var(--foreground))] font-mono">{fmt(e.monthlyAmount)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex justify-between">
              <span className="text-xs font-700 text-[hsl(var(--foreground))]">{t('auto.total_earnings', 'Total Earnings')}</span>
              <span className="text-sm font-800 text-[hsl(var(--teal))] font-mono">{fmt(totalEarnings)}</span>
            </div>
          </div>

          {/* Deductions */}
          <div className="p-5">
            <p className="text-xs font-700 text-[hsl(var(--foreground))] uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Minus size={12} className="text-[hsl(var(--destructive))]" />
              {t('auto.deductions', 'Deductions')}
            </p>
            <div className="space-y-2.5">
              {deductions.map(d => (
                <div key={d.id} className="flex justify-between items-center">
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">{d.name}</span>
                  <span className="text-xs font-600 text-[hsl(var(--foreground))] font-mono">{fmt(d.monthlyAmount)}</span>
                </div>
              ))}
              {deductions.length === 0 && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] italic">{t('auto.no_deductions_added', 'No deductions added')}</p>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-[hsl(var(--border))] flex justify-between">
              <span className="text-xs font-700 text-[hsl(var(--foreground))]">{t('auto.total_deductions', 'Total Deductions')}</span>
              <span className="text-sm font-800 text-[hsl(var(--destructive))] font-mono">{fmt(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Net Salary Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.08)] border-t border-[hsl(var(--border))] flex items-center justify-between">
          <div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('auto.net_salary_payable', 'Net Salary Payable')}</p>
            <p className="text-2xl font-800 gradient-text">{fmt(netSalary)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{t('auto.in_words', 'In Words:')}</p>
            <p className="text-xs font-500 text-[hsl(var(--foreground))]">
              {netSalary > 0 ? `${Math.round(netSalary / 1000)}K Rupees approximately` : '—'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[hsl(var(--background-3))] border-t border-[hsl(var(--border))] flex items-center justify-between">
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
            {t('auto.this_is_a_computer_generated_payslip_and_requires_', 'This is a computer-generated payslip and requires no signature.')}
          </p>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
              <Printer size={11} />
              {t('auto.print', 'Print')}
            </button>
            <button className="flex items-center gap-1 text-[10px] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
              <Download size={11} />
              {t('auto.pdf', 'PDF')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main SalaryBuilder Component ────────────────────────────────────────────

export const SalaryBuilder: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'builder' | 'preview'>('builder');
  const [annualCTC, setAnnualCTC] = useState(SAMPLE_CTC);
  const [ctcInput, setCtcInput] = useState('12,00,000');

  // Initialize with mandatory components
  const [activeComponents, setActiveComponents] = useState<ActiveComponent[]>(
    COMPONENT_LIBRARY
      .filter(c => c.isMandatory)
      .map(c => ({ ...c, structureId: `s-${c.id}` }))
  );

  // Drag state
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const addedIds = activeComponents.map(c => c.id);
  const availableComponents = COMPONENT_LIBRARY.filter(c => !addedIds.includes(c.id));
  const addedComponents = COMPONENT_LIBRARY.filter(c => addedIds.includes(c.id));

  // Calculate
  const calculated = calculateComponents(activeComponents, annualCTC);
  const earnings = calculated.filter(c => c.type === 'EARNING');
  const deductions = calculated.filter(c => c.type !== 'EARNING');
  const totalMonthlyEarnings = earnings.reduce((s, c) => s + c.monthlyAmount, 0);
  const totalMonthlyDeductions = deductions.reduce((s, c) => s + c.monthlyAmount, 0);
  const monthlyNet = totalMonthlyEarnings - totalMonthlyDeductions;
  const monthlyGross = totalMonthlyEarnings;

  const pfComponent = calculated.find(c => c.code === 'PF_EMPLOYEE');
  const esiComponent = calculated.find(c => c.code === 'ESI_EMPLOYEE');
  const tdsComponent = calculated.find(c => c.code === 'TDS');

  const handleAddComponent = (comp: SalaryComponent) => {
    setActiveComponents(prev => [...prev, { ...comp, structureId: `s-${comp.id}-${Date.now()}` }]);
  };

  const handleRemoveComponent = (structureId: string) => {
    setActiveComponents(prev => prev.filter(c => c.structureId !== structureId));
  };

  const handleDragStart = useCallback((_e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((_e: React.DragEvent, index: number) => {
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((_e: React.DragEvent) => {
    const fromIdx = dragIndexRef.current;
    const toIdx = dragOverIndex;
    if (fromIdx === null || toIdx === null || fromIdx === toIdx) {
      setDragOverIndex(null);
      return;
    }
    setActiveComponents(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved!);
      return arr;
    });
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }, [dragOverIndex]);

  const handleCtcChange = (val: string) => {
    setCtcInput(val);
    const numeric = Number(val.replace(/,/g, ''));
    if (!isNaN(numeric) && numeric > 0) {
      setAnnualCTC(numeric);
    }
  };

  const TAB_STYLES = (active: boolean) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-600 transition-all duration-150 ${
      active
        ? 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white shadow-md'
        : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
    }`;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-500 text-[hsl(var(--muted-foreground))] uppercase tracking-wider">{t('auto.payroll', 'Payroll')}</span>
              <ChevronRight size={13} className="text-[hsl(var(--border-strong))]" />
              <span className="text-xs font-500 text-[hsl(var(--primary))]">{t('auto.salary_structure_builder', 'Salary Structure Builder')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-800 text-[hsl(var(--foreground))]">
              {t('auto.salary', 'Salary')} <span className="gradient-text">{t('auto.structure_builder', 'Structure Builder')}</span>
            </h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
              {t('auto.drag_drop_components_to_build_your_salary_structur', 'Drag & drop components to build your salary structure')}
            </p>
          </div>
          {/* CTC Input */}
          <div className="flex items-center gap-3 glass rounded-2xl px-4 py-3">
            <div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-600 mb-1">{t('auto.sample_annual_ctc', 'Sample Annual CTC')}</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-700 text-[hsl(var(--muted-foreground))]">₹</span>
                <input
                  type="text"
                  value={ctcInput}
                  onChange={e => handleCtcChange(e.target.value)}
                  className="w-32 text-sm font-700 text-[hsl(var(--foreground))] bg-transparent border-b border-[hsl(var(--border-strong))] focus:outline-none focus:border-[hsl(var(--primary))] pb-0.5 transition-colors"
                />
              </div>
            </div>
            <div className="h-10 w-px bg-[hsl(var(--border))]" />
            <div className="text-right">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{t('auto.monthly', 'Monthly')}</p>
              <p className="text-base font-800 gradient-text">{fmt(annualCTC / 12)}</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-2 p-1.5 bg-[hsl(var(--background-3))] rounded-2xl w-fit border border-[hsl(var(--border))]">
          <button className={TAB_STYLES(activeTab === 'builder')} onClick={() => setActiveTab('builder')}>
            <Layers size={15} />
            {t('auto.structure_builder', 'Structure Builder')}
          </button>
          <button className={TAB_STYLES(activeTab === 'preview')} onClick={() => setActiveTab('preview')}>
            <Eye size={15} />
            {t('auto.preview_payslip', 'Preview Payslip')}
          </button>
        </div>

        {/* ── BUILDER TAB ── */}
        {activeTab === 'builder' && (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] gap-5">

            {/* ── LEFT: Component Library ── */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-3)/0.5)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center">
                    <Layers size={12} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-700 text-[hsl(var(--foreground))]">{t('auto.component_library', 'Component Library')}</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t('auto.click_to_add_to_structure', 'Click to add to structure')}</p>
                  </div>
                </div>
              </div>

              {/* Available */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                <p className="text-[10px] font-700 text-[hsl(var(--muted-foreground))] uppercase tracking-wider px-1 mb-2">{t('auto.available_components', 'Available Components')}</p>
                {COMPONENT_LIBRARY.map(comp => (
                  <LibraryCard
                    key={comp.id}
                    component={comp}
                    isAdded={addedIds.includes(comp.id)}
                    onAdd={() => handleAddComponent(comp)}
                  />
                ))}
              </div>
            </div>

            {/* ── CENTER: Drop Zone / Active Structure ── */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--background-3)/0.5)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[hsl(var(--teal))] to-[hsl(var(--primary))] flex items-center justify-center">
                      <Sliders size={12} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-700 text-[hsl(var(--foreground))]">{t('auto.active_structure', 'Active Structure')}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{t('auto.drag_to_reorder', 'Drag to reorder ·')} {activeComponents.length} {t('auto.components', 'components')}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-600">
                    {fmt(annualCTC)} {t('auto.p_a', 'p.a.')}
                  </span>
                </div>
              </div>

              {activeComponents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--primary)/0.08)] flex items-center justify-center mx-auto mb-3">
                      <Plus size={24} className="text-[hsl(var(--primary)/0.5)]" />
                    </div>
                    <p className="text-sm font-600 text-[hsl(var(--muted-foreground))]">{t('auto.no_components_added', 'No components added')}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{t('auto.click_components_from_the_library_to_add_them', 'Click components from the library to add them')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {/* Earnings section */}
                  <div className="mb-1">
                    <p className="text-[10px] font-700 text-[hsl(var(--teal))] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <TrendingUp size={10} />
                      {t('auto.earnings', 'Earnings')}
                    </p>
                    {calculated.filter(c => c.type === 'EARNING').map((comp, i) => {
                      const overallIdx = calculated.indexOf(comp);
                      return (
                        <div key={comp.structureId} className="mb-2">
                          <ActiveRow
                            comp={comp}
                            index={overallIdx}
                            total={calculated.length}
                            onRemove={() => handleRemoveComponent(comp.structureId)}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            isDragOver={dragOverIndex === overallIdx}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Deductions section */}
                  {deductions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-700 text-[hsl(var(--destructive))] uppercase tracking-wider mb-2 flex items-center gap-1.5 mt-3">
                        <Minus size={10} />
                        {t('auto.deductions_statutory', 'Deductions & Statutory')}
                      </p>
                      {calculated.filter(c => c.type !== 'EARNING').map((comp, i) => {
                        const overallIdx = calculated.indexOf(comp);
                        return (
                          <div key={comp.structureId} className="mb-2">
                            <ActiveRow
                              comp={comp}
                              index={overallIdx}
                              total={calculated.length}
                              onRemove={() => handleRemoveComponent(comp.structureId)}
                              onDragStart={handleDragStart}
                              onDragOver={handleDragOver}
                              onDrop={handleDrop}
                              isDragOver={dragOverIndex === overallIdx}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Net summary bar */}
                  <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-r from-[hsl(var(--primary)/0.08)] to-[hsl(var(--accent)/0.08)] border border-[hsl(var(--primary)/0.2)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IndianRupee size={14} className="text-[hsl(var(--primary))]" />
                        <span className="text-xs font-700 text-[hsl(var(--foreground))]">{t('auto.monthly_net_take_home', 'Monthly Net Take-Home')}</span>
                      </div>
                      <span className="text-base font-800 gradient-text">{fmt(monthlyNet)}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[hsl(var(--border))] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
                        style={{ width: `${Math.min(100, (monthlyNet / monthlyGross) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1">
                      {Math.round((monthlyNet / Math.max(monthlyGross, 1)) * 100)}{t('auto.of_gross_salary', '% of gross salary')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT: CTC Breakdown ── */}
            <div className="space-y-4">
              {/* CTC Breakdown Card */}
              <div className="glass rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--primary)/0.06)] to-[hsl(var(--accent)/0.06)]">
                  <div className="flex items-center gap-2">
                    <Building2 size={13} className="text-[hsl(var(--primary))]" />
                    <p className="text-xs font-700 text-[hsl(var(--foreground))]">{t('auto.ctc_breakdown', 'CTC Breakdown')}</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { label: 'Annual CTC', value: fmt(annualCTC), isMain: true, color: 'gradient-text' },
                    { label: 'Monthly Gross', value: fmt(monthlyGross), color: 'text-[hsl(var(--teal))]' },
                    { label: 'Monthly Net', value: fmt(monthlyNet), color: 'text-[hsl(var(--success))]' },
                    {
                      label: 'PF (Employee)',
                      value: pfComponent ? fmt(pfComponent.monthlyAmount) : '—',
                      color: 'text-[hsl(var(--accent))]',
                    },
                    {
                      label: 'ESI (Employee)',
                      value: esiComponent ? fmt(esiComponent.monthlyAmount) : '—',
                      color: 'text-[hsl(var(--accent))]',
                    },
                    {
                      label: 'TDS / Month',
                      value: tdsComponent ? fmt(tdsComponent.monthlyAmount) : '—',
                      color: 'text-[hsl(var(--destructive))]',
                    },
                    {
                      label: 'Total Deductions',
                      value: fmt(totalMonthlyDeductions),
                      color: 'text-[hsl(var(--destructive))]',
                    },
                  ].map((item, i) => (
                    <div key={item.label}>
                      {i === 1 && <div className="h-px bg-[hsl(var(--border))] -mx-1 mb-3" />}
                      {i === 3 && <div className="h-px bg-[hsl(var(--border))] -mx-1 mb-3" />}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${item.isMain ? 'font-700 text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'}`}>
                          {item.label}
                        </span>
                        <span className={`text-xs font-700 font-mono ${item.color}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Component Breakdown Donut Text */}
              <div className="glass rounded-2xl p-4">
                <p className="text-xs font-700 text-[hsl(var(--foreground))] mb-3 flex items-center gap-1.5">
                  <User size={12} className="text-[hsl(var(--primary))]" />
                  {t('auto.component_allocation', 'Component Allocation')}
                </p>
                <div className="space-y-2">
                  {calculated.filter(c => c.type === 'EARNING').slice(0, 5).map(comp => {
                    const pct = monthlyGross > 0 ? (comp.monthlyAmount / monthlyGross) * 100 : 0;
                    return (
                      <div key={comp.id}>
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{comp.name}</span>
                          <span className="text-[10px] font-600 text-[hsl(var(--foreground))] ml-2">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1 rounded-full bg-[hsl(var(--border))] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview CTA */}
              <button
                onClick={() => setActiveTab('preview')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white text-sm font-600 hover:opacity-90 hover:scale-[1.01] transition-all duration-150 shadow-lg"
              >
                <FileText size={15} />
                {t('auto.preview_payslip', 'Preview Payslip')}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── PREVIEW TAB ── */}
        {activeTab === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[hsl(var(--primary)/0.06)] border border-[hsl(var(--primary)/0.2)]">
              <Info size={14} className="text-[hsl(var(--primary))] shrink-0" />
              <p className="text-xs text-[hsl(var(--foreground))]">
                {t('auto.preview_based_on_a_sample_employee_with_annual_ctc', 'Preview based on a sample employee with Annual CTC of')} <strong>{fmt(annualCTC)}</strong>.
                {t('auto.actual_payslips_will_use_employee_specific_attenda', 'Actual payslips will use employee-specific attendance, declarations, and LOP data.')}
              </p>
              <button
                onClick={() => setActiveTab('builder')}
                className="shrink-0 text-xs font-600 text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
              >
                {t('auto.edit_structure', 'Edit Structure')}
                <ChevronRight size={12} />
              </button>
            </div>
            <PayslipPreview calculated={calculated} annualCTC={annualCTC} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SalaryBuilder;
