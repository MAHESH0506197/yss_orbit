import { useState } from "react";
import { formatIST } from '@/utils/date';
import {
  Users,
  Star,
  ClipboardList,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Save,
  Send,
  Info,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AssessmentStatus = "SUBMITTED" | "DRAFT" | "NOT_STARTED";
type RatingLabel = "Exceptional" | "Exceeds" | "Meets" | "Below" | "PIP";

interface CompetencyRating {
  name: string;
  selfRating: number;
  managerRating: number;
  managerComment: string;
}

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  designation: string;
  department: string;
  avatarColor: string;
  selfStatus: AssessmentStatus;
  deadline: string;
  isOverdue: boolean;
  competencies: CompetencyRating[];
  overallSelfRating: number;
  overallManagerRating: number;
  proposedRating: RatingLabel;
  managerSubmitted: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TEAM: TeamMember[] = [
  {
    id: "tm1", name: "Ananya Sharma", initials: "AS", designation: "Senior Software Engineer", department: "Engineering",
    avatarColor: "bg-purple-500", selfStatus: "SUBMITTED", deadline: "2026-06-30", isOverdue: false,
    competencies: [
      { name: "Technical Excellence", selfRating: 4, managerRating: 4, managerComment: "Consistently delivers high-quality code." },
      { name: "Delivery & Ownership", selfRating: 4, managerRating: 5, managerComment: "Exemplary ownership — proactively resolves blockers." },
      { name: "Communication", selfRating: 3, managerRating: 3, managerComment: "Clear in written comms; verbal updates need more conciseness." },
      { name: "Collaboration", selfRating: 5, managerRating: 5, managerComment: "Outstanding team player — key anchor for the team." },
      { name: "Innovation", selfRating: 3, managerRating: 4, managerComment: "Proposed two impactful optimizations this quarter." },
    ],
    overallSelfRating: 4, overallManagerRating: 4, proposedRating: "Exceeds", managerSubmitted: false,
  },
  {
    id: "tm2", name: "Rohan Mehta", initials: "RM", designation: "Software Engineer", department: "Engineering",
    avatarColor: "bg-blue-500", selfStatus: "SUBMITTED", deadline: "2026-06-30", isOverdue: false,
    competencies: [
      { name: "Technical Excellence", selfRating: 3, managerRating: 3, managerComment: "Good fundamentals; improving with mentorship." },
      { name: "Delivery & Ownership", selfRating: 3, managerRating: 3, managerComment: "Meets commitments; occasional slippage on estimates." },
      { name: "Communication", selfRating: 4, managerRating: 4, managerComment: "Well-structured updates, keeps stakeholders informed." },
      { name: "Collaboration", selfRating: 4, managerRating: 4, managerComment: "Good team spirit, participates in reviews actively." },
      { name: "Innovation", selfRating: 2, managerRating: 2, managerComment: "Should invest more in proposing improvements." },
    ],
    overallSelfRating: 3, overallManagerRating: 3, proposedRating: "Meets", managerSubmitted: false,
  },
  {
    id: "tm3", name: "Priya Nair", initials: "PN", designation: "Lead Engineer", department: "Engineering",
    avatarColor: "bg-emerald-500", selfStatus: "SUBMITTED", deadline: "2026-06-30", isOverdue: false,
    competencies: [
      { name: "Technical Excellence", selfRating: 5, managerRating: 5, managerComment: "Exceptional architecture decisions — industry-leading quality." },
      { name: "Delivery & Ownership", selfRating: 5, managerRating: 5, managerComment: "Delivered the biggest initiative of the quarter flawlessly." },
      { name: "Communication", selfRating: 4, managerRating: 4, managerComment: "Excellent presenter; represents team well in leadership forums." },
      { name: "Collaboration", selfRating: 4, managerRating: 5, managerComment: "Cross-org collaboration champion — drove 3 alignment sessions." },
      { name: "Innovation", selfRating: 5, managerRating: 5, managerComment: "Led the AI-assisted PR review pilot — outstanding initiative." },
    ],
    overallSelfRating: 5, overallManagerRating: 5, proposedRating: "Exceptional", managerSubmitted: true,
  },
  {
    id: "tm4", name: "Karthik Rajan", initials: "KR", designation: "Software Engineer", department: "Engineering",
    avatarColor: "bg-orange-500", selfStatus: "DRAFT", deadline: "2026-06-30", isOverdue: false,
    competencies: [
      { name: "Technical Excellence", selfRating: 3, managerRating: 3, managerComment: "" },
      { name: "Delivery & Ownership", selfRating: 2, managerRating: 3, managerComment: "" },
      { name: "Communication", selfRating: 3, managerRating: 3, managerComment: "" },
      { name: "Collaboration", selfRating: 3, managerRating: 3, managerComment: "" },
      { name: "Innovation", selfRating: 2, managerRating: 2, managerComment: "" },
    ],
    overallSelfRating: 3, overallManagerRating: 3, proposedRating: "Meets", managerSubmitted: false,
  },
  {
    id: "tm5", name: "Sneha Patel", initials: "SP", designation: "Junior Software Engineer", department: "Engineering",
    avatarColor: "bg-pink-500", selfStatus: "NOT_STARTED", deadline: "2026-06-30", isOverdue: false,
    competencies: [
      { name: "Technical Excellence", selfRating: 0, managerRating: 3, managerComment: "" },
      { name: "Delivery & Ownership", selfRating: 0, managerRating: 3, managerComment: "" },
      { name: "Communication", selfRating: 0, managerRating: 3, managerComment: "" },
      { name: "Collaboration", selfRating: 0, managerRating: 4, managerComment: "" },
      { name: "Innovation", selfRating: 0, managerRating: 2, managerComment: "" },
    ],
    overallSelfRating: 0, overallManagerRating: 3, proposedRating: "Meets", managerSubmitted: false,
  },
  {
    id: "tm6", name: "Vijay Krishnan", initials: "VK", designation: "Software Engineer II", department: "Engineering",
    avatarColor: "bg-teal-500", selfStatus: "NOT_STARTED", deadline: "2026-06-24", isOverdue: true,
    competencies: [
      { name: "Technical Excellence", selfRating: 0, managerRating: 2, managerComment: "" },
      { name: "Delivery & Ownership", selfRating: 0, managerRating: 2, managerComment: "" },
      { name: "Communication", selfRating: 0, managerRating: 2, managerComment: "" },
      { name: "Collaboration", selfRating: 0, managerRating: 2, managerComment: "" },
      { name: "Innovation", selfRating: 0, managerRating: 1, managerComment: "" },
    ],
    overallSelfRating: 0, overallManagerRating: 2, proposedRating: "Below", managerSubmitted: false,
  },
];

const CALIBRATION_TARGETS: { label: RatingLabel; target: number; color: string; bgColor: string }[] = [
  { label: "Exceptional", target: 10, color: "hsl(var(--success))", bgColor: "hsl(var(--success)/0.12)" },
  { label: "Exceeds", target: 20, color: "hsl(var(--teal))", bgColor: "hsl(var(--teal)/0.12)" },
  { label: "Meets", target: 60, color: "hsl(142 76% 48%)", bgColor: "hsl(142 76% 48% / 0.12)" },
  { label: "Below", target: 5, color: "hsl(var(--warning))", bgColor: "hsl(var(--warning)/0.12)" },
  { label: "PIP", target: 5, color: "hsl(var(--destructive))", bgColor: "hsl(var(--destructive)/0.12)" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 16 }: { value: number; onChange?: (v: number) => void; size?: number }) {
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

const selfStatusConfig: Record<AssessmentStatus, { label: string; cls: string }> = {
  SUBMITTED: { label: "Submitted", cls: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]" },
  DRAFT: { label: "Draft", cls: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))]" },
  NOT_STARTED: { label: "Not Started", cls: "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))]" },
};

// ─── Team Overview Tab ────────────────────────────────────────────────────────
function TeamOverviewTab({ team }: { team: TeamMember[] }) {
  const submitted = team.filter(m => m.selfStatus === "SUBMITTED").length;
  const pending = team.filter(m => m.selfStatus !== "SUBMITTED").length;
  const notStarted = team.filter(m => m.selfStatus === "NOT_STARTED").length;
  const overdue = team.filter(m => m.isOverdue).length;

  return (
    <div className="space-y-5">
      {/* Summary Banner */}
      {notStarted > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] px-4 py-3.5">
          <AlertTriangle size={18} className="text-[hsl(var(--warning))] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[hsl(var(--warning))]">{notStarted} team member{notStarted > 1 ? "s have" : " has"} not started their self-assessment</p>
            <p className="text-xs text-[hsl(var(--warning)/0.8)] mt-0.5">Consider sending a reminder. Deadline is June 30, 2026.</p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Reports", val: team.length, color: "text-[hsl(var(--foreground))]", bg: "bg-[hsl(var(--muted)/0.5)]" },
          { label: "Submitted", val: submitted, color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/0.08)]" },
          { label: "Pending", val: pending, color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.08)]" },
          { label: "Overdue", val: overdue, color: "text-[hsl(var(--destructive))]", bg: "bg-[hsl(var(--destructive)/0.08)]" },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl ${s.bg} border border-[hsl(var(--border))] p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {team.map(member => (
          <div key={member.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
            <div className="flex items-start gap-3 mb-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${member.avatarColor}`}>
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{member.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{member.designation}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${selfStatusConfig[member.selfStatus].cls}`}>
                {selfStatusConfig[member.selfStatus].label}
              </span>
              {member.isOverdue && (
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]">
                  <AlertTriangle size={9} /> Overdue
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
              <span>Deadline: {formatIST(new Date(member.deadline), 'PPP')}</span>
              {member.managerSubmitted && (
                <span className="flex items-center gap-1 text-[hsl(var(--success))]">
                  <CheckCircle2 size={11} /> Rated
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rate Team Tab ────────────────────────────────────────────────────────────
function RateTeamTab({ team, setTeam }: { team: TeamMember[]; setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>> }) {
  const [expandedId, setExpandedId] = useState<string | null>("tm1");

  const updateManagerRating = (memberId: string, compName: string, val: number) => {
    setTeam(prev => prev.map(m => m.id !== memberId ? m : {
      ...m,
      competencies: m.competencies.map(c => c.name === compName ? { ...c, managerRating: val } : c),
    }));
  };

  const updateManagerComment = (memberId: string, compName: string, val: string) => {
    setTeam(prev => prev.map(m => m.id !== memberId ? m : {
      ...m,
      competencies: m.competencies.map(c => c.name === compName ? { ...c, managerComment: val } : c),
    }));
  };

  const updateOverallRating = (memberId: string, val: number) => {
    setTeam(prev => prev.map(m => m.id !== memberId ? m : { ...m, overallManagerRating: val }));
  };

  const submitMember = (memberId: string) => {
    setTeam(prev => prev.map(m => m.id !== memberId ? m : { ...m, managerSubmitted: true }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl bg-[hsl(var(--muted)/0.5)] px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))]">
        <Info size={13} /> Rating differences &gt;1 between self and manager are highlighted in amber. Review and add comments.
      </div>

      {team.map(member => {
        const isOpen = expandedId === member.id;
        return (
          <div key={member.id} className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden shadow-sm">
            {/* Collapsed Header */}
            <button
              onClick={() => setExpandedId(isOpen ? null : member.id)}
              className="w-full flex items-center gap-3 p-4 hover:bg-[hsl(var(--muted)/0.3)] transition-colors text-left"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${member.avatarColor}`}>
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{member.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{member.designation}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${selfStatusConfig[member.selfStatus].cls}`}>
                  Self: {selfStatusConfig[member.selfStatus].label}
                </span>
                {member.managerSubmitted && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]">
                    <CheckCircle2 size={10} /> Submitted
                  </span>
                )}
                {isOpen ? <ChevronUp size={16} className="text-[hsl(var(--muted-foreground))]" /> : <ChevronDown size={16} className="text-[hsl(var(--muted-foreground))]" />}
              </div>
            </button>

            {/* Expanded Content */}
            {isOpen && (
              <div className="border-t border-[hsl(var(--border))] p-5 space-y-4 bg-[hsl(var(--muted)/0.15)]">
                {member.competencies.map(comp => {
                  const gap = Math.abs(comp.selfRating - comp.managerRating);
                  const isGap = gap > 1;
                  return (
                    <div key={comp.name} className={`rounded-xl border p-4 transition-colors ${isGap ? "border-[hsl(var(--warning)/0.5)] bg-[hsl(var(--warning)/0.04)]" : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"}`}>
                      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                        <div>
                          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{comp.name}</p>
                          {isGap && (
                            <p className="text-[10px] text-[hsl(var(--warning))] font-medium mt-0.5 flex items-center gap-1">
                              <AlertTriangle size={9} /> Rating gap of {gap} — please add a comment
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1">Self</p>
                            <StarRating value={comp.selfRating} size={14} />
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-1">Manager</p>
                            <StarRating value={comp.managerRating} onChange={v => updateManagerRating(member.id, comp.name, v)} size={14} />
                          </div>
                        </div>
                      </div>
                      <textarea
                        value={comp.managerComment}
                        onChange={e => updateManagerComment(member.id, comp.name, e.target.value)}
                        placeholder={`Manager's assessment of ${comp.name}...`}
                        rows={2}
                        className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)] resize-none"
                      />
                    </div>
                  );
                })}

                {/* Overall Manager Rating */}
                <div className="rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.04)] p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Overall Manager Rating</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <span>Self: {member.overallSelfRating}/5</span>
                        <span>Manager: {member.overallManagerRating}/5</span>
                      </div>
                    </div>
                    <StarRating value={member.overallManagerRating} onChange={v => updateOverallRating(member.id, v)} size={20} />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
                    <Save size={14} /> Save Draft
                  </button>
                  {!member.managerSubmitted ? (
                    <button
                      onClick={() => submitMember(member.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                    >
                      <Send size={14} /> Submit Rating
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--success))] font-medium">
                      <CheckCircle2 size={14} /> Rating submitted
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Calibration Tab ──────────────────────────────────────────────────────────
function CalibrationTab({ team, setTeam }: { team: TeamMember[]; setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>> }) {
  const total = team.length;

  const currentDist = CALIBRATION_TARGETS.map(ct => ({
    ...ct,
    current: team.filter(m => m.proposedRating === ct.label).length,
    currentPct: Math.round((team.filter(m => m.proposedRating === ct.label).length / total) * 100),
  }));

  const updateProposedRating = (memberId: string, rating: RatingLabel) => {
    setTeam(prev => prev.map(m => m.id !== memberId ? m : { ...m, proposedRating: rating }));
  };

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="rounded-2xl border border-[hsl(var(--primary)/0.2)] bg-[hsl(var(--primary)/0.04)] p-4 text-sm text-[hsl(var(--muted-foreground))]">
        <p className="font-semibold text-[hsl(var(--foreground))] mb-1 flex items-center gap-2"><Info size={15} className="text-[hsl(var(--primary))]" /> Calibration Board</p>
        <p className="text-xs">Adjust proposed ratings to align with the bell curve targets. In a live environment, this supports drag-and-drop calibration across the team. Ensure the distribution aligns with org-level guidelines before finalising.</p>
      </div>

      {/* Distribution Table */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2"><BarChart3 size={15} className="text-[hsl(var(--primary))]" /> Bell Curve Distribution</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Target vs Current ({total} direct reports)</p>
        </div>
        <div className="p-5 space-y-4">
          {currentDist.map(row => {
            const gap = row.currentPct - row.target;
            const isOver = gap > 0;
            const isUnder = gap < 0;
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-[hsl(var(--muted-foreground))]">Target: {row.target}%</span>
                    <span className="font-semibold text-[hsl(var(--foreground))]">Current: {row.currentPct}% ({row.current})</span>
                    {gap !== 0 && (
                      <span className={`font-semibold flex items-center gap-0.5 ${isOver ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--warning))]"}`}>
                        <TrendingUp size={11} className={isUnder ? "rotate-180" : ""} />
                        {isOver ? "+" : ""}{gap}%
                      </span>
                    )}
                    {gap === 0 && <span className="font-semibold text-[hsl(var(--success))]">✓ On target</span>}
                  </div>
                </div>
                {/* Stacked bar: target vs current */}
                <div className="h-5 rounded-full bg-[hsl(var(--muted))] relative overflow-hidden">
                  {/* Target marker */}
                  <div className="absolute inset-y-0 rounded-full opacity-30 transition-all duration-500" style={{ width: `${row.target}%`, backgroundColor: row.color }} />
                  {/* Current bar */}
                  <div className="absolute inset-y-0 rounded-full transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${row.currentPct}%`, backgroundColor: row.color, opacity: 0.85 }}>
                    {row.current > 0 && <span className="text-[9px] font-bold text-white">{row.current}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Employee Proposed Rating Table */}
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="px-5 py-4 border-b border-[hsl(var(--border))]">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Proposed Ratings — Adjust as Needed</h3>
        </div>
        <div className="divide-y divide-[hsl(var(--border))]">
          {team.map(member => (
            <div key={member.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[hsl(var(--muted)/0.3)] transition-colors flex-wrap">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${member.avatarColor}`}>
                {member.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{member.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{member.designation}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">Self: {member.overallSelfRating || "—"} · Mgr: {member.overallManagerRating}</span>
                <select
                  value={member.proposedRating}
                  onChange={e => updateProposedRating(member.id, e.target.value as RatingLabel)}
                  className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2 py-1 text-xs text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.4)]"
                >
                  {(["Exceptional", "Exceeds", "Meets", "Below", "PIP"] as RatingLabel[]).map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {(() => {
                  const ct = CALIBRATION_TARGETS.find(t => t.label === member.proposedRating);
                  return ct ? (
                    <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ct.color }} />
                  ) : null;
                })()}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
          <div className="flex gap-3 justify-end">
            <button className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors">
              <Save size={14} /> Save Draft
            </button>
            <button className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
              <Send size={14} /> Submit Calibration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tabs Config ──────────────────────────────────────────────────────────────
const TABS = [
  { id: "overview", label: "Team Overview", icon: Users },
  { id: "rate", label: "Rate Team", icon: ClipboardList },
  { id: "calibration", label: "Calibration", icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]["id"];

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TeamAppraisalPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [team, setTeam] = useState<TeamMember[]>(MOCK_TEAM);

  const submitted = team.filter(m => m.selfStatus === "SUBMITTED").length;
  const pending = team.filter(m => m.selfStatus !== "SUBMITTED").length;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.1)]">
            <Users size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Team Appraisal</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manager self-service — FY 2026-27 Q1</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--success)/0.1)] border border-[hsl(var(--success)/0.3)] px-3 py-1 font-medium text-[hsl(var(--success))]">
            <CheckCircle2 size={11} /> {submitted} Submitted
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--warning)/0.1)] border border-[hsl(var(--warning)/0.3)] px-3 py-1 font-medium text-[hsl(var(--warning))]">
            <AlertTriangle size={11} /> {pending} Pending
          </span>
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
      {activeTab === "overview" && <TeamOverviewTab team={team} />}
      {activeTab === "rate" && <RateTeamTab team={team} setTeam={setTeam} />}
      {activeTab === "calibration" && <CalibrationTab team={team} setTeam={setTeam} />}
    </div>
  );
}

export default TeamAppraisalPage;
