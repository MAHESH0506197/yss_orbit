import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, ChevronRight, Building2, Edit2, Archive, RotateCcw,
  CheckCircle2, XCircle, Users, Calendar,
  Clock, Fingerprint, Code2, FileText, Activity, ShieldAlert,
  Loader2, AlertTriangle, RefreshCcw, Copy, Check, Trash2,
  LayoutGrid, Info, History, Eye, ImagePlus, Globe2, MapPin, Mail, Phone, ShieldCheck, Palette, Package
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useBusinessUnit, useDeleteBusinessUnit, useRestoreBusinessUnit, useUpdateBusinessUnit } from '../hooks/useBusinessUnits';
import { businessUnitApi } from '../api/businessUnitApi';
import { getBusinessUnitStatus } from '../types/businessUnitTypes';
import { PermissionGate } from '@/components/auth/PermissionGate';
import { CopyButton } from '@/components/ui/CopyButton';
import { EntityAvatar } from '@/components/platform/EntityAvatar';
import { CopyChip } from '@/components/platform/CopyChip';
import { SectionCard } from '@/components/platform/SectionCard';
import { TabBar } from '@/components/platform/TabBar';
import { KpiStrip } from '@/components/platform/KpiStrip';
import { PageSkeleton } from '@/components/platform/PageSkeleton';
import { formatIST } from '@/utils/date';

export const BusinessUnitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: bu, isLoading, isError } = useBusinessUnit(id as string);
  const { mutateAsync: deleteBu, isPending: isDeleting } = useDeleteBusinessUnit();
  const { mutateAsync: restoreBu, isPending: isRestoring } = useRestoreBusinessUnit();

  const [activeTab, setActiveTab] = useState<'overview' | 'audit'>('overview');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');
  const [showPermanentDelete, setShowPermanentDelete] = useState(false);
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState('');
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);
  const { mutateAsync: updateBu } = useUpdateBusinessUnit();

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'Escape') {
        if (showArchiveConfirm) setShowArchiveConfirm(false);
        else if (showPermanentDelete) setShowPermanentDelete(false);
        else navigate('/platform/business-units');
      }
      if (e.key === 'e' || e.key === 'E') navigate(`/platform/business-units/${id}/edit`);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, id, showArchiveConfirm, showPermanentDelete]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (isError || !bu) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center">
        <div className="rounded-full bg-rose-100 p-4 dark:bg-rose-900/20 mb-4">
          <ShieldAlert className="h-8 w-8 text-rose-600 dark:text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Business Unit Not Found</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-md">The requested business unit could not be found. It may have been permanently deleted.</p>
        <button onClick={() => navigate('/platform/business-units')} className="mt-6 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition-colors">
          Back to Directory
        </button>
      </div>
    );
  }

  const status = getBusinessUnitStatus(bu);
  const isDeleted = status === 'deleted';
  const isActive = status === 'active';

  // Hero gradient derived from name (uses shared EntityAvatar palette)
  const HERO_GRADIENTS = [
    'from-violet-500 to-purple-600', 'from-blue-500 to-indigo-600',
    'from-teal-500 to-emerald-600',  'from-amber-500 to-orange-500',
    'from-pink-500 to-rose-500',     'from-cyan-500 to-blue-500',
  ];
  const grad = HERO_GRADIENTS[bu.name.charCodeAt(0) % HERO_GRADIENTS.length];

  // Tab definitions
  const BU_TABS = [
    { id: 'overview', label: 'Overview',    icon: LayoutGrid },
    { id: 'audit',    label: 'Audit Trail', icon: History    },
  ];

  // KPI strip items
  const kpiItems = [
    { icon: Users,      label: 'Total Users',   value: bu.users_count || 0,  color: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { icon: ShieldAlert,label: 'Roles',         value: bu.roles_count || 0,  color: 'text-fuchsia-600 dark:text-fuchsia-400', bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20' },
    { icon: Calendar,   label: 'Created',       value: formatIST(bu.created_at, 'MMM d, yyyy'),  color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  ];

  const handleArchive = async () => {
    try {
      await deleteBu({ id: bu.id, reason: archiveReason || undefined });
      setShowArchiveConfirm(false);
      setArchiveReason('');
    } catch (err) {}
  };

  const handleRestore = async () => {
    try {
      await restoreBu({ id: bu.id });
    } catch (err) {}
  };

  // C-03 FIX: Permanent delete handler — was missing entirely, making the confirm button non-functional.
  // Requires typing the BU name to confirm (prevents accidental hard deletes).
  const handlePermanentDelete = async () => {
    if (permanentDeleteConfirm !== bu.name) {
      toast.error('Name does not match. Permanent delete cancelled.');
      return;
    }
    setIsPermanentlyDeleting(true);
    try {
      await businessUnitApi.permanentDelete(bu.id);
      toast.success(`"${bu.name}" permanently deleted.`);
      navigate('/platform/business-units');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to permanently delete.');
    } finally {
      setIsPermanentlyDeleting(false);
      setShowPermanentDelete(false);
      setPermanentDeleteConfirm('');
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 animate-fadeInUp">

        {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
        <nav className="flex items-center gap-1.5 text-sm py-5 text-gray-500 dark:text-gray-400"
          aria-label="Breadcrumb">
          <Link to="/platform"
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            Platform
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <Link to="/platform/business-units"
            className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors font-medium">
            Business Units
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">{bu.name}</span>
        </nav>

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${grad} px-6 py-5 mb-5 shadow-2xl`}>
          <div className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-black/10 blur-2xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="absolute top-0 right-0 flex items-center gap-2">
              <Link to="/platform/business-units" aria-label="Back to Business Units (←)"
                title="Back to list (← or Backspace)"
                className="flex items-center gap-1.5 rounded-xl bg-white/15 backdrop-blur-sm px-3 py-2 text-xs font-bold text-white hover:bg-white/25 transition-all ring-1 ring-white/20">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Link>
            </div>

            <div className="relative mt-6 sm:mt-0">
              <EntityAvatar name={bu.name} logoUrl={bu.logo_url || null} size={88} shape="rounded-2xl" className="border-4 border-white/30 shadow-2xl" />
              {!isDeleted && isActive && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-white dark:ring-gray-900 shadow">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-pulseRing" />
                  <CheckCircle2 className="h-3 w-3 text-white relative z-10" />
                </span>
              )}
              {isDeleted && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-400 ring-2 ring-white dark:ring-gray-900 shadow">
                  <Archive className="h-3 w-3 text-white" />
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl font-black text-white tracking-tight leading-tight">{bu.name}</h1>
                <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${isDeleted ? 'bg-rose-500/20 text-rose-100 border-rose-500/30' : isActive ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-amber-500/20 text-amber-100 border-amber-500/30'}`}>
                  {isDeleted ? <Archive className="h-3 w-3" /> : isActive ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {isDeleted ? 'Archived' : isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-white/90">
                <code className="rounded-lg bg-white/15 backdrop-blur-sm px-2.5 py-1 font-mono font-bold ring-1 ring-white/20">
                  {bu.code}
                </code>
                <span className="flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-md">
                  <Globe2 className="h-4 w-4 opacity-70" /> Org: {bu.organization_name}
                </span>
                {bu.is_main_branch && (
                  <span className="flex items-center gap-1.5 text-amber-100 bg-amber-500/80 px-2 py-0.5 rounded-md text-xs font-bold">
                    Main Branch HQ
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-auto self-end sm:self-auto">
              {!isDeleted ? (
                <>
                  <PermissionGate permission="business_unit.update">
                    <Link to={`/platform/business-units/${bu.id}/edit`}
                      title="Edit Business Unit (E)"
                      aria-label="Edit this business unit"
                      className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                      <Edit2 className="h-4 w-4" />
                      <span>Edit <kbd className="hidden sm:inline-flex items-center rounded border border-white/20 bg-white/10 px-1 py-0.5 font-mono text-[9px] text-white/70">E</kbd></span>
                    </Link>
                  </PermissionGate>

                  <PermissionGate permission="business_unit.delete">
                    <button
                      onClick={() => setShowArchiveConfirm(true)}
                      title="Archive Business Unit (A)"
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-500/20 backdrop-blur-sm px-4 py-2 text-sm font-bold text-rose-100 ring-1 ring-rose-400/30 hover:bg-rose-500/35 transition-all">
                      <Archive className="h-4 w-4" /> Archive
                    </button>
                  </PermissionGate>
                </>
              ) : (
                <>
                  <PermissionGate permission="business_unit.restore">
                    <button
                      onClick={handleRestore}
                      disabled={isRestoring}
                      title="Restore Business Unit (A)"
                      className="inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/25 transition-all">
                      {isRestoring ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />} Restore
                    </button>
                  </PermissionGate>
                  <PermissionGate permission="business_unit.permanent_delete">
                    <button
                      onClick={() => setShowPermanentDelete(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/50 border border-rose-500">
                      <Trash2 className="h-4 w-4" /> Permanent Delete
                    </button>
                  </PermissionGate>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Strip ─────────────────────────────────────────────────── */}
        <KpiStrip items={kpiItems} className="mb-5 animate-fadeInUp delay-50" />

        {/* ── Tab Bar (shared component) ─────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl mb-5 animate-fadeInDown delay-100">
          <TabBar
            tabs={BU_TABS}
            activeTab={activeTab}
            onChange={(id) => setActiveTab(id as 'overview' | 'audit')}
          />
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <div className="animate-fadeInUp delay-150">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Identifiers Card */}
              <SectionCard title="Identifiers" icon={Fingerprint} iconColor="text-gray-500">
                <div className="space-y-4">
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Business Unit ID</p><CopyChip value={bu.id} label="ID" /></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Organization ID</p><CopyChip value={bu.organization_id} label="Org ID" /></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Domain ID</p><CopyChip value={bu.business_domain_id || '—'} label="Domain ID" /></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Manager ID</p>{bu.manager_id ? <CopyChip value={bu.manager_id} label="Manager ID" /> : <p className="text-sm font-medium text-gray-900 dark:text-white">—</p>}</div>
                </div>
              </SectionCard>

              {/* Contact & Location */}
              <SectionCard title="Contact & Location" icon={Mail} iconColor="text-blue-500">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Email</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bu.email || '—'}</p></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Phone</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bu.phone || '—'}</p></div>
                  <div className="col-span-2"><p className="text-xs font-semibold text-gray-500 mb-1">Address</p><p className="text-sm font-medium text-gray-900 dark:text-white">{[bu.address_line1, bu.address_line2, bu.city, bu.state, bu.country, bu.pincode].filter(Boolean).join(', ') || '—'}</p></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Timezone</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bu.effective_timezone || bu.timezone || '—'}</p></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">Currency</p><p className="text-sm font-medium text-gray-900 dark:text-white">{bu.effective_currency || bu.currency_code || '—'}</p></div>
                </div>
              </SectionCard>

              {/* Legal & Compliance */}
              <SectionCard title="Legal & Compliance" icon={ShieldCheck} iconColor="text-emerald-500">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><p className="text-xs font-semibold text-gray-500 mb-1">Registration Number</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bu.registration_number || '—'}</p></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">GST Number</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bu.gst_number || '—'}</p></div>
                  <div><p className="text-xs font-semibold text-gray-500 mb-1">PAN Number</p><p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bu.pan_number || '—'}</p></div>
                </div>
              </SectionCard>

              {/* Branding */}
              <SectionCard title="Branding" icon={Palette} iconColor="text-pink-500">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Branding Mode</p>
                      <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                        {bu.branding_mode === 'white_label' ? 'White Label' : bu.branding_mode === 'co_brand' ? 'Co-Brand' : 'Platform'}
                      </span>
                    </div>
                  </div>

                  {bu.branding_mode !== 'platform' && (
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Logo URL</p>
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate" title={bu.logo_url || '—'}>{bu.logo_url || '—'}</p>
                      </div>
                    </div>
                  )}

                  {bu.branding_mode === 'white_label' && (
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Custom Domain</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">{bu.custom_domain || '—'}</p>
                            {bu.custom_domain && (
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold w-fit ${
                                  bu.domain_status === 'verified' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                  bu.domain_status === 'failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                }`}>
                                  Domain: {bu.domain_status || 'pending'}
                                </span>
                                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold w-fit ${
                                  bu.ssl_status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                  bu.ssl_status === 'failed' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400' :
                                  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                }`}>
                                  SSL: {bu.ssl_status || 'pending'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

            </div>
          )}

          {activeTab === 'audit' && (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Activity Timeline</h3>
              <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-4 space-y-8 pb-4">
                
                {/* Deleted/Restored event if applicable */}
                {bu.is_deleted && bu.deleted_at && (
                  <div className="relative pl-6">
                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-gray-900 bg-rose-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">Archived <span className="text-xs font-normal text-gray-500">{formatDistanceToNow(new Date(bu.deleted_at))} ago</span></p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">By {bu.deleted_by_id || 'System'}</p>
                      {bu.deleted_reason && <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">"{bu.deleted_reason}"</div>}
                    </div>
                  </div>
                )}
                
                {bu.restored_at && (
                  <div className="relative pl-6">
                    <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-gray-900 bg-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">Restored <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{formatIST(bu.restored_at, 'dd MMM yyyy, HH:mm')}</span> <span className="text-xs font-normal text-gray-500">({formatDistanceToNow(new Date(bu.restored_at))} ago)</span></p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">By {bu.restored_by_id || 'System'}</p>
                      {bu.restored_reason && <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">"{bu.restored_reason}"</div>}
                    </div>
                  </div>
                )}

                <div className="relative pl-6">
                  <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-gray-900 bg-blue-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">Last Updated <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{formatIST(bu.updated_at, 'dd MMM yyyy, HH:mm')}</span> <span className="text-xs font-normal text-gray-500">({formatDistanceToNow(new Date(bu.updated_at))} ago)</span></p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">By {bu.updated_by_id || 'System'}</p>
                    {bu.updated_reason && <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">"{bu.updated_reason}"</div>}
                  </div>
                </div>

                <div className="relative pl-6">
                  <div className="absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-white dark:border-gray-900 bg-violet-500" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">Created <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{formatIST(bu.created_at, 'dd MMM yyyy, HH:mm')}</span> <span className="text-xs font-normal text-gray-500">({formatDistanceToNow(new Date(bu.created_at))} ago)</span></p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">By {bu.created_by_id || 'System'}</p>
                    {bu.created_reason && <div className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-800">"{bu.created_reason}"</div>}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

      {/* Modals */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2"><Archive className="h-6 w-6 text-rose-500" /> Archive Business Unit</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Are you sure you want to archive <strong>{bu.name}</strong>? It can be restored later.</p>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Reason for archiving (Optional)</label>
              <textarea value={archiveReason} onChange={e => setArchiveReason(e.target.value)} rows={2} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm focus:border-rose-500 focus:ring-rose-500" placeholder="Why is this being archived?" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowArchiveConfirm(false)} className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
              <button onClick={handleArchive} disabled={isDeleting} className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-50">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPermanentDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2"><Trash2 className="h-6 w-6 text-rose-500" /> Permanent Delete</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Permanently delete <strong>{bu.name}</strong>? This <strong className="text-rose-500">cannot be undone</strong>. All data for this unit will be lost forever.
            </p>
            {/* C-03 FIX: Require typing the BU name as confirmation to prevent accidental hard deletes */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Type <span className="font-mono text-rose-600">{bu.name}</span> to confirm
              </label>
              <input
                value={permanentDeleteConfirm}
                onChange={e => setPermanentDeleteConfirm(e.target.value)}
                placeholder={bu.name}
                className="w-full rounded-xl border border-rose-300 dark:border-rose-800 bg-gray-50 dark:bg-gray-800 p-3 text-sm focus:border-rose-500 focus:ring-rose-500 font-mono"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { setShowPermanentDelete(false); setPermanentDeleteConfirm(''); }}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePermanentDelete}
                disabled={isPermanentlyDeleting || permanentDeleteConfirm !== bu.name}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isPermanentlyDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Permanent Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default BusinessUnitDetailPage;
