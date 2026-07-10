// yss_orbit\frontend\src\pages\hrms\CandidatePipelinePage.tsx
import React, { useState, useMemo } from 'react';
import {
  User, Search, Filter, ChevronRight, Mail, Phone,
  Star, Clock, CheckCircle, XCircle, ArrowRight,
  Download, Briefcase, Calendar, MessageSquare, X,
  Plus, AlertCircle, FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type CandidateStage =
  | 'APPLIED'
  | 'SCREENING'
  | 'TECHNICAL_ROUND_1'
  | 'TECHNICAL_ROUND_2'
  | 'HR_ROUND'
  | 'OFFER_EXTENDED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'REJECTED';

type CandidateSource = 'LINKEDIN' | 'NAUKRI' | 'REFERRAL' | 'DIRECT' | 'AGENCY';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  jobId: string;
  jobTitle: string;
  stage: CandidateStage;
  source: CandidateSource;
  appliedOn: string;
  rating: number;
  currentCTC: string;
  expectedCTC: string;
  noticePeriod: string;
  currentCompany: string;
  experience: string;
  skills: string[];
  recruiterNote: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const CANDIDATES: Candidate[] = [
  { id: 'c1',  name: 'Aarav Mehta',      email: 'aarav.mehta@email.com',    phone: '+91 98001 11111', initials: 'AM', jobId: 'j1', jobTitle: 'Senior React Developer',    stage: 'TECHNICAL_ROUND_2', source: 'LINKEDIN', appliedOn: '2026-05-18', rating: 4, currentCTC: '14L', expectedCTC: '22L', noticePeriod: '30 days',  currentCompany: 'Accenture', experience: '4 yrs', skills: ['React','TypeScript','Node.js'], recruiterNote: 'Strong frontend skills, good cultural fit.' },
  { id: 'c2',  name: 'Divya Krishnan',   email: 'divya.k@email.com',        phone: '+91 98002 22222', initials: 'DK', jobId: 'j1', jobTitle: 'Senior React Developer',    stage: 'HR_ROUND',          source: 'NAUKRI',   appliedOn: '2026-05-20', rating: 5, currentCTC: '16L', expectedCTC: '25L', noticePeriod: '60 days',  currentCompany: 'Infosys',   experience: '6 yrs', skills: ['React','GraphQL','AWS'],     recruiterNote: 'Excellent technical assessment — 95/100.' },
  { id: 'c3',  name: 'Kabir Sharma',     email: 'kabir.s@email.com',        phone: '+91 98003 33333', initials: 'KS', jobId: 'j1', jobTitle: 'Senior React Developer',    stage: 'OFFER_EXTENDED',    source: 'REFERRAL', appliedOn: '2026-05-22', rating: 5, currentCTC: '18L', expectedCTC: '26L', noticePeriod: '30 days',  currentCompany: 'Flipkart',  experience: '7 yrs', skills: ['React','Next.js','TypeScript'], recruiterNote: 'Referred by Vikram. Exceptional candidate.' },
  { id: 'c4',  name: 'Shreya Patel',     email: 'shreya.p@email.com',       phone: '+91 98004 44444', initials: 'SP', jobId: 'j2', jobTitle: 'Product Manager — Payments', stage: 'SCREENING',         source: 'LINKEDIN', appliedOn: '2026-05-25', rating: 3, currentCTC: '20L', expectedCTC: '32L', noticePeriod: '90 days',  currentCompany: 'Paytm',     experience: '5 yrs', skills: ['Product','Payments','Agile'],  recruiterNote: 'Good background but notice period is long.' },
  { id: 'c5',  name: 'Rahul Verma',      email: 'rahul.v@email.com',        phone: '+91 98005 55555', initials: 'RV', jobId: 'j2', jobTitle: 'Product Manager — Payments', stage: 'TECHNICAL_ROUND_1', source: 'DIRECT',   appliedOn: '2026-05-28', rating: 4, currentCTC: '22L', expectedCTC: '35L', noticePeriod: '30 days',  currentCompany: 'Razorpay',  experience: '6 yrs', skills: ['Payments','B2B SaaS','SQL'],   recruiterNote: 'Strong domain expertise in payments.' },
  { id: 'c6',  name: 'Nisha Gupta',      email: 'nisha.g@email.com',        phone: '+91 98006 66666', initials: 'NG', jobId: 'j3', jobTitle: 'DevOps Engineer',            stage: 'APPLIED',           source: 'NAUKRI',   appliedOn: '2026-06-02', rating: 3, currentCTC: '12L', expectedCTC: '18L', noticePeriod: '60 days',  currentCompany: 'TCS',       experience: '3 yrs', skills: ['AWS','Kubernetes','Linux'],    recruiterNote: 'Resume looks good. Needs screening call.' },
  { id: 'c7',  name: 'Aryan Singh',      email: 'aryan.s@email.com',        phone: '+91 98007 77777', initials: 'AS', jobId: 'j3', jobTitle: 'DevOps Engineer',            stage: 'REJECTED',          source: 'AGENCY',   appliedOn: '2026-06-01', rating: 2, currentCTC: '8L',  expectedCTC: '20L', noticePeriod: '30 days',  currentCompany: 'Wipro',     experience: '2 yrs', skills: ['AWS','Docker'],               recruiterNote: 'Skills gap for this level. Rejected post screening.' },
  { id: 'c8',  name: 'Preethi Nair',     email: 'preethi.n@email.com',      phone: '+91 98008 88888', initials: 'PN', jobId: 'j1', jobTitle: 'Senior React Developer',    stage: 'OFFER_ACCEPTED',    source: 'REFERRAL', appliedOn: '2026-04-15', rating: 5, currentCTC: '17L', expectedCTC: '26L', noticePeriod: '60 days',  currentCompany: 'Amazon',    experience: '8 yrs', skills: ['React','AWS','TypeScript'],   recruiterNote: 'Offer accepted! Joining date: Jul 15.' },
  { id: 'c9',  name: 'Suraj Iyer',       email: 'suraj.i@email.com',        phone: '+91 98009 99999', initials: 'SI', jobId: 'j6', jobTitle: 'Data Analyst',               stage: 'SCREENING',         source: 'NAUKRI',   appliedOn: '2026-06-06', rating: 3, currentCTC: '6L',  expectedCTC: '10L', noticePeriod: '30 days',  currentCompany: 'HDFC Bank', experience: '2 yrs', skills: ['Python','SQL','Power BI'],    recruiterNote: 'Potential candidate. Schedule screening.' },
  { id: 'c10', name: 'Trisha Bansal',    email: 'trisha.b@email.com',       phone: '+91 98010 10101', initials: 'TB', jobId: 'j2', jobTitle: 'Product Manager — Payments', stage: 'HR_ROUND',          source: 'LINKEDIN', appliedOn: '2026-05-30', rating: 4, currentCTC: '24L', expectedCTC: '36L', noticePeriod: '60 days',  currentCompany: 'PhonePe',   experience: '7 yrs', skills: ['Payments','UX','Roadmapping'], recruiterNote: 'Very strong. Awaiting HR decision.' },
];

const STAGES: { key: CandidateStage; label: string; color: string }[] = [
  { key: 'APPLIED',           label: 'Applied',           color: 'hsl(var(--muted-foreground))' },
  { key: 'SCREENING',         label: 'Screening',         color: 'hsl(var(--accent))' },
  { key: 'TECHNICAL_ROUND_1', label: 'Technical R1',      color: 'hsl(var(--primary))' },
  { key: 'TECHNICAL_ROUND_2', label: 'Technical R2',      color: 'hsl(var(--teal))' },
  { key: 'HR_ROUND',          label: 'HR Round',          color: 'hsl(var(--warning))' },
  { key: 'OFFER_EXTENDED',    label: 'Offer Extended',    color: 'hsl(var(--success))' },
  { key: 'OFFER_ACCEPTED',    label: 'Offer Accepted',    color: 'hsl(var(--success))' },
  { key: 'OFFER_DECLINED',    label: 'Offer Declined',    color: 'hsl(var(--destructive))' },
  { key: 'REJECTED',          label: 'Rejected',          color: 'hsl(var(--destructive))' },
];

const SOURCE_LABEL: Record<CandidateSource, string> = {
  LINKEDIN: '🔵 LinkedIn', NAUKRI: '🟠 Naukri', REFERRAL: '🟣 Referral', DIRECT: '⚪ Direct', AGENCY: '🟡 Agency',
};

const ACTIVE_STAGES: CandidateStage[] = ['APPLIED','SCREENING','TECHNICAL_ROUND_1','TECHNICAL_ROUND_2','HR_ROUND','OFFER_EXTENDED'];

// ─── Candidate Card (Kanban) ──────────────────────────────────────────────────

const CandidateCard: React.FC<{ candidate: Candidate; onSelect: () => void }> = ({ candidate, onSelect }) => {
  const cfg = STAGES.find(s => s.key === candidate.stage)!;
  return (
    <div onClick={onSelect} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-xs font-bold text-white shrink-0">{candidate.initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">{candidate.name}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{candidate.currentCompany} · {candidate.experience}</p>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={9} className={i < candidate.rating ? 'text-[hsl(var(--warning))] fill-[hsl(var(--warning))]' : 'text-[hsl(var(--border))]'} />
          ))}
        </div>
      </div>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] mb-2 truncate">{candidate.jobTitle}</p>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[hsl(var(--muted-foreground))]">{SOURCE_LABEL[candidate.source]}</span>
        <span className="text-[hsl(var(--muted-foreground))]">{candidate.appliedOn}</span>
      </div>
    </div>
  );
};

// ─── Candidate Detail Panel ───────────────────────────────────────────────────

const CandidatePanel: React.FC<{ candidate: Candidate; onClose: () => void; onMove: (stage: CandidateStage) => void }> = ({ candidate, onClose, onMove }) => {
  const currentIdx = ACTIVE_STAGES.indexOf(candidate.stage);
  const nextStage  = currentIdx >= 0 && currentIdx < ACTIVE_STAGES.length - 1 ? ACTIVE_STAGES[currentIdx + 1] : null;
  const cfg = STAGES.find(s => s.key === candidate.stage)!;

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative ml-auto w-full max-w-lg h-full bg-[hsl(var(--card))] shadow-2xl border-l border-[hsl(var(--border))] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-sm font-bold text-white">{candidate.initials}</div>
            <div>
              <h2 className="font-bold text-[hsl(var(--foreground))]">{candidate.name}</h2>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{candidate.currentCompany} · {candidate.experience}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Stage badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}18` }}>● {cfg.label}</span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">Applied {candidate.appliedOn}</span>
          </div>
          {/* Contact */}
          <div className="flex gap-2">
            <a href={`mailto:${candidate.email}`} className="flex-1 flex items-center justify-center gap-1.5 p-2 rounded-lg bg-[hsl(var(--muted)/0.5)] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors">
              <Mail size={12} />{candidate.email}
            </a>
            <a href={`tel:${candidate.phone}`} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[hsl(var(--muted)/0.5)] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors">
              <Phone size={12} />Call
            </a>
          </div>
          {/* Details */}
          <div className="space-y-2">
            {[
              { label: 'Job Applied For',   value: candidate.jobTitle },
              { label: 'Source',            value: SOURCE_LABEL[candidate.source] },
              { label: 'Current CTC',       value: candidate.currentCTC },
              { label: 'Expected CTC',      value: candidate.expectedCTC },
              { label: 'Notice Period',     value: candidate.noticePeriod },
            ].map(f => (
              <div key={f.label} className="flex justify-between py-1.5 border-b border-[hsl(var(--border))] last:border-0 text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">{f.label}</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{f.value}</span>
              </div>
            ))}
          </div>
          {/* Rating */}
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Rating</p>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={18} className={i < candidate.rating ? 'text-[hsl(var(--warning))] fill-[hsl(var(--warning))]' : 'text-[hsl(var(--border))]'} />
              ))}
              <span className="text-sm text-[hsl(var(--muted-foreground))] ml-2">{candidate.rating}/5</span>
            </div>
          </div>
          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">{candidate.skills.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium">{s}</span>)}</div>
          </div>
          {/* Recruiter note */}
          <div className="p-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border))]">
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1">Recruiter Note</p>
            <p className="text-sm text-[hsl(var(--foreground))]">{candidate.recruiterNote}</p>
          </div>
          {/* Move stage actions */}
          <div className="space-y-2 pt-2">
            {nextStage && (
              <button onClick={() => onMove(nextStage)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)]">
                <ArrowRight size={14} />Move to {STAGES.find(s => s.key === nextStage)?.label}
              </button>
            )}
            <button onClick={() => onMove('REJECTED')} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[hsl(var(--destructive)/0.3)] text-[hsl(var(--destructive))] text-sm font-medium hover:bg-[hsl(var(--destructive)/0.05)] transition-all">
              <XCircle size={14} />Reject Candidate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const CandidatePipelinePage: React.FC = () => {
  const [candidates, setCandidates] = useState(CANDIDATES);
  const [search, setSearch] = useState('');
  const [filterJob, setFilterJob] = useState('');
  const [selected, setSelected] = useState<Candidate | null>(null);

  const jobs = [...new Set(CANDIDATES.map(c => c.jobTitle))].sort();

  const filtered = useMemo(() => candidates.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.currentCompany.toLowerCase().includes(search.toLowerCase());
    const matchJob = !filterJob || c.jobTitle === filterJob;
    return matchSearch && matchJob;
  }), [candidates, search, filterJob]);

  const handleMove = (id: string, stage: CandidateStage) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    setSelected(prev => prev?.id === id ? { ...prev, stage } : prev);
  };

  const kanbanStages = ACTIVE_STAGES.filter(s => s !== 'OFFER_ACCEPTED');

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--accent)/0.12)]"><User size={22} className="text-[hsl(var(--accent))]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Candidate Pipeline</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Track and manage candidates across all hiring stages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search candidates…" className="pl-8 pr-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none w-44" />
          </div>
          <select value={filterJob} onChange={e => setFilterJob(e.target.value)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
            <option value="">All Jobs</option>
            {jobs.map(j => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {kanbanStages.map(stageKey => {
          const stageCfg = STAGES.find(s => s.key === stageKey)!;
          const stageCandidates = filtered.filter(c => c.stage === stageKey);
          return (
            <div key={stageKey} className="flex-shrink-0 w-60">
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: stageCfg.color }} />
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))]">{stageCfg.label}</span>
                </div>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">{stageCandidates.length}</span>
              </div>
              <div className="space-y-2 min-h-24 rounded-xl bg-[hsl(var(--muted)/0.3)] p-2 border border-[hsl(var(--border))]">
                {stageCandidates.map(c => (
                  <CandidateCard key={c.id} candidate={c} onSelect={() => setSelected(c)} />
                ))}
                {stageCandidates.length === 0 && <p className="text-center text-xs text-[hsl(var(--muted-foreground))] py-4">No candidates</p>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {[
          { label: 'Offer Accepted', value: candidates.filter(c => c.stage === 'OFFER_ACCEPTED').length, color: 'var(--success)' },
          { label: 'Offer Declined', value: candidates.filter(c => c.stage === 'OFFER_DECLINED').length, color: 'var(--warning)' },
          { label: 'Rejected',       value: candidates.filter(c => c.stage === 'REJECTED').length,       color: 'var(--destructive)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-3 text-center">
            <p className="text-xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {selected && (
        <CandidatePanel
          candidate={selected}
          onClose={() => setSelected(null)}
          onMove={stage => handleMove(selected.id, stage)}
        />
      )}
    </div>
  );
};

export default CandidatePipelinePage;
