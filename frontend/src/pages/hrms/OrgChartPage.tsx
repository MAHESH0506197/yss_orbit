// yss_orbit\frontend\src\pages\hrms\OrgChartPage.tsx
import React, { useState } from 'react';
import { Users, Search, ZoomIn, ZoomOut, ChevronDown, ChevronRight, Mail, Phone } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrgNode {
  id: string;
  name: string;
  empCode: string;
  designation: string;
  department: string;
  email: string;
  avatar: string;   // initials
  children?: OrgNode[];
}

// ─── Mock Org Tree ────────────────────────────────────────────────────────────

const ORG_TREE: OrgNode = {
  id: 'n1', name: 'Arjun Sharma', empCode: 'EMP001', designation: 'CEO', department: 'Executive',
  email: 'arjun@company.com', avatar: 'AS',
  children: [
    {
      id: 'n2', name: 'Priya Nair', empCode: 'EMP002', designation: 'VP Engineering', department: 'Engineering',
      email: 'priya@company.com', avatar: 'PN',
      children: [
        {
          id: 'n4', name: 'Rahul Kumar', empCode: 'EMP010', designation: 'Engineering Manager', department: 'Engineering',
          email: 'rahul@company.com', avatar: 'RK',
          children: [
            { id: 'n7', name: 'Suresh Rajan', empCode: 'EMP020', designation: 'Lead Engineer', department: 'Engineering', email: 's.rajan@company.com', avatar: 'SR', children: [] },
            { id: 'n8', name: 'Ananya Patel', empCode: 'EMP021', designation: 'Senior SDE', department: 'Engineering', email: 'a.patel@company.com', avatar: 'AP', children: [] },
            { id: 'n9', name: 'Vikram Singh', empCode: 'EMP022', designation: 'SDE', department: 'Engineering', email: 'v.singh@company.com', avatar: 'VS', children: [] },
          ],
        },
        { id: 'n5', name: 'Deepa Reddy', empCode: 'EMP011', designation: 'QA Lead', department: 'QA', email: 'd.reddy@company.com', avatar: 'DR', children: [] },
      ],
    },
    {
      id: 'n3', name: 'Sneha Kapoor', empCode: 'EMP003', designation: 'CHRO', department: 'HR',
      email: 'sneha@company.com', avatar: 'SK',
      children: [
        { id: 'n6', name: 'Meena Joshi', empCode: 'EMP012', designation: 'HR Manager', department: 'HR', email: 'm.joshi@company.com', avatar: 'MJ', children: [] },
      ],
    },
    {
      id: 'n10', name: 'Vikram Mehta', empCode: 'EMP004', designation: 'CFO', department: 'Finance',
      email: 'vikram@company.com', avatar: 'VM',
      children: [
        { id: 'n11', name: 'Kavita Rao', empCode: 'EMP013', designation: 'Finance Manager', department: 'Finance', email: 'k.rao@company.com', avatar: 'KR', children: [] },
      ],
    },
  ],
};

const DEPT_COLORS: Record<string, string> = {
  Executive: '#2563eb', Engineering: '#0d9488', HR: '#7c3aed',
  Finance: '#ea580c', QA: '#dc2626', Sales: '#16a34a',
};

// ─── Node Card ────────────────────────────────────────────────────────────────

const OrgNodeCard: React.FC<{
  node: OrgNode; depth: number;
  selectedId: string | null; onSelect: (n: OrgNode) => void;
}> = ({ node, depth, selectedId, onSelect }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const color = DEPT_COLORS[node.department] || '#6b7280';
  const isSelected = selectedId === node.id;

  return (
    <div className="flex flex-col items-center">
      {/* Card */}
      <div
        onClick={() => onSelect(node)}
        className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 w-44 ${isSelected ? 'shadow-lg -translate-y-1' : 'shadow-sm'}`}
        style={{
          borderColor: isSelected ? color : 'hsl(var(--border))',
          background: isSelected ? `${color}08` : 'hsl(var(--card))',
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 rounded-t-2xl" style={{ background: color }} />
        <div className="p-3 text-center">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-sm font-bold text-white shadow-sm" style={{ background: color }}>
            {node.avatar}
          </div>
          <p className="text-xs font-bold text-[hsl(var(--foreground))] truncate">{node.name}</p>
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate mt-0.5">{node.designation}</p>
          <p className="text-[9px] font-mono text-[hsl(var(--muted-foreground))]">{node.empCode}</p>
        </div>
        {/* Expand toggle */}
        {hasChildren && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(ex => !ex); }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow flex items-center justify-center hover:bg-[hsl(var(--muted))] transition-colors z-10"
          >
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="mt-6 relative">
          {/* Vertical connector */}
          <div className="absolute top-0 left-1/2 -translate-x-px w-px h-4 bg-[hsl(var(--border))]" />
          {/* Horizontal connector */}
          {node.children!.length > 1 && (
            <div className="absolute top-4 left-[calc(50%/var(--children))] right-[calc(50%/var(--children))] h-px bg-[hsl(var(--border))]"
              style={{ left: `calc(100% / ${node.children!.length} / 2)`, right: `calc(100% / ${node.children!.length} / 2)` }}
            />
          )}
          <div className="flex gap-6 pt-4">
            {node.children!.map(child => (
              <div key={child.id} className="flex flex-col items-center relative">
                {/* Vertical connector to parent */}
                <div className="absolute top-0 left-1/2 -translate-x-px w-px h-4 bg-[hsl(var(--border))]" style={{ top: '-16px' }} />
                <OrgNodeCard node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const OrgChartPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [zoom, setZoom] = useState(100);

  const color = selectedNode ? DEPT_COLORS[selectedNode.department] || '#6b7280' : '';

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[hsl(var(--primary)/0.12)]">
            <Users size={22} className="text-[hsl(var(--primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Org Chart</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Organisational hierarchy and reporting structure</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee…" className="pl-8 pr-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.3)] w-48" />
          </div>
          <div className="flex items-center gap-1 bg-[hsl(var(--muted))] rounded-xl p-1">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 rounded-lg hover:bg-[hsl(var(--card))] transition-colors"><ZoomOut size={14} /></button>
            <span className="text-xs font-medium text-[hsl(var(--foreground))] w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1.5 rounded-lg hover:bg-[hsl(var(--card))] transition-colors"><ZoomIn size={14} /></button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Chart Area */}
        <div className="flex-1 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-auto p-8 min-h-[600px]">
          <div className="flex justify-center" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
            <OrgNodeCard node={ORG_TREE} depth={0} selectedId={selectedNode?.id || null} onSelect={setSelectedNode} />
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="w-72 shrink-0 bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-sm overflow-hidden">
            <div className="h-1.5" style={{ background: color }} />
            <div className="p-5">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md mb-3" style={{ background: color }}>
                  {selectedNode.avatar}
                </div>
                <p className="font-bold text-[hsl(var(--foreground))]">{selectedNode.name}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedNode.designation}</p>
                <span className="mt-2 text-xs px-2.5 py-0.5 rounded-full font-medium text-white" style={{ background: color }}>
                  {selectedNode.department}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Employee Code', value: selectedNode.empCode },
                  { label: 'Department', value: selectedNode.department },
                ].map(f => (
                  <div key={f.label} className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--muted-foreground))]">{f.label}</span>
                    <span className="font-medium text-[hsl(var(--foreground))]">{f.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                <a href={`mailto:${selectedNode.email}`} className="flex items-center gap-2 text-sm text-[hsl(var(--primary))] hover:opacity-80 transition-opacity">
                  <Mail size={14} />{selectedNode.email}
                </a>
              </div>
              {selectedNode.children && selectedNode.children.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-2">Direct Reports ({selectedNode.children.length})</p>
                  {selectedNode.children.map(c => (
                    <div key={c.id} className="flex items-center gap-2 py-1.5 cursor-pointer hover:bg-[hsl(var(--muted)/0.5)] rounded-lg px-2 transition-colors" onClick={() => setSelectedNode(c)}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: DEPT_COLORS[c.department] || '#6b7280' }}>{c.avatar}</div>
                      <div>
                        <p className="text-xs font-medium text-[hsl(var(--foreground))]">{c.name}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{c.designation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgChartPage;
