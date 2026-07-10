import React, { useState, useMemo } from 'react';
import {
  FileText, Users, ChevronDown, CheckCircle2, Clock, Lock,
  AlertCircle, XCircle, TrendingUp, IndianRupee, Shield,
  Calculator, Info, BadgeCheck, ChevronRight, RefreshCw,
  User, Building, Filter, Calendar
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type TaxRegime = 'OLD_REGIME' | 'NEW_REGIME';
type DeclarationStatus = 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'LOCKED';
type TabId = 'my' | 'team';
type FY = '2024-25' | '2025-26';

interface DeclarationFormData {
  // 80C
  pf: number;
  lic: number;
  elss: number;
  ppf: number;
  homeLoanPrincipal: number;
  // 80D
  selfMedical: number;
  parentsMedical: number;
  // HRA
  rentPaid: number;
  metroCity: boolean;
  // LTA
  ltaAmount: number;
  // Other
  nps: number;
  homeLoanInterest: number;
}

interface TeamMember {
  id: string;
  name: string;
  code: string;
  designation: string;
  department: string;
  regime: TaxRegime;
  totalDeclared: number;
  estimatedAnnualTax: number;
  monthlyTds: number;
  status: DeclarationStatus;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TEAM: TeamMember[] = [
  { id: 'E01', name: 'Arjun Kumar', code: 'YSS-001', designation: 'Sr. Software Engineer', department: 'Engineering', regime: 'OLD_REGIME', totalDeclared: 285000, estimatedAnnualTax: 52400, monthlyTds: 4367, status: 'VERIFIED' },
  { id: 'E02', name: 'Priya Sharma', code: 'YSS-002', designation: 'Product Manager', department: 'Product', regime: 'NEW_REGIME', totalDeclared: 0, estimatedAnnualTax: 104000, monthlyTds: 8667, status: 'SUBMITTED' },
  { id: 'E03', name: 'Rohan Mehta', code: 'YSS-003', designation: 'UI/UX Designer', department: 'Design', regime: 'OLD_REGIME', totalDeclared: 150000, estimatedAnnualTax: 22750, monthlyTds: 1896, status: 'DRAFT' },
  { id: 'E04', name: 'Sneha Iyer', code: 'YSS-004', designation: 'HR Business Partner', department: 'HR', regime: 'OLD_REGIME', totalDeclared: 300000, estimatedAnnualTax: 36900, monthlyTds: 3075, status: 'LOCKED' },
  { id: 'E05', name: 'Vikram Nair', code: 'YSS-005', designation: 'DevOps Engineer', department: 'Infrastructure', regime: 'NEW_REGIME', totalDeclared: 0, estimatedAnnualTax: 78000, monthlyTds: 6500, status: 'SUBMITTED' },
  { id: 'E06', name: 'Divya Pillai', code: 'YSS-006', designation: 'Data Analyst', department: 'Analytics', regime: 'OLD_REGIME', totalDeclared: 210000, estimatedAnnualTax: 48100, monthlyTds: 4008, status: 'VERIFIED' },
  { id: 'E07', name: 'Kiran Rao', code: 'YSS-007', designation: 'Backend Engineer', department: 'Engineering', regime: 'OLD_REGIME', totalDeclared: 75000, estimatedAnnualTax: 38500, monthlyTds: 3208, status: 'DRAFT' },
  { id: 'E08', name: 'Ananya Singh', code: 'YSS-008', designation: 'Finance Manager', department: 'Finance', regime: 'NEW_REGIME', totalDeclared: 0, estimatedAnnualTax: 125000, monthlyTds: 10417, status: 'SUBMITTED' },
];

import { useTranslation } from 'react-i18next';



const INITIAL_FORM: DeclarationFormData = {
  pf: 72000, lic: 25000, elss: 50000, ppf: 0, homeLoanPrincipal: 0,
  selfMedical: 15000, parentsMedical: 0,
  rentPaid: 20000, metroCity: true,
  ltaAmount: 15000,
  nps: 50000, homeLoanInterest: 0,
};

// ─── Tax Computation ──────────────────────────────────────────────────────────
const ANNUAL_CTC = 1247166; // ~1.25 lakh/month

function computeOldRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 250000) tax = 0;
  else if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.20;
  else tax = 112500 + (taxableIncome - 1000000) * 0.30;
  const cess = tax * 0.04;
  return Math.round(tax + cess);
}

function computeNewRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 300000) tax = 0;
  else if (taxableIncome <= 700000) tax = (taxableIncome - 300000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 20000 + (taxableIncome - 700000) * 0.10;
  else if (taxableIncome <= 1200000) tax = 50000 + (taxableIncome - 1000000) * 0.15;
  else if (taxableIncome <= 1500000) tax = 80000 + (taxableIncome - 1200000) * 0.20;
  else tax = 140000 + (taxableIncome - 1500000) * 0.30;
  const cess = tax * 0.04;
  return Math.round(tax + cess);
}

function computeTax(form: DeclarationFormData, regime: TaxRegime): { annualTax: number; monthlyTds: number; taxableIncome: number; totalDeductions: number } {
  const grossAnnual = ANNUAL_CTC;

  if (regime === 'NEW_REGIME') {
    // Standard deduction 75k under new regime
    const stdDeduction = 75000;
    const taxableIncome = Math.max(0, grossAnnual - stdDeduction);
    const annualTax = computeNewRegimeTax(taxableIncome);
    return { annualTax, monthlyTds: Math.round(annualTax / 12), taxableIncome, totalDeductions: stdDeduction };
  }

  // Old Regime
  const sec80C = Math.min(form.pf + form.lic + form.elss + form.ppf + form.homeLoanPrincipal, 150000);
  const sec80D = Math.min(form.selfMedical, 25000) + Math.min(form.parentsMedical, 50000);
  const stdDeduction = 50000;
  // HRA: simplified calc
  const basicSalary = grossAnnual * 0.40; // ~40% basic
  const hraReceived = grossAnnual * 0.16;
  const hraExempt = Math.min(hraReceived, (form.rentPaid * 12) - (0.10 * basicSalary), form.metroCity ? basicSalary * 0.50 : basicSalary * 0.40);
  const hraExemption = Math.max(0, hraExempt);
  const sec80CCD = Math.min(form.nps, 50000);
  const homeLoanInterest = Math.min(form.homeLoanInterest, 200000);
  const lta = Math.min(form.ltaAmount, 20000);

  const totalDeductions = sec80C + sec80D + stdDeduction + hraExemption + sec80CCD + homeLoanInterest + lta;
  const taxableIncome = Math.max(0, grossAnnual - totalDeductions);
  const annualTax = computeOldRegimeTax(taxableIncome);
  return { annualTax, monthlyTds: Math.round(annualTax / 12), taxableIncome, totalDeductions };
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<DeclarationStatus, { label: string; icon: React.FC<{ className?: string }>; bg: string; text: string; dot: string }> = {
  DRAFT:     { label: 'Draft',     icon: Clock,        bg: 'hsl(var(--warning) / 0.12)',     text: 'hsl(var(--warning))',     dot: 'hsl(var(--warning))' },
  SUBMITTED: { label: 'Submitted', icon: CheckCircle2, bg: 'hsl(var(--primary) / 0.1)',      text: 'hsl(var(--primary))',     dot: 'hsl(var(--primary))' },
  VERIFIED:  { label: 'Verified',  icon: BadgeCheck,   bg: 'hsl(var(--success) / 0.1)',      text: 'hsl(var(--success))',     dot: 'hsl(var(--success))' },
  LOCKED:    { label: 'Locked',    icon: Lock,         bg: 'hsl(var(--accent) / 0.1)',       text: 'hsl(var(--accent))',      dot: 'hsl(var(--accent))' },
};

const StatusBadge: React.FC<{ status: DeclarationStatus }> = ({ status }) => {
  const { t } = useTranslation();

  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// ─── Input Field ──────────────────────────────────────────────────────────────
const AmountInput: React.FC<{
  label: string; subLabel?: string; limit?: number;
  value: number; onChange: (v: number) => void; disabled?: boolean;
}> = ({ label, subLabel, limit, value, onChange, disabled }) => {
  const { t } = useTranslation();
  return (
  <div className="group">
    <div className="flex items-baseline justify-between mb-1.5">
      <label className="text-sm font-medium" style={{ color: 'hsl(var(--foreground))' }}>{label}</label>
      {limit && (
        <span className="text-xs font-mono" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {t('auto.limit', 'Limit: â‚¹')}{new Intl.NumberFormat('en-IN').format(limit)}
        </span>
      )}
    </div>
    {subLabel && <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted-foreground))' }}>{subLabel}</p>}
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold"
        style={{ color: 'hsl(var(--muted-foreground))' }}>â‚¹</span>
      <input
        type="number" min={0} max={limit ?? 999999999}
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(Math.max(0, Number(e.target.value)))}
        placeholder="0"
        className="w-full pl-7 pr-3 py-2.5 rounded-xl text-sm font-mono transition-all duration-200 outline-none"
        style={{
          background: disabled ? 'hsl(var(--muted) / 0.4)' : 'hsl(var(--background))',
          border: `1px solid hsl(var(--border))`,
          color: 'hsl(var(--foreground))',
        }}
        onFocus={e => { e.target.style.borderColor = 'hsl(var(--primary))'; }}
        onBlur={e => { e.target.style.borderColor = 'hsl(var(--border))'; }}
      />
      {limit && value > 0 && (
        <div className="absolute bottom-0 left-0 h-0.5 rounded-full transition-all duration-500"
          style={{
            background: value >= limit ? 'hsl(var(--success))' : 'hsl(var(--primary))',
            width: `${Math.min(100, (value / limit) * 100)}%`,
          }} />
      )}
    </div>
  </div>
  );
};

// ─── Regime Comparison Table ──────────────────────────────────────────────────
const RegimeComparison: React.FC<{ selected: TaxRegime; onSelect: (r: TaxRegime) => void }> = ({ selected, onSelect }) => {
  const { t } = useTranslation();

  const oldSlabs = [
    { slab: 'Up to â‚¹2.5L', rate: 'Nil' },
    { slab: 'â‚¹2.5L â€“ â‚¹5L', rate: '5%' },
    { slab: 'â‚¹5L â€“ â‚¹10L', rate: '20%' },
    { slab: 'Above â‚¹10L', rate: '30%' },
  ];
  const newSlabs = [
    { slab: 'Up to â‚¹3L', rate: 'Nil' },
    { slab: 'â‚¹3L â€“ â‚¹7L', rate: '5%' },
    { slab: 'â‚¹7L â€“ â‚¹10L', rate: '10%' },
    { slab: 'â‚¹10L â€“ â‚¹12L', rate: '15%' },
    { slab: 'â‚¹12L â€“ â‚¹15L', rate: '20%' },
    { slab: 'Above â‚¹15L', rate: '30%' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(['OLD_REGIME', 'NEW_REGIME'] as TaxRegime[]).map(regime => {
        const isSelected = selected === regime;
        const slabs = regime === 'OLD_REGIME' ? oldSlabs : newSlabs;
        const title = regime === 'OLD_REGIME' ? 'Old Tax Regime' : 'New Tax Regime';
        const subtitle = regime === 'OLD_REGIME'
          ? 'Standard Deduction â‚¹50,000 + Deductions (80C, HRA, etc.)'
          : 'Standard Deduction â‚¹75,000. No other deductions.';
        return (
          <button key={regime} onClick={() => onSelect(regime)}
            className="text-left rounded-2xl p-5 transition-all duration-200 hover:scale-[1.01]"
            style={{
              background: isSelected ? 'hsl(var(--primary) / 0.08)' : 'hsl(var(--card))',
              border: `2px solid ${isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
            }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-bold text-sm" style={{ color: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{title}</h4>
                <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{subtitle}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all`}
                style={{
                  borderColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  background: isSelected ? 'hsl(var(--primary))' : 'transparent',
                }}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>
            <div className="space-y-1">
              {slabs.map(s => (
                <div key={s.slab} className="flex items-center justify-between py-1 border-b"
                  style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
                  <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{s.slab}</span>
                  <span className="text-xs font-bold font-mono" style={{ color: s.rate === 'Nil' ? 'hsl(var(--success))' : 'hsl(var(--foreground))' }}>{s.rate}</span>
                </div>
              ))}
            </div>
            {isSelected && (
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'hsl(var(--primary))' }} />
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--primary))' }}>{t('auto.selected', 'Selected')}</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── TDS Preview Card ─────────────────────────────────────────────────────────
const TDSPreview: React.FC<{
  annualTax: number; monthlyTds: number; taxableIncome: number; totalDeductions: number;
}> = ({ annualTax, monthlyTds, taxableIncome, totalDeductions }) => {
  const { t } = useTranslation();
  return (
  <div className="rounded-2xl overflow-hidden"
    style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)' }}>
    <div className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.8)' }} />
        <h3 className="font-bold text-sm uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.8)' }}>
          {t('auto.live_tds_computation', 'Live TDS Computation')}
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('auto.total_deductions_declared', 'Total Deductions Declared')}</div>
          <div className="text-xl font-black" style={{ color: '#fff' }}>
            â‚¹{new Intl.NumberFormat('en-IN').format(totalDeductions)}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('auto.taxable_income', 'Taxable Income')}</div>
          <div className="text-xl font-black" style={{ color: '#fff' }}>
            â‚¹{new Intl.NumberFormat('en-IN').format(taxableIncome)}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('auto.estimated_annual_tax', 'Estimated Annual Tax')}</div>
          <div className="text-2xl font-black" style={{ color: '#fff' }}>
            â‚¹{new Intl.NumberFormat('en-IN').format(annualTax)}
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('auto.monthly_tds', 'Monthly TDS')}</div>
          <div className="text-2xl font-black" style={{ color: '#FFD700' }}>
            â‚¹{new Intl.NumberFormat('en-IN').format(monthlyTds)}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {t('auto.indicative_computation_actual_tds_may_vary_based_o', '* Indicative computation. Actual TDS may vary based on payroll processing.')}
        </p>
      </div>
    </div>
  </div>
  );
};

// ─── My Declaration Tab ───────────────────────────────────────────────────────
const MyDeclarationTab: React.FC = () => {
  const { t } = useTranslation();

  const [fy, setFy] = useState<FY>('2025-26');
  const [regime, setRegime] = useState<TaxRegime>('OLD_REGIME');
  const [status, setStatus] = useState<DeclarationStatus>('DRAFT');
  const [form, setForm] = useState<DeclarationFormData>(INITIAL_FORM);
  const [showRegimeComparison, setShowRegimeComparison] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof DeclarationFormData) => (v: number | boolean) =>
    setForm(f => ({ ...f, [key]: v }));

  const computed = useMemo(() => computeTax(form, regime), [form, regime]);

  const sec80CTotal = Math.min(form.pf + form.lic + form.elss + form.ppf + form.homeLoanPrincipal, 150000);
  const sec80DTotal = Math.min(form.selfMedical, 25000) + Math.min(form.parentsMedical, 50000);
  const isLocked = status === 'LOCKED';

  const handleSubmit = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setStatus(prev => prev === 'DRAFT' ? 'SUBMITTED' : prev);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{ background: 'hsl(var(--secondary))' }}>
            <Calendar className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
            <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.financial_year', 'Financial Year:')}</span>
            <select value={fy} onChange={e => setFy(e.target.value as FY)}
              className="text-sm font-bold bg-transparent outline-none cursor-pointer"
              style={{ color: 'hsl(var(--primary))' }}>
              <option value="2024-25">2024-25</option>
              <option value="2025-26">2025-26</option>
            </select>
          </div>
          <StatusBadge status={status} />
        </div>
        {!isLocked && (
          <div className="flex items-center gap-2">
            <button onClick={() => setForm(INITIAL_FORM)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105"
              style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--muted-foreground))' }}>
              <RefreshCw className="w-3.5 h-3.5" />
              {t('auto.reset', 'Reset')}
            </button>
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-70"
              style={{ background: 'hsl(var(--primary))', color: '#fff' }}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {status === 'DRAFT' ? 'Submit Declaration' : 'Update Declaration'}
            </button>
          </div>
        )}
      </div>

      {isLocked && (
        <div className="flex items-center gap-3 p-4 rounded-xl"
          style={{ background: 'hsl(var(--accent) / 0.08)', border: '1px solid hsl(var(--accent) / 0.2)' }}>
          <Lock className="w-5 h-5 flex-shrink-0" style={{ color: 'hsl(var(--accent))' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'hsl(var(--accent))' }}>{t('auto.declaration_locked', 'Declaration Locked')}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('auto.this_declaration_has_been_locked_by_hr_contact_hr_', 'This declaration has been locked by HR. Contact HR to make any changes.')}
            </p>
          </div>
        </div>
      )}

      {/* Regime Selector */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            <h3 className="font-bold" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.tax_regime', 'Tax Regime')}</h3>
          </div>
          <button onClick={() => setShowRegimeComparison(!showRegimeComparison)}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors"
            style={{ color: 'hsl(var(--primary))' }}>
            <Info className="w-3.5 h-3.5" />
            {showRegimeComparison ? 'Hide' : 'Compare'} {t('auto.regimes', 'Regimes')}
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showRegimeComparison ? 'rotate-90' : ''}`} />
          </button>
        </div>
        <RegimeComparison selected={regime} onSelect={r => !isLocked && setRegime(r)} />
      </div>

      {/* TDS Preview */}
      <TDSPreview {...computed} />

      {/* Declaration Sections — only show for Old Regime */}
      {regime === 'OLD_REGIME' ? (
        <>
          {/* Section 80C */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
                  style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>{t('auto.80c', '80C')}</div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.section_80c_investments_savings', 'Section 80C — Investments & Savings')}</h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.maximum_deduction_1_50_000', 'Maximum deduction: â‚¹1,50,000')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black" style={{ color: sec80CTotal >= 150000 ? 'hsl(var(--success))' : 'hsl(var(--primary))' }}>
                  â‚¹{new Intl.NumberFormat('en-IN').format(sec80CTotal)}
                </div>
                <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>/ â‚¹1,50,000</div>
                <div className="w-32 h-1.5 rounded-full mt-1 ml-auto" style={{ background: 'hsl(var(--border))' }}>
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (sec80CTotal / 150000) * 100)}%`, background: 'hsl(var(--primary))' }} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <AmountInput label={t('auto.provident_fund_pf', 'Provident Fund (PF)')} subLabel="Employee's own PF contribution" limit={150000} value={form.pf} onChange={set('pf')} disabled={isLocked} />
              <AmountInput label={t('auto.lic_premium', 'LIC Premium')} subLabel="Life insurance premium paid" limit={150000} value={form.lic} onChange={set('lic')} disabled={isLocked} />
              <AmountInput label={t('auto.elss_mutual_funds', 'ELSS Mutual Funds')} subLabel="Equity Linked Savings Scheme" limit={150000} value={form.elss} onChange={set('elss')} disabled={isLocked} />
              <AmountInput label={t('auto.ppf_contribution', 'PPF Contribution')} subLabel="Public Provident Fund" limit={150000} value={form.ppf} onChange={set('ppf')} disabled={isLocked} />
              <AmountInput label={t('auto.home_loan_principal', 'Home Loan Principal')} subLabel="Repayment of housing loan principal" limit={150000} value={form.homeLoanPrincipal} onChange={set('homeLoanPrincipal')} disabled={isLocked} />
            </div>
          </div>

          {/* Section 80D */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs"
                  style={{ background: 'hsl(var(--teal) / 0.1)', color: 'hsl(var(--teal))' }}>{t('auto.80d', '80D')}</div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.section_80d_medical_insurance', 'Section 80D — Medical Insurance')}</h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.self_up_to_25_000_parents_senior_up_to_50_000', 'Self: up to â‚¹25,000 | Parents (Senior): up to â‚¹50,000')}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black" style={{ color: 'hsl(var(--teal))' }}>
                  â‚¹{new Intl.NumberFormat('en-IN').format(sec80DTotal)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AmountInput label={t('auto.self_family_medical_insurance', 'Self & Family Medical Insurance')} limit={25000} value={form.selfMedical} onChange={set('selfMedical')} disabled={isLocked} />
              <AmountInput label={t('auto.parents_medical_insurance', 'Parents\' Medical Insurance')} subLabel="Up to â‚¹50,000 for senior citizen parents" limit={50000} value={form.parentsMedical} onChange={set('parentsMedical')} disabled={isLocked} />
            </div>
          </div>

          {/* HRA & LTA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: 'hsl(var(--accent) / 0.1)', color: 'hsl(var(--accent))' }}>{t('auto.hra', 'HRA')}</div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.hra_exemption', 'HRA Exemption')}</h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.house_rent_allowance', 'House Rent Allowance')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <AmountInput label={t('auto.monthly_rent_paid', 'Monthly Rent Paid')} subLabel="Actual rent paid per month" value={form.rentPaid} onChange={set('rentPaid')} disabled={isLocked} />
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => !isLocked && set('metroCity')(!form.metroCity)}
                    className="relative w-10 h-5 rounded-full transition-all duration-200"
                    style={{ background: form.metroCity ? 'hsl(var(--primary))' : 'hsl(var(--border-strong))' }}>
                    <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                      style={{ left: form.metroCity ? '1.375rem' : '0.125rem' }} />
                  </button>
                  <span className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>
                    {t('auto.metro_city_50_hra_exemption', 'Metro City (50% HRA exemption)')}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                  style={{ background: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))' }}>{t('auto.lta', 'LTA')}</div>
                <div>
                  <h3 className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.lta_other_exemptions', 'LTA & Other Exemptions')}</h3>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.leave_travel_allowance', 'Leave Travel Allowance')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <AmountInput label={t('auto.lta_claim_amount', 'LTA Claim Amount')} subLabel="Actual travel bills, max â‚¹20,000" limit={20000} value={form.ltaAmount} onChange={set('ltaAmount')} disabled={isLocked} />
                <AmountInput label={t('auto.home_loan_interest_sec_24b', 'Home Loan Interest (Sec 24b)')} subLabel="Max â‚¹2,00,000 for self-occupied" limit={200000} value={form.homeLoanInterest} onChange={set('homeLoanInterest')} disabled={isLocked} />
              </div>
            </div>
          </div>

          {/* NPS */}
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black"
                style={{ background: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))' }}>{t('auto.nps', 'NPS')}</div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: 'hsl(var(--foreground))' }}>{t('auto.sec_80ccd_1b_nps_contribution', 'Sec 80CCD(1B) — NPS Contribution')}</h3>
                <p className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.additional_50_000_over_80c_limit', 'Additional â‚¹50,000 over 80C limit')}</p>
              </div>
            </div>
            <div className="max-w-sm">
              <AmountInput label={t('auto.nps_contribution', 'NPS Contribution')} limit={50000} value={form.nps} onChange={set('nps')} disabled={isLocked} />
            </div>
          </div>
        </>
      ) : (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.1)' }}>
            <TrendingUp className="w-8 h-8" style={{ color: 'hsl(var(--primary))' }} />
          </div>
          <h3 className="font-bold text-lg mb-2" style={{ color: 'hsl(var(--foreground))' }}>
            {t('auto.new_regime_no_declaration_required', 'New Regime — No Declaration Required')}
          </h3>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
            {t('auto.under_the_new_tax_regime_deductions_under_80c_80d_', 'Under the New Tax Regime, deductions under 80C, 80D, HRA, LTA etc. are not applicable. You get a flat standard deduction of ₹75,000. Your TDS has been computed above.')}
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Team Declarations Tab ────────────────────────────────────────────────────
const TeamDeclarationsTab: React.FC = () => {
  const { t } = useTranslation();

  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM);
  const [filterStatus, setFilterStatus] = useState<DeclarationStatus | 'ALL'>('ALL');
  const [filterRegime, setFilterRegime] = useState<TaxRegime | 'ALL'>('ALL');

  const filtered = members.filter(m =>
    (filterStatus === 'ALL' || m.status === filterStatus) &&
    (filterRegime === 'ALL' || m.regime === filterRegime)
  );

  const stats = {
    total: members.length,
    submitted: members.filter(m => m.status === 'SUBMITTED').length,
    verified: members.filter(m => m.status === 'VERIFIED').length,
    pending: members.filter(m => m.status === 'DRAFT').length,
    locked: members.filter(m => m.status === 'LOCKED').length,
  };

  const handleVerify = (id: string) =>
    setMembers(ms => ms.map(m => m.id === id ? { ...m, status: 'VERIFIED' } : m));
  const handleReject = (id: string) =>
    setMembers(ms => ms.map(m => m.id === id ? { ...m, status: 'DRAFT' } : m));

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.total, icon: Users, color: 'var(--primary)', bg: 'var(--primary)' },
          { label: 'Submitted', value: stats.submitted, icon: CheckCircle2, color: 'var(--primary)', bg: 'var(--primary)' },
          { label: 'Verified', value: stats.verified, icon: BadgeCheck, color: 'var(--success)', bg: 'var(--success)' },
          { label: 'Pending (Draft)', value: stats.pending, icon: AlertCircle, color: 'var(--warning)', bg: 'var(--warning)' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-200">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `hsl(${bg} / 0.12)` }}>
              <Icon className="w-5 h-5" style={{ color: `hsl(${color})` }} />
            </div>
            <div>
              <div className="text-2xl font-black" style={{ color: `hsl(${color})` }}>{value}</div>
              <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
          <Filter className="w-4 h-4" />
          <span>{t('auto.filter_by', 'Filter by:')}</span>
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as DeclarationStatus | 'ALL')}
          className="px-3 py-1.5 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            background: 'hsl(var(--secondary))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}>
          <option value="ALL">{t('auto.all_statuses', 'All Statuses')}</option>
          <option value="DRAFT">{t('auto.draft', 'Draft')}</option>
          <option value="SUBMITTED">{t('auto.submitted', 'Submitted')}</option>
          <option value="VERIFIED">{t('auto.verified', 'Verified')}</option>
          <option value="LOCKED">{t('auto.locked', 'Locked')}</option>
        </select>
        <select value={filterRegime} onChange={e => setFilterRegime(e.target.value as TaxRegime | 'ALL')}
          className="px-3 py-1.5 rounded-xl text-sm outline-none cursor-pointer"
          style={{
            background: 'hsl(var(--secondary))',
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}>
          <option value="ALL">{t('auto.all_regimes', 'All Regimes')}</option>
          <option value="OLD_REGIME">{t('auto.old_regime', 'Old Regime')}</option>
          <option value="NEW_REGIME">{t('auto.new_regime', 'New Regime')}</option>
        </select>
        <span className="text-xs ml-auto" style={{ color: 'hsl(var(--muted-foreground))' }}>
          {filtered.length} {t('auto.of', 'of')} {members.length} {t('auto.employees', 'employees')}
        </span>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'hsl(var(--background-3))', borderBottom: '1px solid hsl(var(--border))' }}>
                {['Employee', 'Regime', 'Total Declared', 'Est. Annual Tax', 'Monthly TDS', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'hsl(var(--muted-foreground))' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, i) => (
                <tr key={m.id}
                  className="transition-colors group hover:bg-opacity-50"
                  style={{
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    background: i % 2 === 0 ? 'transparent' : 'hsl(var(--background-3) / 0.3)',
                  }}>
                  {/* Employee */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                        style={{ background: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{m.name}</div>
                        <div className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          {m.code} Â· {m.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  {/* Regime */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: m.regime === 'NEW_REGIME' ? 'hsl(var(--teal) / 0.1)' : 'hsl(var(--accent) / 0.1)',
                        color: m.regime === 'NEW_REGIME' ? 'hsl(var(--teal))' : 'hsl(var(--accent))',
                      }}>
                      {m.regime === 'NEW_REGIME' ? 'New' : 'Old'}
                    </span>
                  </td>
                  {/* Total Declared */}
                  <td className="px-5 py-4 font-mono font-semibold tabular-nums"
                    style={{ color: 'hsl(var(--foreground))' }}>
                    â‚¹{new Intl.NumberFormat('en-IN').format(m.totalDeclared)}
                  </td>
                  {/* Est. Annual Tax */}
                  <td className="px-5 py-4 font-mono font-semibold tabular-nums"
                    style={{ color: 'hsl(var(--foreground))' }}>
                    â‚¹{new Intl.NumberFormat('en-IN').format(m.estimatedAnnualTax)}
                  </td>
                  {/* Monthly TDS */}
                  <td className="px-5 py-4">
                    <span className="font-mono font-bold tabular-nums"
                      style={{ color: 'hsl(var(--primary))' }}>
                      â‚¹{new Intl.NumberFormat('en-IN').format(m.monthlyTds)}
                    </span>
                    <div className="text-xs mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.month', '/month')}</div>
                  </td>
                  {/* Status */}
                  <td className="px-5 py-4">
                    <StatusBadge status={m.status} />
                  </td>
                  {/* Actions */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {m.status === 'SUBMITTED' && (
                        <>
                          <button onClick={() => handleVerify(m.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:scale-105"
                            style={{ background: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))' }}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('auto.verify', 'Verify')}
                          </button>
                          <button onClick={() => handleReject(m.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:scale-105"
                            style={{ background: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))' }}>
                            <XCircle className="w-3.5 h-3.5" />
                            {t('auto.reject', 'Reject')}
                          </button>
                        </>
                      )}
                      {m.status === 'VERIFIED' && (
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.verified', 'Verified âœ“')}</span>
                      )}
                      {m.status === 'LOCKED' && (
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>
                          <Lock className="w-3 h-3 inline mr-1" />{t('auto.locked', 'Locked')}
                        </span>
                      )}
                      {m.status === 'DRAFT' && (
                        <span className="text-xs" style={{ color: 'hsl(var(--muted-foreground))' }}>{t('auto.awaiting_submission', 'Awaiting submission')}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'hsl(var(--muted-foreground))' }} />
            <p className="text-sm font-medium" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {t('auto.no_employees_match_the_selected_filters', 'No employees match the selected filters')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ITDeclarationsPage: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabId>('my');

  const tabs: { id: TabId; label: string; icon: React.FC<{ className?: string }>; subtitle: string }[] = [
    { id: 'my',   label: 'My Declaration', icon: User,  subtitle: 'ESS View' },
    { id: 'team', label: 'Team Declarations', icon: Users, subtitle: 'HR View' },
  ];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ background: 'hsl(var(--background))' }}>
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'hsl(var(--accent) / 0.12)' }}>
              <FileText className="w-6 h-6" style={{ color: 'hsl(var(--accent))' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black gradient-text">{t('auto.it_declarations', 'IT Declarations')}</h1>
              <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>
                {t('auto.manage_income_tax_declarations_and_tds_computation', 'Manage Income Tax declarations and TDS computation for FY 2025-26')}
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div className="mt-5 flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'hsl(var(--primary) / 0.06)', border: '1px solid hsl(var(--primary) / 0.15)' }}>
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--primary))' }} />
            <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--foreground))' }}>
              <strong>{t('auto.declaration_window_is_open', 'Declaration window is open')}</strong> {t('auto.submit_your_it_declarations_by', '— Submit your IT declarations by')} <strong>{t('auto.31st_july_2025', '31st July 2025')}</strong> {t('auto.to_avoid_higher_tds_deductions_declarations_submit', 'to avoid higher TDS deductions. Declarations submitted after the deadline may not reflect in TDS until the next payroll cycle.')}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl mb-8 w-fit"
          style={{ background: 'hsl(var(--secondary))' }}>
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  background: isActive ? 'hsl(var(--card))' : 'transparent',
                  boxShadow: isActive ? '0 1px 4px hsl(var(--foreground) / 0.08)' : 'none',
                  color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                }}>
                <Icon className="w-4 h-4" />
                <div className="text-left">
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-70">{tab.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'my' ? <MyDeclarationTab /> : <TeamDeclarationsTab />}
        </div>
      </div>
    </div>
  );
};

export default ITDeclarationsPage;

