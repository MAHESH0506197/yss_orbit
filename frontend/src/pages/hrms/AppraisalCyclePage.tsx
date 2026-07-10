import { useState } from "react";
import { formatIST } from '@/utils/date';
import {
  Settings,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type CycleStatus = "DRAFT" | "PLANNING" | "ACTIVE" | "CALIBRATION" | "CLOSED";
type CycleType = "QUARTERLY" | "ANNUAL" | "PROBATION" | "CONFIRMATION";

interface RatingDist {
  label: string;
  count: number;
  color: string;
}

interface AppraisalCycle {
  id: string;
  name: string;
  type: CycleType;
  status: CycleStatus;
  fromDate: string;
  toDate: string;
  deadline: string;
  totalEmployees: number;
  submitted: number;
  reviewed: number;
  calibrated: number;
  description: string;
  ratingDist: RatingDist[];
  pendingDepts: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_CYCLES: AppraisalCycle[] = [
  {
    id: "cy-001",
    name: "FY 2026-27 Q1",
    type: "QUARTERLY",
    status: "ACTIVE",
    fromDate: "2026-04-01",
    toDate: "2026-06-30",
    deadline: "2026-07-15",
    totalEmployees: 142,
    submitted: 98,
    reviewed: 61,
    calibrated: 34,
    description: "First quarter appraisal for FY 2026-27. Covers April to June 2026.",
    ratingDist: [
      { label: "Exceptional", count: 12, color: "hsl(var(--success))" },
      { label: "Exceeds", count: 27, color: "hsl(var(--teal))" },
      { label: "Meets", count: 49, color: "hsl(142 76% 48%)" },
      { label: "Below", count: 6, color: "hsl(var(--warning))" },
      { label: "PIP", count: 4, color: "hsl(var(--destructive))" },
    ],
    pendingDepts: ["Engineering – Backend", "Finance & Accounts", "Sales – South", "HR Operations"],
  },
  {
    id: "cy-002",
    name: "FY 2025-26 Annual",
    type: "ANNUAL",
    status: "CLOSED",
    fromDate: "2025-04-01",
    toDate: "2026-03-31",
    deadline: "2026-04-30",
    totalEmployees: 138,
    submitted: 138,
    reviewed: 138,
    calibrated: 138,
    description: "Full-year annual performance appraisal for FY 2025-26.",
    ratingDist: [
      { label: "Exceptional", count: 14, color: "hsl(var(--success))" },
      { label: "Exceeds", count: 31, color: "hsl(var(--teal))" },
      { label: "Meets", count: 79, color: "hsl(142 76% 48%)" },
      { label: "Below", count: 9, color: "hsl(var(--warning))" },
      { label: "PIP", count: 5, color: "hsl(var(--destructive))" },
    ],
    pendingDepts: [],
  },
  {
    id: "cy-003",
    name: "FY 2025-26 Q3",
    type: "QUARTERLY",
    status: "CLOSED",
    fromDate: "2025-10-01",
    toDate: "2025-12-31",
    deadline: "2026-01-20",
    totalEmployees: 134,
    submitted: 134,
    reviewed: 134,
    calibrated: 134,
    description: "Third quarter appraisal for FY 2025-26. Covers October to December 2025.",
    ratingDist: [
      { label: "Exceptional", count: 11, color: "hsl(var(--success))" },
      { label: "Exceeds", count: 25, color: "hsl(var(--teal))" },
      { label: "Meets", count: 82, color: "hsl(142 76% 48%)" },
      { label: "Below", count: 10, color: "hsl(var(--warning))" },
      { label: "PIP", count: 6, color: "hsl(var(--destructive))" },
    ],
    pendingDepts: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusConfig: Record<CycleStatus, { label: string; style: string }> = {
  DRAFT: { label: "Draft", style: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]" },
  PLANNING: { label: "Planning", style: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  ACTIVE: { label: "Active", style: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]" },
  CALIBRATION: { label: "Calibration", style: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]" },
  CLOSED: { label: "Closed", style: "bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]" },
};

const typeConfig: Record<CycleType, string> = {
  QUARTERLY: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  ANNUAL: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  PROBATION: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  CONFIRMATION: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
};

function fmt(d: string) {
  return formatIST(new Date(d), 'PPP');
}

function pct(a: number, b: number) {
  return b === 0 ? 0 : Math.round((a / b) * 100);
}

// ─── Star Rating Component ────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{label}</p>
          <p className="mt-1.5 text-3xl font-bold text-[hsl(var(--foreground))]">{value}</p>
          {sub && <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

// ─── Create Cycle Modal ───────────────────────────────────────────────────────
function CreateCycleModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", type: "QUARTERLY" as CycleType, from: "", to: "", description: "" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Create Appraisal Cycle</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-[hsl(var(--muted))] transition-colors"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Cycle Name</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. FY 2026-27 Q2"
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Cycle Type</label>
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value as CycleType }))}
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)]"
            >
              {(["QUARTERLY", "ANNUAL", "PROBATION", "CONFIRMATION"] as CycleType[]).map(t => (
                <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Review From</label>
              <input type="date" value={form.from} onChange={e => setForm(p => ({ ...p, from: e.target.value }))}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Review To</label>
              <input type="date" value={form.to} onChange={e => setForm(p => ({ ...p, to: e.target.value }))}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="Brief description of this appraisal cycle..."
              className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)] resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
          <button onClick={onClose} className="flex-1 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity">Create as Draft</button>
        </div>
      </div>
    </div>
  );
}

// ─── Cycle Card ───────────────────────────────────────────────────────────────
function CycleCard({ cycle }: { cycle: AppraisalCycle }) {
  const [expanded, setExpanded] = useState(false);
  const subPct = pct(cycle.submitted, cycle.totalEmployees);
  const revPct = pct(cycle.reviewed, cycle.totalEmployees);
  const calPct = pct(cycle.calibrated, cycle.totalEmployees);
  const maxDist = Math.max(...cycle.ratingDist.map(r => r.count), 1);

  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${typeConfig[cycle.type]}`}>
                {cycle.type}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${statusConfig[cycle.status].style}`}>
                {statusConfig[cycle.status].label}
              </span>
            </div>
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))] truncate">{cycle.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              <Calendar size={12} />
              <span>{fmt(cycle.fromDate)} – {fmt(cycle.toDate)}</span>
              <span className="mx-1">·</span>
              <span>Deadline {fmt(cycle.deadline)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{subPct}%</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">completion</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Submitted", val: cycle.submitted, total: cycle.totalEmployees, pct: subPct, color: "hsl(var(--success))" },
            { label: "Reviewed", val: cycle.reviewed, total: cycle.totalEmployees, pct: revPct, color: "hsl(var(--teal))" },
            { label: "Calibrated", val: cycle.calibrated, total: cycle.totalEmployees, pct: calPct, color: "hsl(var(--primary))" },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-[hsl(var(--muted)/0.4)] p-3">
              <p className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-bold text-[hsl(var(--foreground))] mt-0.5">{s.val}<span className="text-xs font-normal text-[hsl(var(--muted-foreground))]">/{s.total}</span></p>
              <div className="mt-1.5 h-1.5 rounded-full bg-[hsl(var(--muted))]">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-[hsl(var(--muted-foreground))] mb-1">
            <span>Overall Submission Progress</span>
            <span>{cycle.submitted} / {cycle.totalEmployees} employees</span>
          </div>
          <div className="h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${subPct}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--teal)))" }}
            />
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[hsl(var(--border))] py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] transition-colors"
        >
          {expanded ? <><ChevronUp size={14} /> Hide Details</> : <><ChevronDown size={14} /> View Details</>}
        </button>
      </div>

      {/* Expanded Detail */}
      {expanded && (
        <div className="border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-5 space-y-5">
          {/* Rating Distribution */}
          <div>
            <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <BarChart3 size={13} /> Rating Distribution
            </h4>
            <div className="space-y-2.5">
              {cycle.ratingDist.map(r => (
                <div key={r.label} className="flex items-center gap-3">
                  <span className="w-24 text-xs text-[hsl(var(--foreground))] font-medium">{r.label}</span>
                  <div className="flex-1 h-5 rounded-md bg-[hsl(var(--muted))] overflow-hidden">
                    <div
                      className="h-full rounded-md flex items-center pl-2 text-[10px] font-semibold text-white transition-all duration-700"
                      style={{ width: `${Math.max(pct(r.count, maxDist), 8)}%`, backgroundColor: r.color }}
                    >
                      {r.count}
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs font-medium text-[hsl(var(--foreground))]">{r.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Departments */}
          {cycle.pendingDepts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle size={13} /> Departments Pending Submission
              </h4>
              <div className="flex flex-wrap gap-2">
                {cycle.pendingDepts.map(dept => (
                  <span key={dept} className="inline-flex items-center gap-1 rounded-lg bg-[hsl(var(--warning)/0.12)] border border-[hsl(var(--warning)/0.3)] px-3 py-1 text-xs font-medium text-[hsl(var(--warning))]">
                    <AlertTriangle size={10} /> {dept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cycle.pendingDepts.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-[hsl(var(--success))]">
              <CheckCircle2 size={14} />
              <span className="font-medium">All departments have submitted — cycle complete.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function AppraisalCyclePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<CycleStatus | "ALL">("ALL");

  const activeCycle = MOCK_CYCLES.find(c => c.status === "ACTIVE");
  const totalEmployees = activeCycle?.totalEmployees ?? 0;
  const submittedCount = activeCycle?.submitted ?? 0;
  const completionPct = activeCycle ? pct(submittedCount, totalEmployees) : 0;
  const pendingCalibrations = activeCycle ? activeCycle.totalEmployees - activeCycle.calibrated : 0;

  const filtered = filter === "ALL" ? MOCK_CYCLES : MOCK_CYCLES.filter(c => c.status === filter);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
            <Settings size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Appraisal Cycles</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage performance review cycles and calibration</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> New Cycle
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={RefreshCw} label="Active Cycles" value={MOCK_CYCLES.filter(c => c.status === "ACTIVE").length} sub="Currently running" color="bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]" />
        <KpiCard icon={Users} label="Under Review" value={totalEmployees} sub={`FY 2026-27 Q1`} color="bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]" />
        <KpiCard icon={TrendingUp} label="Completion %" value={`${completionPct}%`} sub={`${submittedCount} of ${totalEmployees} submitted`} color="bg-[hsl(var(--teal)/0.12)] text-[hsl(var(--teal))]" />
        <KpiCard icon={Clock} label="Pending Calibrations" value={pendingCalibrations} sub="Active cycle" color="bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]" />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(["ALL", "ACTIVE", "CALIBRATION", "PLANNING", "DRAFT", "CLOSED"] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
              filter === s
                ? "bg-[hsl(var(--primary))] text-white shadow-sm"
                : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))]"
            }`}
          >
            {s === "ALL" ? "All Cycles" : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Cycle Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(cycle => (
          <CycleCard key={cycle.id} cycle={cycle} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-[hsl(var(--muted-foreground))]">
            <BarChart3 size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No cycles match this filter</p>
          </div>
        )}
      </div>

      {showCreate && <CreateCycleModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export default AppraisalCyclePage;
