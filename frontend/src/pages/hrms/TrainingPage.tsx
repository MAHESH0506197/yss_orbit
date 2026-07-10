// yss_orbit\frontend\src\pages\hrms\TrainingPage.tsx
import React, { useState, useMemo } from 'react';
import {
  BookOpen, CheckCircle, Clock, AlertCircle, Plus,
  Search, Download, TrendingUp, Award, Users, BarChart3,
  Play, FileText, Star, Target, Filter,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TrainingStatus  = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
type TrainingView    = 'MY_TRAINING' | 'TEAM_TRAINING' | 'CATALOG' | 'REPORTS';
type CourseCategory  = 'TECHNICAL' | 'COMPLIANCE' | 'SOFT_SKILLS' | 'LEADERSHIP' | 'PRODUCT';

interface TrainingCourse {
  id: string;
  title: string;
  provider: string;
  category: CourseCategory;
  duration: string;       // e.g. "4h 30m"
  mandatory: boolean;
  status: TrainingStatus;
  score?: number;
  dueDate?: string;
  completedOn?: string;
  description: string;
  passMarkPct: number;
}

interface TeamTrainingRecord {
  empName: string;
  empCode: string;
  avatar: string;
  department: string;
  courseName: string;
  category: CourseCategory;
  status: TrainingStatus;
  score?: number;
  dueDate: string;
  mandatory: boolean;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MY_COURSES: TrainingCourse[] = [
  { id: 'tc1', title: 'AWS Solutions Architect – Associate',   provider: 'AWS Training',   category: 'TECHNICAL',   duration: '40h',      mandatory: false, status: 'IN_PROGRESS', dueDate: '2026-08-31', description: 'Comprehensive cloud architecture training covering EC2, S3, VPC, IAM, and serverless patterns.', passMarkPct: 72 },
  { id: 'tc2', title: 'Information Security Awareness 2026',   provider: 'IT Dept',        category: 'COMPLIANCE',  duration: '2h',       mandatory: true,  status: 'NOT_STARTED', dueDate: '2026-06-30', description: 'Annual mandatory security training covering phishing, data handling, and incident reporting.', passMarkPct: 80 },
  { id: 'tc3', title: 'React Advanced Patterns & Architecture',provider: 'Internal L&D',   category: 'TECHNICAL',   duration: '12h',      mandatory: false, status: 'COMPLETED', score: 88, completedOn: '2026-03-15', description: 'Advanced React patterns: render props, HOCs, Suspense, concurrent mode, and performance tuning.', passMarkPct: 70 },
  { id: 'tc4', title: 'POSH Awareness Training',              provider: 'HR Department',  category: 'COMPLIANCE',  duration: '1h 30m',   mandatory: true,  status: 'COMPLETED', score: 100, completedOn: '2025-11-05', description: 'Prevention of Sexual Harassment at Workplace — statutory compliance training.', passMarkPct: 80 },
  { id: 'tc5', title: 'Effective Communication Skills',       provider: 'External',       category: 'SOFT_SKILLS', duration: '8h',       mandatory: false, status: 'COMPLETED', score: 91, completedOn: '2025-09-20', description: 'Structured and unstructured communication in professional settings.', passMarkPct: 65 },
  { id: 'tc6', title: 'Docker & Kubernetes Fundamentals',     provider: 'Internal L&D',   category: 'TECHNICAL',   duration: '10h',      mandatory: false, status: 'IN_PROGRESS', dueDate: '2026-07-31', description: 'Containerisation, orchestration, Helm charts, and deployment strategies.', passMarkPct: 70 },
];

const CATALOG_COURSES: TrainingCourse[] = [
  { id: 'cat1', title: 'Node.js Microservices at Scale', provider: 'Internal L&D', category: 'TECHNICAL', duration: '16h', mandatory: false, status: 'NOT_STARTED', description: 'Build production-grade microservices with Node.js, message queues, and distributed tracing.', passMarkPct: 70 },
  { id: 'cat2', title: 'Leadership Fundamentals', provider: 'Leadership Academy', category: 'LEADERSHIP', duration: '24h', mandatory: false, status: 'NOT_STARTED', description: 'Management essentials: team building, feedback frameworks, and performance conversations.', passMarkPct: 65 },
  { id: 'cat3', title: 'Design Thinking Practitioner', provider: 'IDEO U', category: 'SOFT_SKILLS', duration: '6h', mandatory: false, status: 'NOT_STARTED', description: 'Human-centred innovation framework for problem solving and ideation.', passMarkPct: 65 },
  { id: 'cat4', title: 'GDPR & Data Privacy Essentials', provider: 'Legal Dept', category: 'COMPLIANCE', duration: '3h', mandatory: false, status: 'NOT_STARTED', description: 'Data protection regulation compliance for product and engineering teams.', passMarkPct: 80 },
  { id: 'cat5', title: 'Product Strategy & Roadmapping', provider: 'Product Academy', category: 'PRODUCT', duration: '10h', mandatory: false, status: 'NOT_STARTED', description: 'Frameworks for creating, prioritising, and communicating product roadmaps.', passMarkPct: 65 },
];

const TEAM_TRAINING: TeamTrainingRecord[] = [
  { empName: 'Kiran Rao',    empCode: 'EMP007', avatar: 'KR', department: 'Engineering', courseName: 'Information Security 2026', category: 'COMPLIANCE', status: 'NOT_STARTED', dueDate: '2026-06-30', mandatory: true },
  { empName: 'Meena Pillai', empCode: 'EMP008', avatar: 'MP', department: 'HR',          courseName: 'Leadership Fundamentals',   category: 'LEADERSHIP', status: 'IN_PROGRESS',  dueDate: '2026-09-30', mandatory: false },
  { empName: 'Rohan Gupta',  empCode: 'EMP009', avatar: 'RG', department: 'Finance',     courseName: 'GDPR & Data Privacy',       category: 'COMPLIANCE', status: 'COMPLETED', score: 90, dueDate: '2026-06-15', mandatory: true },
  { empName: 'Ananya Singh', empCode: 'EMP010', avatar: 'AS', department: 'Engineering', courseName: 'AWS Solutions Architect',   category: 'TECHNICAL',  status: 'IN_PROGRESS',  dueDate: '2026-08-31', mandatory: false },
  { empName: 'Vikram Das',   empCode: 'EMP011', avatar: 'VD', department: 'Sales',       courseName: 'POSH Awareness 2026',       category: 'COMPLIANCE', status: 'COMPLETED', score: 100, dueDate: '2026-06-30', mandatory: true },
];

const STATUS_CFG: Record<TrainingStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  NOT_STARTED: { label: 'Not Started',  color: 'hsl(var(--muted-foreground))', bg: 'hsl(var(--muted))',              icon: <Clock size={11} /> },
  IN_PROGRESS: { label: 'In Progress',  color: 'hsl(var(--primary))',          bg: 'hsl(var(--primary)/0.1)',         icon: <Play size={11} /> },
  COMPLETED:   { label: 'Completed',    color: 'hsl(var(--success))',           bg: 'hsl(var(--success)/0.1)',         icon: <CheckCircle size={11} /> },
  FAILED:      { label: 'Failed',       color: 'hsl(var(--destructive))',       bg: 'hsl(var(--destructive)/0.1)',     icon: <AlertCircle size={11} /> },
};

const CATEGORY_CFG: Record<CourseCategory, { label: string; color: string; bg: string }> = {
  TECHNICAL:   { label: 'Technical',   color: 'hsl(var(--primary))',     bg: 'hsl(var(--primary)/0.1)' },
  COMPLIANCE:  { label: 'Compliance',  color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive)/0.1)' },
  SOFT_SKILLS: { label: 'Soft Skills', color: 'hsl(var(--accent))',      bg: 'hsl(var(--accent)/0.1)' },
  LEADERSHIP:  { label: 'Leadership',  color: 'hsl(var(--warning))',     bg: 'hsl(var(--warning)/0.1)' },
  PRODUCT:     { label: 'Product',     color: 'hsl(var(--teal))',        bg: 'hsl(var(--teal)/0.1)' },
};

// ─── Course Card ──────────────────────────────────────────────────────────────

const CourseCard: React.FC<{ course: TrainingCourse; showEnroll?: boolean; onEnroll?: () => void }> = ({ course, showEnroll, onEnroll }) => {
  const sCfg  = STATUS_CFG[course.status];
  const cCfg  = CATEGORY_CFG[course.category];
  return (
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: cCfg.color, background: cCfg.bg }}>{cCfg.label}</span>
          {course.mandatory && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--destructive))]">Mandatory</span>}
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: sCfg.color, background: sCfg.bg }}>
          {sCfg.icon}{sCfg.label}
        </span>
      </div>
      <h4 className="text-sm font-bold text-[hsl(var(--foreground))] mb-1 line-clamp-2">{course.title}</h4>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 line-clamp-2">{course.description}</p>
      <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] mb-3">
        <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>
        <span className="flex items-center gap-1"><BookOpen size={11} />{course.provider}</span>
      </div>
      {course.status === 'IN_PROGRESS' && (
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
            <div className="h-1.5 rounded-full bg-[hsl(var(--primary))]" style={{ width: '40%' }} />
          </div>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">40% complete · Due {course.dueDate}</p>
        </div>
      )}
      {course.status === 'COMPLETED' && course.score != null && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[hsl(var(--success)/0.07)] mb-3">
          <Star size={12} className="text-[hsl(var(--success))]" />
          <span className="text-xs font-bold text-[hsl(var(--success))]">{course.score}% — Passed</span>
          <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto">{course.completedOn}</span>
        </div>
      )}
      {course.dueDate && course.status !== 'COMPLETED' && course.status !== 'IN_PROGRESS' && (
        <p className="text-[10px] text-[hsl(var(--warning))] mb-2">⚠ Due: {course.dueDate}</p>
      )}
      <div className="flex gap-2">
        {course.status === 'NOT_STARTED' && !showEnroll && (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-xs font-semibold hover:opacity-90 transition-all">
            <Play size={12} />Start
          </button>
        )}
        {course.status === 'IN_PROGRESS' && (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-xs font-semibold hover:opacity-90 transition-all">
            <Play size={12} />Continue
          </button>
        )}
        {course.status === 'COMPLETED' && (
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--foreground))] text-xs font-medium hover:bg-[hsl(var(--muted))] transition-all">
            <FileText size={12} />Certificate
          </button>
        )}
        {showEnroll && (
          <button onClick={onEnroll} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))] text-xs font-semibold hover:bg-[hsl(var(--primary)/0.2)] transition-all border border-[hsl(var(--primary)/0.2)]">
            <Plus size={12} />Enroll
          </button>
        )}
      </div>
    </div>
  );
};

// ─── My Training View ─────────────────────────────────────────────────────────

const MyTrainingView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<TrainingStatus | ''>('');
  const [filterCat, setFilterCat] = useState<CourseCategory | ''>('');

  const filtered = useMemo(() => MY_COURSES.filter(c =>
    (!filterStatus || c.status === filterStatus) &&
    (!filterCat || c.category === filterCat)
  ), [filterStatus, filterCat]);

  const mandatoryOverdue = MY_COURSES.filter(c => c.mandatory && c.status !== 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Completed',    value: MY_COURSES.filter(c => c.status === 'COMPLETED').length,   color: 'var(--success)' },
          { label: 'In Progress',  value: MY_COURSES.filter(c => c.status === 'IN_PROGRESS').length, color: 'var(--primary)' },
          { label: 'Not Started',  value: MY_COURSES.filter(c => c.status === 'NOT_STARTED').length, color: 'var(--muted-foreground)' },
          { label: 'Mandatory Pending', value: mandatoryOverdue.length,                              color: 'var(--destructive)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center shadow-sm">
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {mandatoryOverdue.length > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--destructive)/0.07)] border border-[hsl(var(--destructive)/0.2)]">
          <AlertCircle size={14} className="text-[hsl(var(--destructive))] shrink-0" />
          <p className="text-sm text-[hsl(var(--foreground))]"><strong>{mandatoryOverdue.length} mandatory course{mandatoryOverdue.length > 1 ? 's' : ''}</strong> pending completion.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
          <option value="">All Status</option>
          {(Object.keys(STATUS_CFG) as TrainingStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
          <option value="">All Categories</option>
          {(Object.keys(CATEGORY_CFG) as CourseCategory[]).map(c => <option key={c} value={c}>{CATEGORY_CFG[c].label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => <CourseCard key={c.id} course={c} />)}
        {filtered.length === 0 && (
          <div className="col-span-3 py-12 text-center text-[hsl(var(--muted-foreground))] text-sm">No courses match current filters.</div>
        )}
      </div>
    </div>
  );
};

// ─── Team Training View ───────────────────────────────────────────────────────

const TeamTrainingView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<TrainingStatus | ''>('');

  const filtered = TEAM_TRAINING.filter(r => !filterStatus || r.status === filterStatus);
  const mandatoryPending = TEAM_TRAINING.filter(r => r.mandatory && r.status !== 'COMPLETED').length;

  return (
    <div className="space-y-5">
      {mandatoryPending > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--warning)/0.08)] border border-[hsl(var(--warning)/0.2)]">
          <AlertCircle size={14} className="text-[hsl(var(--warning))] shrink-0" />
          <p className="text-sm text-[hsl(var(--foreground))]"><strong>{mandatoryPending} team member{mandatoryPending > 1 ? 's' : ''}</strong> have overdue mandatory training.</p>
        </div>
      )}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))]">Team Training Progress</h3>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="px-2 py-1.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-xs focus:outline-none">
            <option value="">All Status</option>
            {(Object.keys(STATUS_CFG) as TrainingStatus[]).map(s => <option key={s} value={s}>{STATUS_CFG[s].label}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
                {['Employee', 'Course', 'Category', 'Status', 'Score', 'Due Date', 'Mandatory'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, i) => {
                const sCfg = STATUS_CFG[rec.status];
                const cCfg = CATEGORY_CFG[rec.category];
                return (
                  <tr key={i} className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center text-[10px] font-bold text-[hsl(var(--primary))]">{rec.avatar}</div>
                        <div>
                          <p className="text-sm font-medium text-[hsl(var(--foreground))]">{rec.empName}</p>
                          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{rec.empCode} · {rec.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))] max-w-48"><span className="line-clamp-1">{rec.courseName}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cCfg.color, background: cCfg.bg }}>{cCfg.label}</span></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: sCfg.color, background: sCfg.bg }}>{sCfg.icon}{sCfg.label}</span></td>
                    <td className="px-4 py-3 text-sm font-bold" style={{ color: rec.score ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))' }}>{rec.score ? `${rec.score}%` : '—'}</td>
                    <td className="px-4 py-3 text-xs text-[hsl(var(--foreground))]">{rec.dueDate}</td>
                    <td className="px-4 py-3">{rec.mandatory ? <span className="text-xs font-semibold text-[hsl(var(--destructive))]">Yes</span> : <span className="text-xs text-[hsl(var(--muted-foreground))]">No</span>}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-sm text-[hsl(var(--muted-foreground))]">No records found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Catalog View ─────────────────────────────────────────────────────────────

const CatalogView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [enrolled, setEnrolled] = useState<string[]>([]);

  const filtered = CATALOG_COURSES.filter(c =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search courses by title or provider…" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <CourseCard
            key={c.id}
            course={{ ...c, status: enrolled.includes(c.id) ? 'IN_PROGRESS' : 'NOT_STARTED' }}
            showEnroll={!enrolled.includes(c.id)}
            onEnroll={() => setEnrolled(p => [...p, c.id])}
          />
        ))}
        {filtered.length === 0 && <div className="col-span-3 py-12 text-center text-[hsl(var(--muted-foreground))] text-sm">No courses found for "{search}".</div>}
      </div>
    </div>
  );
};

// ─── Reports View ─────────────────────────────────────────────────────────────

const TrainingReportsView: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      {[
        { label: 'Total Completions (YTD)', value: '842', color: 'var(--success)' },
        { label: 'Avg Completion Rate',     value: '78%', color: 'var(--primary)' },
        { label: 'Mandatory Gap',          value: '34',  color: 'var(--destructive)' },
        { label: 'Avg Score',              value: '84%', color: 'var(--teal)' },
      ].map(s => (
        <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] p-4 text-center shadow-sm">
          <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{s.label}</p>
        </div>
      ))}
    </div>
    <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] p-5 shadow-sm">
      <h3 className="font-bold text-[hsl(var(--foreground))] mb-4">Completion Rate by Category</h3>
      <div className="space-y-3">
        {[
          { label: 'Compliance', pct: 94, color: 'hsl(var(--destructive))' },
          { label: 'Technical',  pct: 72, color: 'hsl(var(--primary))' },
          { label: 'Soft Skills',pct: 81, color: 'hsl(var(--accent))' },
          { label: 'Leadership', pct: 65, color: 'hsl(var(--warning))' },
          { label: 'Product',    pct: 78, color: 'hsl(var(--teal))' },
        ].map(d => (
          <div key={d.label} className="flex items-center gap-3">
            <span className="text-xs text-[hsl(var(--muted-foreground))] w-24 shrink-0">{d.label}</span>
            <div className="flex-1 h-5 rounded-lg bg-[hsl(var(--muted)/0.5)] overflow-hidden">
              <div className="h-5 rounded-lg flex items-center pl-2 transition-all duration-700" style={{ width: `${d.pct}%`, background: d.color }}>
                <span className="text-[10px] font-bold text-white">{d.pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const VIEW_TABS: { key: TrainingView; label: string; icon: React.ReactNode }[] = [
  { key: 'MY_TRAINING',   label: 'My Training',   icon: <BookOpen size={15} /> },
  { key: 'TEAM_TRAINING', label: 'Team Training', icon: <Users size={15} /> },
  { key: 'CATALOG',       label: 'Course Catalog', icon: <Target size={15} /> },
  { key: 'REPORTS',       label: 'Reports',        icon: <BarChart3 size={15} /> },
];

export const TrainingPage: React.FC = () => {
  const [activeView, setActiveView] = useState<TrainingView>('MY_TRAINING');

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--accent)/0.12)]">
            <BookOpen size={22} className="text-[hsl(var(--accent))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Training & Development</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage courses, track progress, and ensure compliance training</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[hsl(var(--muted)/0.5)] rounded-xl p-1 w-fit">
        {VIEW_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveView(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeView === tab.key
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      {activeView === 'MY_TRAINING'   && <MyTrainingView />}
      {activeView === 'TEAM_TRAINING' && <TeamTrainingView />}
      {activeView === 'CATALOG'       && <CatalogView />}
      {activeView === 'REPORTS'       && <TrainingReportsView />}
    </div>
  );
};

export default TrainingPage;
