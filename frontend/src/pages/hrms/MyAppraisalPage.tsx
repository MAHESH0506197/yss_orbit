import { useState } from "react";
import { formatIST } from '@/utils/date';
import {
  Star,
  Target,
  MessageSquare,
  History,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  User,
  Calendar,
  TrendingUp,
  Award,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AssessmentStatus = "DRAFT" | "SUBMITTED" | "UNDER_REVIEW" | "ACKNOWLEDGED";

interface Competency {
  id: string;
  name: string;
  description: string;
  selfRating: number;
  comment: string;
}

interface Goal {
  id: string;
  title: string;
  target: string;
  actual: string;
  progress: number;
  weight: number;
  selfRating: number;
  category: string;
}

interface FeedbackItem {
  id: string;
  source: string;
  role: string;
  isAnonymous: boolean;
  strengths: string[];
  improvements: string[];
  date: string;
}

interface HistoryRecord {
  id: string;
  cycle: string;
  type: string;
  finalRating: number;
  managerRating: number;
  selfRating: number;
  outcome: string;
  outcomeType: "PROMOTION" | "HIKE" | "NONE";
  completedDate: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_COMPETENCIES: Competency[] = [
  { id: "c1", name: "Technical Excellence", description: "Quality of technical work, problem-solving, and code/solution standards", selfRating: 4, comment: "Delivered multiple high-impact features this quarter, including the new search module refactor." },
  { id: "c2", name: "Delivery & Ownership", description: "Meeting deadlines, taking accountability, and driving tasks to completion", selfRating: 4, comment: "Completed all sprint commitments with zero carryovers in Q1. Proactively flagged risks early." },
  { id: "c3", name: "Communication", description: "Clarity in written and verbal communication, stakeholder updates, and documentation", selfRating: 3, comment: "Improved documentation practices. Still working on concise status updates in standup." },
  { id: "c4", name: "Collaboration", description: "Cross-team cooperation, knowledge sharing, and support of team members", selfRating: 5, comment: "Mentored two junior engineers and drove two cross-team alignment sessions this quarter." },
  { id: "c5", name: "Innovation", description: "Proactively identifying improvements, experimenting, and bringing new ideas", selfRating: 3, comment: "Proposed the caching layer optimization. Could push more ideas to the innovation board." },
];

const INITIAL_GOALS: Goal[] = [
  { id: "g1", title: "Ship Search Module v2.0", target: "Launch by May 15, 2026", actual: "Launched May 12, 2026", progress: 100, weight: 25, selfRating: 5, category: "Delivery" },
  { id: "g2", title: "Reduce API Error Rate", target: "< 0.5% error rate", actual: "Achieved 0.3% by June", progress: 100, weight: 20, selfRating: 5, category: "Quality" },
  { id: "g3", title: "Complete AWS Solutions Architect", target: "Certification by Jun 30", actual: "In progress – exam booked Jun 28", progress: 80, weight: 20, selfRating: 4, category: "Learning" },
  { id: "g4", title: "Mentor 2 Junior Engineers", target: "Weekly 1:1 sessions, 12 weeks", actual: "Completed 10/12 sessions each", progress: 85, weight: 20, selfRating: 4, category: "Leadership" },
  { id: "g5", title: "Improve Sprint Velocity", target: "+15% story points vs Q4 FY26", actual: "+12% achieved so far", progress: 78, weight: 15, selfRating: 3, category: "Performance" },
];

const MOCK_FEEDBACK: FeedbackItem[] = [
  {
    id: "f1", source: "Peer A", role: "Senior Software Engineer", isAnonymous: true,
    strengths: ["Exceptional technical depth — always brings well-thought-out solutions", "Very reliable — never drops the ball on commitments", "Excellent mentor, patient and thorough with explanations"],
    improvements: ["Could communicate blockers earlier rather than trying to resolve solo", "Standup updates can be more concise"],
    date: "2026-06-05",
  },
  {
    id: "f2", source: "Peer B", role: "Product Manager", isAnonymous: true,
    strengths: ["Great at translating technical constraints to non-technical stakeholders", "Always available for cross-team support"],
    improvements: ["Documentation can sometimes lag behind — would benefit from inline docs as code is written"],
    date: "2026-06-06",
  },
  {
    id: "f3", source: "Peer C", role: "QA Engineer", isAnonymous: true,
    strengths: ["Thorough in reviewing test scenarios before release", "Writes testable code with clear boundaries"],
    improvements: ["Occasionally underestimates testing cycles in sprint planning"],
    date: "2026-06-07",
  },
  {
    id: "f4", source: "Rajesh Kumar", role: "Engineering Manager (Direct Manager)", isAnonymous: false,
    strengths: ["Consistently one of the top performers in the team", "Outstanding ownership of the search module end-to-end", "Shows strong leadership instincts — natural team anchor"],
    improvements: ["Should push for more visibility in cross-org forums", "Innovation contribution can be more structured — formalise ideas with RFCs"],
    date: "2026-06-08",
  },
];

const MOCK_HISTORY: HistoryRecord[] = [
  { id: "h1", cycle: "FY 2025-26 Annual", type: "ANNUAL", finalRating: 4.2, managerRating: 4.3, selfRating: 4.0, outcome: "Merit Hike 12%", outcomeType: "HIKE", completedDate: "2026-04-20" },
  { id: "h2", cycle: "FY 2025-26 Q3", type: "QUARTERLY", finalRating: 4.0, managerRating: 4.0, selfRating: 3.8, outcome: "Spot Bonus ₹15,000", outcomeType: "HIKE", completedDate: "2026-01-18" },
  { id: "h3", cycle: "FY 2025-26 Q1", type: "QUARTERLY", finalRating: 3.8, managerRating: 3.8, selfRating: 4.0, outcome: "—", outcomeType: "NONE", completedDate: "2025-07-12" },
  { id: "h4", cycle: "FY 2024-25 Annual", type: "ANNUAL", finalRating: 3.5, managerRating: 3.5, selfRating: 3.5, outcome: "Merit Hike 8% + Promotion to SSE", outcomeType: "PROMOTION", completedDate: "2025-04-15" },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 18 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          disabled={!onChange}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            size={size}
            className={`transition-colors ${(hovered || value) >= star ? "text-amber-400 fill-amber-400" : "text-[hsl(var(--muted-foreground))]"}`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: AssessmentStatus }) {
  const cfg: Record<AssessmentStatus, { label: string; cls: string; icon: React.ElementType }> = {
    DRAFT: { label: "Draft", cls: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]", icon: AlertCircle },
    SUBMITTED: { label: "Submitted", cls: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]", icon: CheckCircle2 },
    UNDER_REVIEW: { label: "Under Review", cls: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]", icon: AlertCircle },
    ACKNOWLEDGED: { label: "Acknowledged", cls: "bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]", icon: CheckCircle2 },
  };
  const c = cfg[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.cls}`}>
      <Icon size={11} /> {c.label}
    </span>
  );
}

// ─── Tab Pill ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: "self", label: "Self Assessment", icon: ClipboardList },
  { id: "goals", label: "Goals", icon: Target },
  { id: "feedback", label: "Feedback", icon: MessageSquare },
  { id: "history", label: "History", icon: History },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Self Assessment Tab ──────────────────────────────────────────────────────
function SelfAssessmentTab({ status, setStatus }: { status: AssessmentStatus; setStatus: (s: AssessmentStatus) => void }) {
  const [competencies, setCompetencies] = useState<Competency[]>(INITIAL_COMPETENCIES);
  const [overallRating, setOverallRating] = useState(4);
  const [error, setError] = useState("");

  const updateRating = (id: string, val: number) => setCompetencies(prev => prev.map(c => c.id === id ? { ...c, selfRating: val } : c));
  const updateComment = (id: string, val: string) => setCompetencies(prev => prev.map(c => c.id === id ? { ...c, comment: val } : c));

  const handleSubmit = () => {
    const unrated = competencies.filter(c => c.selfRating === 0);
    if (unrated.length > 0) { setError(`Please rate all competencies before submitting.`); return; }
    setError("");
    setStatus("SUBMITTED");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">Rate yourself on each competency</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Be honest — self-ratings are one input in the overall review process.</p>
        </div>
        <StatusPill status={status} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)] px-4 py-3 text-sm text-[hsl(var(--destructive))]">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {competencies.map(comp => (
        <div key={comp.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">{comp.name}</h4>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{comp.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StarRating value={comp.selfRating} onChange={v => updateRating(comp.id, v)} />
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {comp.selfRating === 0 ? "Not rated" : ["", "Needs Improvement", "Developing", "Meets Expectations", "Exceeds", "Exceptional"][comp.selfRating]}
              </span>
            </div>
          </div>
          <textarea
            value={comp.comment}
            onChange={e => updateComment(comp.id, e.target.value)}
            placeholder="Add supporting comments or evidence..."
            rows={2}
            className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)] resize-none"
          />
        </div>
      ))}

      {/* Overall Self Rating */}
      <div className="rounded-2xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.04)] p-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">Overall Self Rating</h4>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">Your holistic assessment of your performance this cycle</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StarRating value={overallRating} onChange={setOverallRating} size={22} />
            <span className="text-xs font-medium text-[hsl(var(--primary))]">
              {["", "Needs Improvement", "Developing", "Meets Expectations", "Exceeds Expectations", "Exceptional"][overallRating]}
            </span>
          </div>
        </div>
      </div>

      {status !== "SUBMITTED" && status !== "ACKNOWLEDGED" && (
        <div className="flex gap-3">
          <button onClick={() => setStatus("DRAFT")} className="flex-1 rounded-xl border border-[hsl(var(--border))] py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
            Save Draft
          </button>
          <button onClick={handleSubmit} className="flex-1 rounded-xl bg-[hsl(var(--primary))] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
            <CheckCircle2 size={15} /> Submit Self Assessment
          </button>
        </div>
      )}
      {(status === "SUBMITTED" || status === "ACKNOWLEDGED") && (
        <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.3)] px-4 py-3 text-sm text-[hsl(var(--success))]">
          <CheckCircle2 size={15} /> Your self-assessment has been submitted and is pending manager review.
        </div>
      )}
    </div>
  );
}

// ─── Goals Tab ────────────────────────────────────────────────────────────────
function GoalsTab() {
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);
  const totalWeight = goals.reduce((s, g) => s + g.weight, 0);

  const updateGoalRating = (id: string, val: number) => setGoals(prev => prev.map(g => g.id === id ? { ...g, selfRating: val } : g));

  const categoryColors: Record<string, string> = {
    Delivery: "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]",
    Quality: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
    Learning: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    Leadership: "bg-[hsl(var(--teal)/0.12)] text-[hsl(var(--teal))]",
    Performance: "bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-medium text-[hsl(var(--foreground))]">My Goals — FY 2026-27 Q1</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Total weight: <span className={totalWeight === 100 ? "text-[hsl(var(--success))] font-semibold" : "text-[hsl(var(--destructive))] font-semibold"}>{totalWeight}%</span> {totalWeight !== 100 && "(must equal 100%)"}</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
          <Plus size={13} /> Add Goal
        </button>
      </div>

      {goals.map(goal => (
        <div key={goal.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColors[goal.category] ?? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"}`}>
                  {goal.category}
                </span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium">Weight: {goal.weight}%</span>
              </div>
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))]">{goal.title}</h4>
            </div>
            <StarRating value={goal.selfRating} onChange={v => updateGoalRating(goal.id, v)} />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
            <div className="rounded-lg bg-[hsl(var(--muted)/0.5)] p-2.5">
              <p className="text-[hsl(var(--muted-foreground))] font-medium mb-0.5">🎯 Target</p>
              <p className="text-[hsl(var(--foreground))]">{goal.target}</p>
            </div>
            <div className="rounded-lg bg-[hsl(var(--muted)/0.5)] p-2.5">
              <p className="text-[hsl(var(--muted-foreground))] font-medium mb-0.5">✅ Actual</p>
              <p className="text-[hsl(var(--foreground))]">{goal.actual}</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[11px] text-[hsl(var(--muted-foreground))] mb-1">
              <span>Progress</span>
              <span>{goal.progress}%</span>
            </div>
            <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${goal.progress}%`,
                  backgroundColor: goal.progress >= 100 ? "hsl(var(--success))" : goal.progress >= 70 ? "hsl(var(--teal))" : "hsl(var(--warning))",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Feedback Tab ─────────────────────────────────────────────────────────────
function FeedbackTab() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-[hsl(var(--foreground))]">360° Feedback Received</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">Peer feedback is anonymised. Manager feedback is attributed.</p>
      </div>

      {MOCK_FEEDBACK.map(fb => (
        <div key={fb.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white ${fb.isAnonymous ? "bg-[hsl(var(--muted-foreground))]" : "bg-[hsl(var(--primary))]"}`}>
              {fb.isAnonymous ? "?" : fb.source.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{fb.source}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{fb.role}</p>
            </div>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">{formatIST(new Date(fb.date), 'PPP')}</span>
          </div>

          <div className="space-y-3">
            <div className="rounded-xl bg-[hsl(var(--success)/0.08)] border border-[hsl(var(--success)/0.2)] p-3">
              <p className="text-[11px] font-semibold text-[hsl(var(--success))] uppercase tracking-wide mb-2">💪 Strengths</p>
              <ul className="space-y-1">
                {fb.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[hsl(var(--foreground))]">
                    <ChevronRight size={12} className="mt-0.5 shrink-0 text-[hsl(var(--success))]" />{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.2)] p-3">
              <p className="text-[11px] font-semibold text-[hsl(var(--warning))] uppercase tracking-wide mb-2">🔧 Areas for Improvement</p>
              <ul className="space-y-1">
                {fb.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[hsl(var(--foreground))]">
                    <ChevronRight size={12} className="mt-0.5 shrink-0 text-[hsl(var(--warning))]" />{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab() {
  const outcomeStyle: Record<string, string> = {
    PROMOTION: "bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]",
    HIKE: "bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]",
    NONE: "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-[hsl(var(--foreground))]">Appraisal History</p>
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.5)]">
                {["Cycle", "Type", "Self Rating", "Manager Rating", "Final Rating", "Outcome", "Completed"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map((rec, idx) => (
                <tr key={rec.id} className={`border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors ${idx === MOCK_HISTORY.length - 1 ? "border-0" : ""}`}>
                  <td className="px-4 py-3 font-medium text-[hsl(var(--foreground))] whitespace-nowrap">{rec.cycle}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[hsl(var(--muted))] px-2 py-0.5 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">{rec.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="font-medium text-[hsl(var(--foreground))]">{rec.selfRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="font-medium text-[hsl(var(--foreground))]">{rec.managerRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="font-bold text-[hsl(var(--foreground))]">{rec.finalRating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${outcomeStyle[rec.outcomeType]}`}>
                      {rec.outcomeType === "PROMOTION" && <Award size={10} />}
                      {rec.outcomeType === "HIKE" && <TrendingUp size={10} />}
                      {rec.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                    {formatIST(new Date(rec.completedDate), 'PPP')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MyAppraisalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("self");
  const [status, setStatus] = useState<AssessmentStatus>("DRAFT");

  const daysLeft = Math.ceil((new Date("2026-06-30").getTime() - Date.now()) / 86400000);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
            <User size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">My Appraisal</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Self-service performance review</p>
          </div>
        </div>
        <StatusPill status={status} />
      </div>

      {/* Cycle Banner */}
      <div className="mb-6 rounded-2xl border border-[hsl(var(--primary)/0.2)] bg-gradient-to-r from-[hsl(var(--primary)/0.06)] to-[hsl(var(--teal)/0.06)] p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">Current Cycle</p>
            <h2 className="text-lg font-bold text-[hsl(var(--foreground))] mt-0.5">FY 2026-27 Q1 — Quarterly Appraisal</h2>
            <div className="flex items-center gap-4 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              <span className="flex items-center gap-1"><Calendar size={12} /> Apr 1 – Jun 30, 2026</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Deadline: Jun 30, 2026</span>
            </div>
          </div>
          <div className={`text-center rounded-2xl px-5 py-3 ${daysLeft <= 5 ? "bg-[hsl(var(--destructive)/0.1)] border border-[hsl(var(--destructive)/0.3)]" : "bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)]"}`}>
            <p className={`text-3xl font-bold ${daysLeft <= 5 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--warning))]"}`}>{daysLeft}</p>
            <p className={`text-xs font-medium ${daysLeft <= 5 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--warning))]"}`}>days left</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap mb-6 bg-[hsl(var(--muted)/0.5)] rounded-2xl p-1.5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 ${
                activeTab === tab.id
                  ? "bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "self" && <SelfAssessmentTab status={status} setStatus={setStatus} />}
        {activeTab === "goals" && <GoalsTab />}
        {activeTab === "feedback" && <FeedbackTab />}
        {activeTab === "history" && <HistoryTab />}
      </div>
    </div>
  );
}

export default MyAppraisalPage;
