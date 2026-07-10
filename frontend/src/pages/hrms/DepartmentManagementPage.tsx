// yss_orbit\frontend\src\pages\hrms\DepartmentManagementPage.tsx
import React, { useState } from 'react';
import {
  Building2, Plus, Search, Edit2, Trash2, ChevronRight,
  Users, FolderTree, X, Check, AlertCircle,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  headName: string;
  headEmpCode: string;
  employeeCount: number;
  isActive: boolean;
  children?: Department[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Engineering', code: 'ENG', parentId: null, headName: 'Rajesh Kumar', headEmpCode: 'EMP001', employeeCount: 42, isActive: true },
  { id: 'd2', name: 'Frontend Engineering', code: 'ENG-FE', parentId: 'd1', headName: 'Priya Singh', headEmpCode: 'EMP012', employeeCount: 14, isActive: true },
  { id: 'd3', name: 'Backend Engineering', code: 'ENG-BE', parentId: 'd1', headName: 'Arjun Nair', headEmpCode: 'EMP015', employeeCount: 18, isActive: true },
  { id: 'd4', name: 'DevOps', code: 'ENG-DO', parentId: 'd1', headName: 'Kiran Mehta', headEmpCode: 'EMP019', employeeCount: 6, isActive: true },
  { id: 'd5', name: 'QA', code: 'ENG-QA', parentId: 'd1', headName: 'Deepa Rajan', headEmpCode: 'EMP022', employeeCount: 4, isActive: true },
  { id: 'd6', name: 'Human Resources', code: 'HR', parentId: null, headName: 'Sneha Patel', headEmpCode: 'EMP004', employeeCount: 8, isActive: true },
  { id: 'd7', name: 'Talent Acquisition', code: 'HR-TA', parentId: 'd6', headName: 'Meena Kapoor', headEmpCode: 'EMP031', employeeCount: 3, isActive: true },
  { id: 'd8', name: 'Finance', code: 'FIN', parentId: null, headName: 'Vikram Sharma', headEmpCode: 'EMP003', employeeCount: 12, isActive: true },
  { id: 'd9', name: 'Sales & Marketing', code: 'SAL', parentId: null, headName: 'Ananya Reddy', headEmpCode: 'EMP007', employeeCount: 19, isActive: true },
  { id: 'd10', name: 'Operations', code: 'OPS', parentId: null, headName: 'Suresh Nair', headEmpCode: 'EMP009', employeeCount: 11, isActive: true },
];

// ─── Build Tree ───────────────────────────────────────────────────────────────

function buildTree(depts: Department[]): Department[] {
  const map = new Map<string, Department>();
  depts.forEach(d => map.set(d.id, { ...d, children: [] }));
  const roots: Department[] = [];
  map.forEach(d => {
    if (d.parentId && map.has(d.parentId)) {
      map.get(d.parentId)!.children!.push(d);
    } else {
      roots.push(d);
    }
  });
  return roots;
}

// ─── Dept Row (recursive) ────────────────────────────────────────────────────

const DeptRow: React.FC<{
  dept: Department; depth: number;
  onEdit: (d: Department) => void; onDelete: (d: Department) => void;
}> = ({ dept, depth, onEdit, onDelete }) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <>
      <tr className="border-b border-[hsl(var(--border))] hover:bg-[hsl(var(--muted)/0.3)] transition-colors group">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 24}px` }}>
            {hasChildren ? (
              <button onClick={() => setExpanded(e => !e)} className="p-0.5 rounded hover:bg-[hsl(var(--muted))]">
                <ChevronRight size={14} className={`text-[hsl(var(--muted-foreground))] transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>
            ) : (
              <span className="w-5" />
            )}
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${depth === 0 ? 'bg-[hsl(var(--primary)/0.12)]' : 'bg-[hsl(var(--muted))]'}`}>
                <Building2 size={13} className={depth === 0 ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'} />
              </div>
              <div>
                <p className="text-sm font-medium text-[hsl(var(--foreground))]">{dept.name}</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono">{dept.code}</p>
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-sm text-[hsl(var(--muted-foreground))]">
          <div>
            <p className="font-medium text-[hsl(var(--foreground))]">{dept.headName}</p>
            <p className="text-xs font-mono">{dept.headEmpCode}</p>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5 text-sm">
            <Users size={13} className="text-[hsl(var(--muted-foreground))]" />
            <span className="font-medium text-[hsl(var(--foreground))]">{dept.employeeCount}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${dept.isActive ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dept.isActive ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--muted-foreground))]'}`} />
            {dept.isActive ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(dept)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
              <Edit2 size={13} />
            </button>
            <button onClick={() => onDelete(dept)} className="p-1.5 rounded-lg hover:bg-[hsl(var(--destructive)/0.1)] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </td>
      </tr>
      {hasChildren && expanded && dept.children!.map(child => (
        <DeptRow key={child.id} dept={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

const DeptModal: React.FC<{
  dept: Partial<Department> | null; depts: Department[];
  onClose: () => void; onSave: (d: Partial<Department>) => void;
}> = ({ dept, depts, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<Department>>(dept || { isActive: true });
  const isEdit = !!dept?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-md border border-[hsl(var(--border))]">
        <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--border))]">
          <h3 className="font-bold text-[hsl(var(--foreground))]">{isEdit ? 'Edit' : 'New'} Department</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Department Name *</label>
            <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Engineering" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Department Code *</label>
            <input value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. ENG" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Parent Department</label>
            <select value={form.parentId || ''} onChange={e => setForm(f => ({ ...f, parentId: e.target.value || null }))} className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]">
              <option value="">— Root Department —</option>
              {depts.filter(d => !d.parentId && d.id !== form.id).map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-1.5">Department Head (Employee Code)</label>
            <input value={form.headEmpCode || ''} onChange={e => setForm(f => ({ ...f, headEmpCode: e.target.value }))} placeholder="e.g. EMP001" className="w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Active</span>
          </label>
        </div>
        <div className="flex gap-3 p-5 border-t border-[hsl(var(--border))]">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
          <button onClick={() => onSave(form)} className="flex-1 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity">
            <span className="flex items-center justify-center gap-2"><Check size={14} />{isEdit ? 'Update' : 'Create'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const DepartmentManagementPage: React.FC = () => {
  const [depts, setDepts] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ dept: Partial<Department> | null } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const filtered = search
    ? depts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()))
    : depts;

  const tree = buildTree(filtered);
  const totalEmployees = depts.reduce((s, d) => s + d.employeeCount, 0);
  const rootDepts = depts.filter(d => !d.parentId).length;
  const subDepts = depts.filter(d => d.parentId).length;

  const handleSave = (form: Partial<Department>) => {
    if (form.id) {
      setDepts(ds => ds.map(d => d.id === form.id ? { ...d, ...form } as Department : d));
    } else {
      const newDept: Department = {
        id: `d${Date.now()}`, name: form.name!, code: form.code!,
        parentId: form.parentId || null, headName: '—', headEmpCode: form.headEmpCode || '—',
        employeeCount: 0, isActive: form.isActive ?? true,
      };
      setDepts(ds => [...ds, newDept]);
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setDepts(ds => ds.filter(d => d.id !== deleteTarget.id && d.parentId !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.12)]">
            <FolderTree size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Department Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Manage organisational hierarchy and department structure</p>
          </div>
        </div>
        <button onClick={() => setModal({ dept: null })} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-[hsl(var(--primary)/0.3)]">
          <Plus size={16} />New Department
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Departments', value: depts.length, icon: <Building2 size={18} />, color: 'var(--primary)' },
          { label: 'Root Departments', value: rootDepts, icon: <FolderTree size={18} />, color: 'var(--accent)' },
          { label: 'Sub-Departments', value: subDepts, icon: <ChevronRight size={18} />, color: 'var(--teal)' },
          { label: 'Total Employees', value: totalEmployees, icon: <Users size={18} />, color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="bg-[hsl(var(--card))] rounded-xl p-4 border border-[hsl(var(--border))] shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{s.label}</p>
              <div className="p-1.5 rounded-lg" style={{ background: `hsl(${s.color}/0.12)`, color: `hsl(${s.color})` }}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search departments…" className="w-full pl-9 pr-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)]" />
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.4)]">
              {['Department', 'Head', 'Employees', 'Status', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tree.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[hsl(var(--muted-foreground))]">No departments found.</td></tr>
            ) : tree.map(dept => (
              <DeptRow key={dept.id} dept={dept} depth={0}
                onEdit={d => setModal({ dept: d })}
                onDelete={d => setDeleteTarget(d)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {modal && (
        <DeptModal dept={modal.dept} depts={depts} onClose={() => setModal(null)} onSave={handleSave} />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[hsl(var(--card))] rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-[hsl(var(--border))]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[hsl(var(--destructive)/0.12)]"><AlertCircle size={20} className="text-[hsl(var(--destructive))]" /></div>
              <h3 className="font-bold text-[hsl(var(--foreground))]">Delete Department</h3>
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Are you sure you want to delete <strong className="text-[hsl(var(--foreground))]">{deleteTarget.name}</strong>? All sub-departments will also be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 rounded-xl border border-[hsl(var(--border))] text-sm font-medium hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2 rounded-xl bg-[hsl(var(--destructive))] text-white text-sm font-medium hover:opacity-90 transition-opacity">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagementPage;
