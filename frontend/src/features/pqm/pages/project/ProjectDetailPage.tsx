import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pqmService } from '../../api/pqmService';
import type { PQMProject } from '../../types';
import toast from 'react-hot-toast';
import { useUsers } from '@/features/iam/users/hooks/useUsers';

import {
  FolderGit2, Edit2, Archive, RotateCcw,
  Info, CheckCircle2, XCircle, Calendar,
  Loader2, ArrowRight, ChevronRight
} from 'lucide-react';

import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { StatusBadge, getEntityStatus } from '@/components/platform/StatusBadge';
import { KpiStrip } from '@/components/platform/KpiStrip';
import { TabBar } from '@/components/platform/TabBar';
import { SectionCard } from '@/components/platform/SectionCard';
import { InfoRow } from '@/components/platform/InfoRow';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { formatIST } from '@/utils/date';

type Tab = 'overview';
const TABS = [
  { id: 'overview' as Tab, label: 'Overview', icon: Info },
];

function ConfirmDialog({
  type,
  project,
  onCancel,
  onConfirm,
  isLoading,
}: {
  type: 'archive' | 'restore';
  project: PQMProject;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  isLoading: boolean;
}) {
  const [reason, setReason] = useState('');
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-black/5 overflow-hidden"
        style={{ animation: 'scaleIn 0.15s ease-out' }}>
        <div className={`h-1 w-full ${type === 'archive' ? 'bg-gradient-to-r from-rose-500 to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`} />
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {type === 'archive' ? 'Archive Project' : 'Restore Project'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {type === 'archive'
              ? 'This project will be archived and hidden from active use.'
              : 'This project will be restored and made active again.'}
          </p>
          <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 ${
            type === 'archive'
              ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
              : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          }`}>
            <EntityAvatar name={project.name} size={36} />
            <div>
              <div className="font-bold text-sm text-gray-900 dark:text-white">{project.name}</div>
              <code className="text-[11px] text-gray-500 dark:text-gray-400">{project.code}</code>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
              Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Reason for ${type === 'archive' ? 'archiving' : 'restoring'}...`}
              rows={2}
              className="block w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 py-2.5 px-3 text-sm text-gray-900 dark:text-white focus:border-violet-500 focus:ring-violet-500 transition-all resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} disabled={isLoading}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => onConfirm(reason)} disabled={isLoading || !reason.trim()}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed ${
                type === 'archive'
                  ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:shadow-rose-500/30 hover:shadow-lg'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-emerald-500/30 hover:shadow-lg'
              }`}>
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                : type === 'archive'
                  ? <><Archive className="h-4 w-4" /> Archive</>
                  : <><RotateCcw className="h-4 w-4" /> Restore</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const ProjectDetailPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [confirmType, setConfirmType] = useState<'archive' | 'restore' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const { data: usersData } = useUsers({ is_active: true, page_size: 1000 });
  const users = useMemo(() => usersData?.results || [], [usersData]);

  const getUserName = useCallback((userId: string | null) => {
    if (!userId) return '-';
    const user = users.find((u) => u.id === userId);
    return user ? `${user.first_name} ${user.last_name}` : userId;
  }, [users]);

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['pqm-project', id],
    queryFn: () => pqmService.getProject(id || ''),
    enabled: !!id
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await pqmService.deleteProject(id, reason);
    }
  });

  const restoreMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await pqmService.restoreProject(id);
    }
  });

  const backUrl = '/pqm/projects';
  const editUrl = `/pqm/projects/${id}/edit`;

  useEffect(() => {
    if (confirmType) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (inInput) return;

      if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        navigate(backUrl);
      }
      if ((e.key === 'e' || e.key === 'E') && project && !project.is_deleted) {
        e.preventDefault();
        navigate(editUrl);
      }
      if ((e.key === 'a' || e.key === 'A') && project) {
        e.preventDefault();
        if (project.is_deleted) setConfirmType('restore');
        else setConfirmType('archive');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [project, confirmType, navigate, backUrl, editUrl]);

  const executeConfirmAction = useCallback(async (reason: string) => {
    if (!project || !confirmType) return;
    setIsConfirming(true);
    try {
      if (confirmType === 'archive') {
        await archiveMutation.mutateAsync({ id: project.id, reason });
        toast.success(`"${project.name}" archived.`);
        queryClient.invalidateQueries({ queryKey: ['pqm-projects'] });
        queryClient.invalidateQueries({ queryKey: ['pqm-project', project.id] });
        navigate(backUrl);
      } else {
        await restoreMutation.mutateAsync({ id: project.id });
        toast.success(`"${project.name}" restored.`);
        queryClient.invalidateQueries({ queryKey: ['pqm-projects'] });
        queryClient.invalidateQueries({ queryKey: ['pqm-project', project.id] });
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Action failed.');
    } finally {
      setIsConfirming(false);
      setConfirmType(null);
    }
  }, [project, confirmType, archiveMutation, navigate, backUrl, queryClient]);

  if (isLoading) return <PageSkeleton />;
  if (isError || !project) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <FolderGit2 className="h-16 w-16 text-gray-300 mb-4" />
      <h2 className="text-xl font-bold text-gray-900">Project not found</h2>
      <button onClick={() => navigate(backUrl)} className="mt-4 text-violet-600 hover:underline">
        Return to Projects
      </button>
    </div>
  );

  const HERO_GRADIENTS = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
    'from-teal-500 to-emerald-600',  'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',     'from-cyan-500 to-blue-500',
  ];
  const grad = HERO_GRADIENTS[project.name.charCodeAt(0) % HERO_GRADIENTS.length] || HERO_GRADIENTS[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-fadeInUp">
      
      {/* Confirm Dialog */}
      {confirmType && (
        <ConfirmDialog
          type={confirmType}
          project={project}
          onCancel={() => setConfirmType(null)}
          onConfirm={executeConfirmAction}
          isLoading={isConfirming}
        />
      )}

      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-1.5 text-sm py-5 text-gray-500 dark:text-gray-400"
        aria-label="Breadcrumb">
        <Link to="/pqm"
          className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
          PQM
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
        <Link to={backUrl}
          className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
          Projects
        </Link>
        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
        <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{project.name}</span>
      </nav>

      {/* Hero Banner */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${grad} px-6 py-5 mt-6 mb-6 shadow-2xl`}>
        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <EntityAvatar name={project.name} size={88} shape="rounded-2xl" className="border-4 border-white/30 shadow-2xl" />
          </div>

          <div className="flex-1 min-w-0 py-2">
            <div className="flex flex-wrap items-center gap-3 mb-1.5">
              <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{project.name}</h1>
              <StatusBadge status={getEntityStatus(project.is_deleted, project.is_active)} />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/80 font-medium">
              <code className="rounded-lg bg-white/15 backdrop-blur-sm px-2.5 py-1 font-mono font-bold text-white shadow-sm ring-1 ring-white/20">
                {project.code || 'NO-CODE'}
              </code>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 ml-auto">
            <button
              onClick={() => navigate(`/pqm/nc-management/${project.id}`)}
              title="Enter Workspace"
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-violet-700 hover:-translate-y-0.5 transition-all ring-1 ring-white/20"
            >
              Enter Workspace <ArrowRight className="h-4 w-4" />
            </button>

            {!project.is_deleted && (
              <PermissionGate permission="pqm.project.update">
                <Link to={editUrl}
                  title="Edit Project (E)"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                  <Edit2 className="h-4 w-4" />
                  <span>Edit <kbd className="hidden sm:inline-flex items-center rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white/70">E</kbd></span>
                </Link>
              </PermissionGate>
            )}

            {project.is_deleted ? (
              <PermissionGate permission="pqm.project.restore">
                <button
                  onClick={() => setConfirmType('restore')}
                  title="Restore Project (A)"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                  <RotateCcw className="h-4 w-4" /> Restore
                </button>
              </PermissionGate>
            ) : (
              <PermissionGate permission="pqm.project.delete">
                <button
                  onClick={() => setConfirmType('archive')}
                  title="Archive Project (A)"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                  <Archive className="h-4 w-4" /> Archive
                </button>
              </PermissionGate>
            )}
          </div>
        </div>
      </div>

        {/* KPI Strip */}
        <KpiStrip
          className="mb-5 animate-fadeInUp delay-50"
          items={[
            { icon: FolderGit2, label: 'Capacity', value: project.capacity || '-', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            {
              icon: project.is_active && !project.is_deleted ? CheckCircle2 : XCircle,
              label: 'Status',
              value: project.is_deleted ? 'Archived' : project.is_active ? 'Active' : 'Inactive',
              color: project.is_deleted ? 'text-rose-600 dark:text-rose-400' : project.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
              bg: project.is_deleted ? 'bg-rose-50 dark:bg-rose-900/20' : project.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20',
            },
            {
              icon: Calendar,
              label: 'Created',
              value: project.created_at ? formatIST(project.created_at, 'dd MMM yyyy') : '-',
              color: 'text-gray-600 dark:text-gray-400',
              bg: 'bg-gray-50 dark:bg-gray-800/50',
            },
          ]}
        />

        {/* Tab Bar */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl mb-5 animate-fadeInDown delay-100">
          <TabBar
            tabs={TABS}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as Tab)}
          />
        </div>

        {/* Tab Content */}
        <div className="animate-fadeInUp delay-150">
          {activeTab === 'overview' && (
            <div role="tabpanel" className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <SectionCard title="Project Info" icon={Info} iconColor="text-violet-500">
                <InfoRow icon={FolderGit2} label="Project Name">{project.name}</InfoRow>
                <InfoRow icon={FolderGit2} label="Location">{project.location || '-'}</InfoRow>
                <InfoRow icon={FolderGit2} label="Description" last>
                  <p className="whitespace-pre-wrap">{project.description || '-'}</p>
                </InfoRow>
              </SectionCard>

              <SectionCard title="Timeline & Stats" icon={Calendar} iconColor="text-blue-500">
                <InfoRow icon={Calendar} label="Start Date">{project.project_start_date ? formatIST(project.project_start_date, 'dd MMM yyyy') : '-'}</InfoRow>
                <InfoRow icon={Calendar} label="Expected End Date" last>{project.expected_project_end_date ? formatIST(project.expected_project_end_date, 'dd MMM yyyy') : '-'}</InfoRow>
              </SectionCard>
              
              <SectionCard title="Key Personnel" icon={Info} iconColor="text-emerald-500">
                <InfoRow icon={Info} label="Project Head">{getUserName(project.project_head_id)}</InfoRow>
                <InfoRow icon={Info} label="Quality Head">{getUserName(project.quality_head_id)}</InfoRow>
                <InfoRow icon={Info} label="Construction Incharge">{getUserName(project.construction_incharge_id)}</InfoRow>
                <InfoRow icon={Info} label="Quality Incharge" last>{getUserName(project.quality_incharge_id)}</InfoRow>
              </SectionCard>

            </div>
          )}
        </div>
      </div>
  );
};

export default ProjectDetailPage;
