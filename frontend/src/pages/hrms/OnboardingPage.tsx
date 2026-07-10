// yss_orbit\frontend\src\pages\hrms\OnboardingPage.tsx
import React, { useState } from 'react';
import {
  CheckCircle, Clock, Circle, AlertCircle,
  User, FileText, Laptop, Users, BookOpen,
  ChevronRight, Search, Plus, Eye,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';
type OnboardingStatus = 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

interface OnboardingTask {
  id: string;
  title: string;
  category: string;
  assignedTo: string;
  dueDate: string;
  status: TaskStatus;
}

interface OnboardingRecord {
  id: string;
  employeeName: string;
  empCode: string;
  designation: string;
  department: string;
  joinDate: string;
  templateName: string;
  totalTasks: number;
  completedTasks: number;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_ONBOARDINGS: OnboardingRecord[] = [
  {
    id: 'ob1', employeeName: 'Kiran Rao', empCode: 'EMP045', designation: 'Software Engineer',
    department: 'Engineering', joinDate: '2026-06-10', templateName: 'Standard Tech Onboarding',
    totalTasks: 8, completedTasks: 5, status: 'IN_PROGRESS',
    tasks: [
      { id: 't1', title: 'Complete Personal & Banking Details', category: 'HR', assignedTo: 'Employee', dueDate: '2026-06-11', status: 'COMPLETED' },
      { id: 't2', title: 'ID Card & Access Card Issuance', category: 'Admin', assignedTo: 'Admin Team', dueDate: '2026-06-11', status: 'COMPLETED' },
      { id: 't3', title: 'Laptop + Equipment Setup', category: 'IT', assignedTo: 'IT Team', dueDate: '2026-06-11', status: 'COMPLETED' },
      { id: 't4', title: 'System Accounts (Email, Slack, GitHub)', category: 'IT', assignedTo: 'IT Team', dueDate: '2026-06-12', status: 'COMPLETED' },
      { id: 't5', title: 'HR Policy & Code of Conduct Acknowledgement', category: 'HR', assignedTo: 'Employee', dueDate: '2026-06-12', status: 'COMPLETED' },
      { id: 't6', title: 'Engineering Codebase Walkthrough', category: 'Manager', assignedTo: 'Reporting Manager', dueDate: '2026-06-13', status: 'IN_PROGRESS' },
      { id: 't7', title: 'Team Introduction Meeting', category: 'Manager', assignedTo: 'Reporting Manager', dueDate: '2026-06-14', status: 'PENDING' },
      { id: 't8', title: 'Probation Review Scheduled', category: 'HR', assignedTo: 'HR Team', dueDate: '2026-09-10', status: 'PENDING' },
    ],
  },
  {
    id: 'ob2', employeeName: 'Meena Pillai', empCode: 'EMP046', designation: 'HR Executive',
    department: 'HR', joinDate: '2026-06-03', templateName: 'Standard HR Onboarding',
    totalTasks: 7, completedTasks: 7, status: 'COMPLETED',
    tasks: [],
  },
  {
    id: 'ob3', employeeName: 'Rohan Gupta', empCode: 'EMP047', designation: 'Finance Analyst',
    department: 'Finance', joinDate: '2026-05-28', templateName: 'Standard Finance Onboarding',
    totalTasks: 9, completedTasks: 3, status: 'OVERDUE',
    tasks: [],
  },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  HR: <User size={13} />, Admin: <FileText size={13} />, IT: <Laptop size={13} />,
  Manager: <Users size={13} />, Training: <BookOpen size={13} />,
};

const TASK_STATUS_CFG: Record<TaskStatus, { icon: React.ReactNode; color: string; label: string }> = {
  COMPLETED:   { icon: <CheckCircle size={14} />, color: 'hsl(var(--success))',     label: 'Done' },
  IN_PROGRESS: { icon: <Clock size={14} />,       color: 'hsl(var(--primary))',     label: 'In Progress' },
  PENDING:     { icon: <Circle size={14} />,      color: 'hsl(var(--muted-foreground))', label: 'Pending' },
  BLOCKED:     { icon: <AlertCircle size={14} />, color: 'hsl(var(--destructive))', label: 'Blocked' },
};

const OB_STATUS_CFG: Record<OnboardingStatus, { color: string; bg: string; label: string }> = {
  IN_PROGRESS: { color: 'hsl(var(--primary))', bg: 'hsl(var(--primary)/0.1)',     label: 'In Progress' },
  COMPLETED:   { color: 'hsl(var(--success))', bg: 'hsl(var(--success)/0.1)',     label: 'Completed' },
  OVERDUE:     { color: 'hsl(var(--destructive))', bg: 'hsl(var(--destructive)/0.1)', label: 'Overdue' },
};

// ─── Task List ────────────────────────────────────────────────────────────────

const TaskList: React.FC<{ tasks: OnboardingTask[] }> = ({ tasks }) => (
  <div className="space-y-2 mt-4">
    {tasks.map(task => {
      const cfg = TASK_STATUS_CFG[task.status];
      return (
        <div key={task.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${task.status === 'COMPLETED' ? 'opacity-60 bg-[hsl(var(--muted)/0.3)] border-[hsl(var(--border))]' : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:shadow-sm'}`}>
          <span style={{ color: cfg.color }}>{cfg.icon}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through text-[hsl(var(--muted-foreground))]' : 'text-[hsl(var(--foreground))]'}`}>{task.title}</p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{CATEGORY_ICONS[task.category]} </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{task.category} • {task.assignedTo}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Due: {task.dueDate}</span>
            </div>
          </div>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: `${cfg.color}18` }}>{cfg.label}</span>
        </div>
      );
    })}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

export const OnboardingPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OnboardingRecord | null>(MOCK_ONBOARDINGS[0] ?? null);

  const filtered = MOCK_ONBOARDINGS.filter(ob =>
    !search || ob.employeeName.toLowerCase().includes(search.toLowerCase()) || ob.empCode.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: MOCK_ONBOARDINGS.length,
    inProgress: MOCK_ONBOARDINGS.filter(o => o.status === 'IN_PROGRESS').length,
    completed: MOCK_ONBOARDINGS.filter(o => o.status === 'COMPLETED').length,
    overdue: MOCK_ONBOARDINGS.filter(o => o.status === 'OVERDUE').length,
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--success)/0.12)]">
            <CheckCircle size={22} className="text-[hsl(var(--success))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Onboarding</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Track new joiner onboarding progress and tasks</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 shadow-md shadow-[hsl(var(--primary)/0.3)]">
          <Plus size={16} />Initiate Onboarding
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Active', value: stats.total, color: 'var(--primary)' },
          { label: 'In Progress', value: stats.inProgress, color: 'var(--teal)' },
          { label: 'Completed', value: stats.completed, color: 'var(--success)' },
          { label: 'Overdue', value: stats.overdue, color: 'var(--destructive)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: `hsl(${s.color})` }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* List */}
        <div className="xl:col-span-1 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" className="w-full pl-8 pr-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          {filtered.map(ob => {
            const cfg = OB_STATUS_CFG[ob.status];
            const pct = Math.round((ob.completedTasks / ob.totalTasks) * 100);
            return (
              <div
                key={ob.id}
                onClick={() => setSelected(ob)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 hover:shadow-md ${selected?.id === ob.id ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.04)] shadow-sm' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm text-[hsl(var(--foreground))]">{ob.employeeName}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{ob.designation} • {ob.empCode}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>{cfg.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 rounded-full bg-[hsl(var(--muted))]">
                    <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">{pct}%</span>
                </div>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{ob.completedTasks}/{ob.totalTasks} tasks • Joined {ob.joinDate}</p>
              </div>
            );
          })}
        </div>

        {/* Detail */}
        {selected && (
          <div className="xl:col-span-2 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[hsl(var(--border))]">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-[hsl(var(--foreground))]">{selected.employeeName}</h2>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{selected.designation} Â· {selected.department} Â· {selected.empCode}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Template: <span className="font-medium text-[hsl(var(--foreground))]">{selected.templateName}</span> • Join Date: {selected.joinDate}</p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: OB_STATUS_CFG[selected.status].color, background: OB_STATUS_CFG[selected.status].bg }}>
                  {OB_STATUS_CFG[selected.status].label}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-[hsl(var(--muted-foreground))] mb-1.5">
                  <span>{selected.completedTasks} of {selected.totalTasks} tasks complete</span>
                  <span>{Math.round((selected.completedTasks / selected.totalTasks) * 100)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[hsl(var(--muted))]">
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(selected.completedTasks / selected.totalTasks) * 100}%`, background: OB_STATUS_CFG[selected.status].color }} />
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] mb-2">Onboarding Tasks</h3>
              {selected.tasks.length > 0 ? (
                <TaskList tasks={selected.tasks} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
                  <CheckCircle size={36} className="mb-3 opacity-40" />
                  <p className="text-sm">All tasks completed for this employee.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;

