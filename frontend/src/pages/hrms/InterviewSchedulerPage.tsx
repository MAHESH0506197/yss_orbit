// yss_orbit\frontend\src\pages\hrms\InterviewSchedulerPage.tsx
import React, { useState, useMemo } from 'react';
import {
  Calendar, Clock, User, Video, Phone as PhoneIcon,
  MapPin, CheckCircle, XCircle, AlertCircle,
  Plus, ChevronLeft, ChevronRight, X, Send,
  Star, MessageSquare, Users, Briefcase,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type InterviewMode    = 'VIDEO' | 'IN_PERSON' | 'PHONE';
type InterviewStatus  = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
type InterviewRound   = 'SCREENING' | 'TECHNICAL_ROUND_1' | 'TECHNICAL_ROUND_2' | 'HR_ROUND' | 'FINAL';

interface Interview {
  id: string;
  candidateName: string;
  candidateInitials: string;
  candidateEmail: string;
  jobTitle: string;
  round: InterviewRound;
  mode: InterviewMode;
  status: InterviewStatus;
  date: string;
  startTime: string;
  endTime: string;
  interviewers: string[];
  meetLink?: string;
  location?: string;
  feedback?: string;
  rating?: number;
  result?: 'PASS' | 'FAIL' | 'HOLD';
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INTERVIEWS: Interview[] = [
  { id: 'i1',  candidateName: 'Aarav Mehta',   candidateInitials: 'AM', candidateEmail: 'aarav.mehta@email.com',  jobTitle: 'Senior React Developer',    round: 'TECHNICAL_ROUND_2', mode: 'VIDEO',     status: 'SCHEDULED', date: '2026-06-12', startTime: '10:00', endTime: '11:00', interviewers: ['Vikram Das', 'Suresh Rajan'], meetLink: 'https://meet.google.com/xyz-abc', feedback: '', rating: undefined, result: undefined },
  { id: 'i2',  candidateName: 'Divya Krishnan', candidateInitials: 'DK', candidateEmail: 'divya.k@email.com',      jobTitle: 'Senior React Developer',    round: 'HR_ROUND',          mode: 'VIDEO',     status: 'SCHEDULED', date: '2026-06-12', startTime: '14:00', endTime: '15:00', interviewers: ['Sneha Iyer'], meetLink: 'https://meet.google.com/hr-divya', feedback: '', rating: undefined, result: undefined },
  { id: 'i3',  candidateName: 'Rahul Verma',    candidateInitials: 'RV', candidateEmail: 'rahul.v@email.com',      jobTitle: 'Product Manager — Payments',round: 'TECHNICAL_ROUND_1', mode: 'VIDEO',     status: 'SCHEDULED', date: '2026-06-13', startTime: '11:00', endTime: '12:00', interviewers: ['Sneha Kapoor', 'Kiran Rao'], meetLink: 'https://meet.google.com/pm-rahul', feedback: '', rating: undefined, result: undefined },
  { id: 'i4',  candidateName: 'Nisha Gupta',    candidateInitials: 'NG', candidateEmail: 'nisha.g@email.com',      jobTitle: 'DevOps Engineer',            round: 'SCREENING',         mode: 'PHONE',     status: 'SCHEDULED', date: '2026-06-13', startTime: '16:00', endTime: '16:30', interviewers: ['Arjun Kumar'], feedback: '', rating: undefined, result: undefined },
  { id: 'i5',  candidateName: 'Shreya Patel',   candidateInitials: 'SP', candidateEmail: 'shreya.p@email.com',     jobTitle: 'Product Manager — Payments',round: 'SCREENING',         mode: 'VIDEO',     status: 'COMPLETED', date: '2026-06-10', startTime: '10:00', endTime: '10:30', interviewers: ['Sneha Kapoor'], meetLink: 'https://meet.google.com/pm-shreya', feedback: 'Good domain knowledge. Long notice period concern.', rating: 3, result: 'PASS' },
  { id: 'i6',  candidateName: 'Aryan Singh',    candidateInitials: 'AS', candidateEmail: 'aryan.s@email.com',      jobTitle: 'DevOps Engineer',            round: 'SCREENING',         mode: 'PHONE',     status: 'COMPLETED', date: '2026-06-08', startTime: '15:00', endTime: '15:30', interviewers: ['Arjun Kumar'], feedback: 'Skills gap. Not suitable for this level.', rating: 2, result: 'FAIL' },
  { id: 'i7',  candidateName: 'Trisha Bansal',  candidateInitials: 'TB', candidateEmail: 'trisha.b@email.com',     jobTitle: 'Product Manager — Payments',round: 'HR_ROUND',          mode: 'IN_PERSON', status: 'SCHEDULED', date: '2026-06-14', startTime: '09:30', endTime: '10:30', interviewers: ['Meena Pillai'], location: 'Conference Room A, Floor 4', feedback: '', rating: undefined, result: undefined },
  { id: 'i8',  candidateName: 'Kabir Sharma',   candidateInitials: 'KS', candidateEmail: 'kabir.s@email.com',      jobTitle: 'Senior React Developer',    round: 'FINAL',             mode: 'IN_PERSON', status: 'COMPLETED', date: '2026-06-09', startTime: '11:00', endTime: '12:00', interviewers: ['Vikram Das', 'Sneha Kapoor'], location: 'Boardroom', feedback: 'Excellent across all areas. Offer recommended.', rating: 5, result: 'PASS' },
];

const STATUS_CFG: Record<InterviewStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  SCHEDULED:  { label: 'Scheduled',  color: 'hsl(var(--primary))',    bg: 'hsl(var(--primary)/0.1)',    icon: <Clock size={11} /> },
  COMPLETED:  { label: 'Completed',  color: 'hsl(var(--success))',    bg: 'hsl(var(--success)/0.1)',    icon: <CheckCircle size={11} /> },
  CANCELLED:  { label: 'Cancelled',  color: 'hsl(var(--destructive))',bg: 'hsl(var(--destructive)/0.1)',icon: <XCircle size={11} /> },
  NO_SHOW:    { label: 'No Show',    color: 'hsl(var(--warning))',    bg: 'hsl(var(--warning)/0.1)',    icon: <AlertCircle size={11} /> },
};

const MODE_ICON: Record<InterviewMode, React.ReactNode> = {
  VIDEO:     <Video size={13} className="text-[hsl(var(--primary))]" />,
  IN_PERSON: <MapPin size={13} className="text-[hsl(var(--accent))]" />,
  PHONE:     <PhoneIcon size={13} className="text-[hsl(var(--teal))]" />,
};

const ROUND_CFG: Record<InterviewRound, { label: string; color: string }> = {
  SCREENING:         { label: 'Screening',   color: 'hsl(var(--muted-foreground))' },
  TECHNICAL_ROUND_1: { label: 'Tech R1',     color: 'hsl(var(--primary))' },
  TECHNICAL_ROUND_2: { label: 'Tech R2',     color: 'hsl(var(--teal))' },
  HR_ROUND:          { label: 'HR Round',    color: 'hsl(var(--warning))' },
  FINAL:             { label: 'Final Round', color: 'hsl(var(--accent))' },
};

const RESULT_CFG = {
  PASS: { label: 'Pass', color: 'hsl(var(--success))' },
  FAIL: { label: 'Fail', color: 'hsl(var(--destructive))' },
  HOLD: { label: 'On Hold', color: 'hsl(var(--warning))' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ─── Schedule Modal ───────────────────────────────────────────────────────────

const ScheduleModal: React.FC<{ onClose: () => void; onSchedule: (i: Partial<Interview>) => void }> = ({ onClose, onSchedule }) => {
  const [form, setForm] = useState({ candidateName: '', jobTitle: '', round: 'SCREENING', mode: 'VIDEO', date: '', startTime: '', endTime: '', interviewers: '' });
  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h2 className="font-bold text-[hsl(var(--foreground))]">Schedule Interview</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="sched-label">Candidate Name</label><input value={form.candidateName} onChange={e => update('candidateName', e.target.value)} placeholder="e.g. John Doe" className="sched-input" /></div>
            <div><label className="sched-label">Job Title</label><input value={form.jobTitle} onChange={e => update('jobTitle', e.target.value)} placeholder="e.g. Senior Dev" className="sched-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="sched-label">Round</label>
              <select value={form.round} onChange={e => update('round', e.target.value)} className="sched-input">
                {Object.entries(ROUND_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div><label className="sched-label">Mode</label>
              <select value={form.mode} onChange={e => update('mode', e.target.value)} className="sched-input">
                <option value="VIDEO">Video Call</option>
                <option value="IN_PERSON">In Person</option>
                <option value="PHONE">Phone</option>
              </select>
            </div>
          </div>
          <div><label className="sched-label">Date</label><input type="date" value={form.date} onChange={e => update('date', e.target.value)} className="sched-input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="sched-label">Start Time</label><input type="time" value={form.startTime} onChange={e => update('startTime', e.target.value)} className="sched-input" /></div>
            <div><label className="sched-label">End Time</label><input type="time" value={form.endTime} onChange={e => update('endTime', e.target.value)} className="sched-input" /></div>
          </div>
          <div><label className="sched-label">Interviewers (comma separated)</label><input value={form.interviewers} onChange={e => update('interviewers', e.target.value)} placeholder="Vikram Das, Sneha Kapoor" className="sched-input" /></div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-all">Cancel</button>
          <button
            onClick={() => { onSchedule({ ...form, round: form.round as InterviewRound, mode: form.mode as InterviewMode, status: 'SCHEDULED', candidateInitials: form.candidateName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2), interviewers: form.interviewers.split(',').map(s => s.trim()) }); onClose(); }}
            disabled={!form.candidateName || !form.date || !form.startTime}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)] disabled:opacity-50"
          >
            <Send size={14} />Schedule
          </button>
        </div>
      </div>
      <style>{`
        .sched-label { display:block; font-size:11px; font-weight:600; color:hsl(var(--muted-foreground)); text-transform:uppercase; letter-spacing:.05em; margin-bottom:6px; }
        .sched-input { width:100%; padding:8px 12px; border-radius:10px; border:1px solid hsl(var(--border)); background:hsl(var(--background)); font-size:14px; outline:none; }
      `}</style>
    </div>
  );
};

// ─── Interview Card ───────────────────────────────────────────────────────────

const InterviewCard: React.FC<{ interview: Interview; onFeedback: () => void }> = ({ interview: iv, onFeedback }) => {
  const sCfg = STATUS_CFG[iv.status];
  const rCfg = ROUND_CFG[iv.round];
  return (
    <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-xs font-bold text-white shrink-0">{iv.candidateInitials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">{iv.candidateName}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ color: sCfg.color, background: sCfg.bg }}>{sCfg.icon}{sCfg.label}</span>
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{iv.jobTitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] mb-3">
        <span className="flex items-center gap-1"><Calendar size={11} />{iv.date}</span>
        <span className="flex items-center gap-1"><Clock size={11} />{iv.startTime}–{iv.endTime}</span>
        <span className="flex items-center gap-1">{MODE_ICON[iv.mode]}{iv.mode.replace('_',' ')}</span>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: rCfg.color, background: `${rCfg.color}18` }}>{rCfg.label}</span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">{iv.interviewers.join(', ')}</span>
      </div>
      {iv.result && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold" style={{ color: RESULT_CFG[iv.result].color }}>Result: {RESULT_CFG[iv.result].label}</span>
          {iv.rating && (
            <div className="flex gap-0.5 ml-1">
              {Array.from({ length: 5 }, (_, i) => <Star key={i} size={10} className={i < iv.rating! ? 'text-[hsl(var(--warning))] fill-[hsl(var(--warning))]' : 'text-[hsl(var(--border))]'} />)}
            </div>
          )}
        </div>
      )}
      {iv.feedback && <p className="text-xs text-[hsl(var(--muted-foreground))] italic line-clamp-1">"{iv.feedback}"</p>}
      {iv.status === 'SCHEDULED' && (
        <div className="flex gap-2 mt-3">
          {iv.meetLink && <a href={iv.meetLink} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-medium hover:bg-[hsl(var(--primary)/0.2)] transition-colors"><Video size={11} />Join</a>}
          <button onClick={onFeedback} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-colors"><MessageSquare size={11} />Feedback</button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const InterviewSchedulerPage: React.FC = () => {
  const [interviews, setInterviews] = useState(INTERVIEWS);
  const [showSchedule, setShowSchedule] = useState(false);
  const [filterStatus, setFilterStatus] = useState<InterviewStatus | ''>('');
  const [calMonth, setCalMonth] = useState(5); // June 0-indexed
  const [calYear, setCalYear] = useState(2026);

  const filtered = interviews.filter(i => !filterStatus || i.status === filterStatus);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayInterviews = interviews.filter(i => i.date === '2026-06-12'); // Demo: show today's

  const handleSchedule = (data: Partial<Interview>) => {
    const newI: Interview = {
      id: `i${Date.now()}`, candidateName: data.candidateName!, candidateInitials: data.candidateInitials || '??',
      candidateEmail: '', jobTitle: data.jobTitle!, round: data.round!, mode: data.mode!,
      status: 'SCHEDULED', date: data.date!, startTime: data.startTime!, endTime: data.endTime!,
      interviewers: data.interviewers || [],
    };
    setInterviews(prev => [...prev, newI]);
  };

  const scheduledCount  = interviews.filter(i => i.status === 'SCHEDULED').length;
  const completedCount  = interviews.filter(i => i.status === 'COMPLETED').length;
  const passCount       = interviews.filter(i => i.result === 'PASS').length;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--teal)/0.12)]"><Calendar size={22} className="text-[hsl(var(--teal))]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Interview Scheduler</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Schedule, track, and record interview outcomes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
            <option value="">All Status</option>
            {(Object.keys(STATUS_CFG) as InterviewStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
          <button onClick={() => setShowSchedule(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)]">
            <Plus size={14} />Schedule
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Upcoming',  value: scheduledCount, color: 'var(--primary)' },
          { label: 'Completed', value: completedCount, color: 'var(--success)' },
          { label: 'Passed',    value: passCount,      color: 'var(--teal)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's interviews */}
      {todayInterviews.length > 0 && (
        <div className="mb-5">
          <h3 className="font-bold text-sm text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
            Today's Interviews ({todayInterviews.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {todayInterviews.map(i => <InterviewCard key={i.id} interview={i} onFeedback={() => {}} />)}
          </div>
        </div>
      )}

      {/* All Interviews */}
      <div>
        <h3 className="font-bold text-sm text-[hsl(var(--foreground))] mb-3">All Interviews</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(i => <InterviewCard key={i.id} interview={i} onFeedback={() => {}} />)}
          {filtered.length === 0 && <div className="col-span-3 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No interviews found.</div>}
        </div>
      </div>

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} onSchedule={handleSchedule} />}
    </div>
  );
};

export default InterviewSchedulerPage;
