// yss_orbit\frontend\src\pages\hrms\JobPostingsPage.tsx
import React, { useState, useMemo } from 'react';
import {
  Briefcase, Plus, Search, MapPin, Users, Clock,
  CheckCircle, XCircle, AlertCircle, Edit2, Eye,
  BarChart3, TrendingUp, X, Send, Building2, Globe,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type JobStatus    = 'DRAFT' | 'OPEN' | 'ON_HOLD' | 'CLOSED' | 'FILLED';
type JobType      = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
type WorkMode     = 'ONSITE' | 'REMOTE' | 'HYBRID';
type Priority     = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  jobType: JobType;
  workMode: WorkMode;
  status: JobStatus;
  priority: Priority;
  openings: number;
  applicants: number;
  shortlisted: number;
  interviewed: number;
  offered: number;
  postedOn: string;
  closingDate: string;
  hiringManager: string;
  ctcMin: string;
  ctcMax: string;
  description: string;
  skills: string[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const JOBS: JobPosting[] = [
  { id: 'j1', title: 'Senior React Developer',    department: 'Engineering', location: 'Bengaluru',  jobType: 'FULL_TIME', workMode: 'HYBRID',  status: 'OPEN',    priority: 'CRITICAL', openings: 2, applicants: 48, shortlisted: 12, interviewed: 6, offered: 1, postedOn: '2026-05-15', closingDate: '2026-07-15', hiringManager: 'Vikram Das',   ctcMin: '18L', ctcMax: '28L', description: 'Build scalable frontend systems using React, TypeScript, and modern web tooling.', skills: ['React', 'TypeScript', 'GraphQL', 'AWS'] },
  { id: 'j2', title: 'Product Manager — Payments', department: 'Product',     location: 'Bengaluru',  jobType: 'FULL_TIME', workMode: 'HYBRID',  status: 'OPEN',    priority: 'HIGH',     openings: 1, applicants: 32, shortlisted: 8,  interviewed: 4, offered: 0, postedOn: '2026-05-20', closingDate: '2026-07-10', hiringManager: 'Sneha Kapoor', ctcMin: '25L', ctcMax: '40L', description: 'Own the payments roadmap, work with engineering and design to ship world-class payment experiences.', skills: ['Product Strategy', 'Payments', 'Agile', 'SQL'] },
  { id: 'j3', title: 'DevOps Engineer',            department: 'Infra',       location: 'Remote',     jobType: 'FULL_TIME', workMode: 'REMOTE',  status: 'OPEN',    priority: 'HIGH',     openings: 1, applicants: 21, shortlisted: 5,  interviewed: 2, offered: 0, postedOn: '2026-06-01', closingDate: '2026-07-31', hiringManager: 'Arjun Kumar',  ctcMin: '15L', ctcMax: '25L', description: 'Build and maintain CI/CD pipelines, Kubernetes clusters, and cloud infrastructure.', skills: ['AWS', 'Kubernetes', 'Terraform', 'Python'] },
  { id: 'j4', title: 'UI/UX Designer',             department: 'Design',      location: 'Bengaluru',  jobType: 'FULL_TIME', workMode: 'HYBRID',  status: 'ON_HOLD', priority: 'MEDIUM',   openings: 1, applicants: 15, shortlisted: 4,  interviewed: 0, offered: 0, postedOn: '2026-04-10', closingDate: '2026-06-30', hiringManager: 'Ananya Singh', ctcMin: '10L', ctcMax: '18L', description: 'Design beautiful, accessible interfaces for our HRMS platform.', skills: ['Figma', 'UX Research', 'Prototyping', 'HTML/CSS'] },
  { id: 'j5', title: 'Backend Engineer — Python',  department: 'Engineering', location: 'Bengaluru',  jobType: 'FULL_TIME', workMode: 'ONSITE',  status: 'FILLED',  priority: 'HIGH',     openings: 2, applicants: 61, shortlisted: 18, interviewed: 8, offered: 2, postedOn: '2026-03-01', closingDate: '2026-05-01', hiringManager: 'Vikram Das',   ctcMin: '12L', ctcMax: '22L', description: 'Build robust Django/FastAPI services with PostgreSQL and Redis.', skills: ['Python', 'Django', 'PostgreSQL', 'Redis'] },
  { id: 'j6', title: 'Data Analyst',               department: 'Analytics',   location: 'Hyderabad', jobType: 'FULL_TIME', workMode: 'HYBRID',  status: 'OPEN',    priority: 'MEDIUM',   openings: 1, applicants: 27, shortlisted: 7,  interviewed: 3, offered: 0, postedOn: '2026-06-05', closingDate: '2026-08-01', hiringManager: 'Deepa Reddy',  ctcMin: '8L',  ctcMax: '14L', description: 'Analyse HR, payroll, and operational data to drive business insights.', skills: ['Python', 'SQL', 'Power BI', 'Statistics'] },
];

const STATUS_CFG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  DRAFT:   { label: 'Draft',   color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))' },
  OPEN:    { label: 'Open',    color: 'hsl(var(--success))',          bg: 'hsl(var(--success)/0.1)' },
  ON_HOLD: { label: 'On Hold', color: 'hsl(var(--warning))',          bg: 'hsl(var(--warning)/0.1)' },
  CLOSED:  { label: 'Closed',  color: 'hsl(var(--destructive))',      bg: 'hsl(var(--destructive)/0.1)' },
  FILLED:  { label: 'Filled',  color: 'hsl(var(--teal))',             bg: 'hsl(var(--teal)/0.1)' },
};

const PRIORITY_CFG: Record<Priority, { label: string; color: string }> = {
  CRITICAL: { label: '🔴 Critical', color: 'hsl(var(--destructive))' },
  HIGH:     { label: '🟠 High',     color: 'hsl(var(--warning))' },
  MEDIUM:   { label: '🟡 Medium',   color: 'hsl(var(--accent))' },
  LOW:      { label: '🟢 Low',      color: 'hsl(var(--success))' },
};

const WORK_MODE_ICON: Record<WorkMode, string> = { ONSITE: '🏢', REMOTE: '🏠', HYBRID: '⚡' };

// ─── Job Card ─────────────────────────────────────────────────────────────────

const JobCard: React.FC<{ job: JobPosting; onView: (j: JobPosting) => void }> = ({ job, onView }) => {
  const sCfg = STATUS_CFG[job.status];
  const pCfg = PRIORITY_CFG[job.priority];
  const fillPct = Math.round((job.offered / job.openings) * 100);
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">{job.title}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ color: pCfg.color, background: `${pCfg.color}18` }}>{job.priority}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))]">
            <span className="flex items-center gap-1"><Building2 size={10} />{job.department}</span>
            <span className="flex items-center gap-1"><MapPin size={10} />{job.location}</span>
            <span>{WORK_MODE_ICON[job.workMode]} {job.workMode}</span>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ color: sCfg.color, background: sCfg.bg }}>{sCfg.label}</span>
      </div>

      {/* Pipeline mini-bar */}
      <div className="flex items-center gap-1 mb-3">
        {[
          { label: 'Applied', value: job.applicants, color: 'hsl(var(--muted-foreground))' },
          { label: 'Shortlisted', value: job.shortlisted, color: 'hsl(var(--primary))' },
          { label: 'Interviewed', value: job.interviewed, color: 'hsl(var(--accent))' },
          { label: 'Offered', value: job.offered, color: 'hsl(var(--success))' },
        ].map(s => (
          <div key={s.label} className="flex-1 text-center">
            <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[9px] text-[hsl(var(--muted-foreground))]">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] mb-3">
        <span>{job.openings} opening{job.openings > 1 ? 's' : ''} · {job.ctcMin}–{job.ctcMax}</span>
        <span>Closes {job.closingDate}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onView(job)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-[hsl(var(--border))] text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-all">
          <Eye size={12} />View Pipeline
        </button>
        <button className="p-1.5 rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-all">
          <Edit2 size={12} />
        </button>
      </div>
    </div>
  );
};

// ─── Job Detail Drawer ────────────────────────────────────────────────────────

const JobDetailDrawer: React.FC<{ job: JobPosting; onClose: () => void }> = ({ job, onClose }) => {
  const sCfg = STATUS_CFG[job.status];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative ml-auto w-full max-w-lg h-full bg-[hsl(var(--card))] shadow-2xl border-l border-[hsl(var(--border))] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))] z-10">
          <div>
            <h2 className="font-bold text-[hsl(var(--foreground))]">{job.title}</h2>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">{job.department} · {job.location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Applied',     value: job.applicants  },
              { label: 'Shortlisted', value: job.shortlisted },
              { label: 'Interviewed', value: job.interviewed },
              { label: 'Offered',     value: job.offered     },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-[hsl(var(--muted)/0.5)]">
                <p className="text-xl font-bold text-[hsl(var(--foreground))]">{s.value}</p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{s.label}</p>
              </div>
            ))}
          </div>
          {/* Details */}
          <div className="space-y-2">
            {[
              { label: 'Status',          value: <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: sCfg.color, background: sCfg.bg }}>{sCfg.label}</span> },
              { label: 'Priority',        value: PRIORITY_CFG[job.priority].label },
              { label: 'Job Type',        value: job.jobType.replace('_', ' ') },
              { label: 'Work Mode',       value: `${WORK_MODE_ICON[job.workMode]} ${job.workMode}` },
              { label: 'CTC Range',       value: `${job.ctcMin} – ${job.ctcMax}` },
              { label: 'Openings',        value: job.openings },
              { label: 'Hiring Manager',  value: job.hiringManager },
              { label: 'Posted On',       value: job.postedOn },
              { label: 'Closing Date',    value: job.closingDate },
            ].map(f => (
              <div key={f.label} className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--border))] last:border-0">
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{f.label}</span>
                <span className="text-xs font-medium text-[hsl(var(--foreground))]">{f.value}</span>
              </div>
            ))}
          </div>
          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Job Description</p>
            <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">{job.description}</p>
          </div>
          {/* Skills */}
          <div>
            <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {job.skills.map(s => <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] font-medium border border-[hsl(var(--primary)/0.2)]">{s}</span>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Create Job Modal ─────────────────────────────────────────────────────────

interface CreateJobForm {
  title: string;
  department: string;
  location: string;
  jobType: JobType;
  workMode: WorkMode;
  openings: number;
  ctcMin: string;
  ctcMax: string;
  priority: Priority;
  description: string;
}

const CREATE_DEFAULTS: CreateJobForm = {
  title: '', department: '', location: '', jobType: 'FULL_TIME', workMode: 'HYBRID',
  openings: 1, ctcMin: '', ctcMax: '', priority: 'HIGH', description: '',
};

const CreateJobModal: React.FC<{ onClose: () => void; onCreate: (j: CreateJobForm) => void }> = ({ onClose, onCreate }) => {
  const [form, setForm] = useState<CreateJobForm>(CREATE_DEFAULTS);
  const update = <K extends keyof CreateJobForm>(k: K, v: CreateJobForm[K]) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-lg bg-[hsl(var(--card))] rounded-2xl shadow-2xl border border-[hsl(var(--border))] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))] sticky top-0 bg-[hsl(var(--card))]">
          <h2 className="font-bold text-[hsl(var(--foreground))]">Create Job Posting</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="form-label">Job Title</label><input value={form.title} onChange={e => update('title', e.target.value)} placeholder="e.g. Senior Backend Engineer" className="form-input" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">Department</label><input value={form.department} onChange={e => update('department', e.target.value)} placeholder="Engineering" className="form-input" /></div>
            <div><label className="form-label">Location</label><input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Bengaluru" className="form-input" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="form-label">Job Type</label>
              <select value={form.jobType} onChange={e => update('jobType', e.target.value as JobType)} className="form-input">
                {['FULL_TIME','PART_TIME','CONTRACT','INTERNSHIP'].map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className="form-label">Work Mode</label>
              <select value={form.workMode} onChange={e => update('workMode', e.target.value as WorkMode)} className="form-input">
                {['ONSITE','REMOTE','HYBRID'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div><label className="form-label">Openings</label><input type="number" min={1} value={form.openings} onChange={e => update('openings', +e.target.value)} className="form-input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="form-label">CTC Min</label><input value={form.ctcMin} onChange={e => update('ctcMin', e.target.value)} placeholder="12L" className="form-input" /></div>
            <div><label className="form-label">CTC Max</label><input value={form.ctcMax} onChange={e => update('ctcMax', e.target.value)} placeholder="20L" className="form-input" /></div>
          </div>
          <div><label className="form-label">Priority</label>
            <select value={form.priority} onChange={e => update('priority', e.target.value as Priority)} className="form-input">
              {['CRITICAL','HIGH','MEDIUM','LOW'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div><label className="form-label">Description</label><textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} className="form-input resize-none" /></div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-all">Cancel</button>
          <button
            onClick={() => { onCreate(form); onClose(); }}
            disabled={!form.title || !form.department}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)] disabled:opacity-50"
          >
            <Send size={14} />Post Job
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const JobPostingsPage: React.FC = () => {
  const [jobs, setJobs] = useState(JOBS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | ''>('');
  const [filterDept, setFilterDept] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const depts = [...new Set(jobs.map(j => j.department))].sort();

  const filtered = useMemo(() => jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || j.status === filterStatus;
    const matchDept = !filterDept || j.department === filterDept;
    return matchSearch && matchStatus && matchDept;
  }), [jobs, search, filterStatus, filterDept]);

  const handleCreate = (data: CreateJobForm) => {
    const newJob: JobPosting = {
      id: `j${Date.now()}`, title: data.title, department: data.department, location: data.location,
      jobType: data.jobType, workMode: data.workMode,
      status: 'OPEN', priority: data.priority,
      openings: data.openings, applicants: 0, shortlisted: 0, interviewed: 0, offered: 0,
      postedOn: new Date().toISOString().split('T')[0]!, closingDate: '', hiringManager: '—',
      ctcMin: data.ctcMin || '—', ctcMax: data.ctcMax || '—',
      description: data.description, skills: [],
    };
    setJobs(prev => [newJob, ...prev]);
  };

  const openCount    = jobs.filter(j => j.status === 'OPEN').length;
  const totalApplicants = jobs.reduce((s, j) => s + j.applicants, 0);
  const totalOffered = jobs.reduce((s, j) => s + j.offered, 0);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.12)]"><Briefcase size={22} className="text-[hsl(var(--primary))]" /></div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Job Postings</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage open positions and recruitment pipelines</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)]">
          <Plus size={16} />Post New Job
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open Positions',  value: openCount,        color: 'var(--success)'     },
          { label: 'Total Applicants',value: totalApplicants,  color: 'var(--primary)'     },
          { label: 'Offers Extended', value: totalOffered,     color: 'var(--teal)'        },
          { label: 'Active JDs',      value: jobs.length,      color: 'var(--muted-foreground)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or department…" className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
          <option value="">All Status</option>
          {(Object.keys(STATUS_CFG) as JobStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Job cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(j => <JobCard key={j.id} job={j} onView={setSelectedJob} />)}
        {filtered.length === 0 && <div className="col-span-3 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No job postings match current filters.</div>}
      </div>

      {selectedJob && <JobDetailDrawer job={selectedJob} onClose={() => setSelectedJob(null)} />}
      {showCreate && <CreateJobModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      <style>{`
        .form-label { display: block; font-size: 11px; font-weight: 600; color: hsl(var(--muted-foreground)); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 8px 12px; border-radius: 10px; border: 1px solid hsl(var(--border)); background: hsl(var(--background)); font-size: 14px; outline: none; }
        .form-input:focus { ring: 2px; ring-color: hsl(var(--primary)/0.3); }
      `}</style>
    </div>
  );
};

export default JobPostingsPage;
