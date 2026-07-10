// src/features/organization/businessUnit/components/BusinessUnitQuickViewDrawer.tsx
// Premium side-sheet quick-view drawer for Business Unit details.
// Slides in from right, shows all key fields without full page navigation.
// Close: X button, Escape key, or overlay click.
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Building2, Globe2, GitBranch, Users, Mail, Phone,
  MapPin, ShieldCheck, Hash, CreditCard, Clock, DollarSign,
  ArrowRight, Edit2, Archive, RotateCcw, Star, Eye, EyeOff,
  Briefcase, CheckCircle2, AlertTriangle,
} from 'lucide-react';

import type { BusinessUnit } from '@/features/organization/businessUnit/types/businessUnitTypes';
import { useAuthStore } from '@/store/authStore';
import { formatIST } from '@/utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  businessUnit: BusinessUnit | null;
  onEdit?: (bu: BusinessUnit) => void;
  onArchive?: (bu: BusinessUnit) => void;
  onRestore?: (bu: BusinessUnit) => void;
  onViewDetail?: (bu: BusinessUnit) => void;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const GRADIENTS = [
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-500',
  'from-pink-500 to-rose-500',
  'from-cyan-500 to-blue-500',
];

function BuAvatar({ bu, size = 64 }: { bu: BusinessUnit; size?: number }) {
  if (bu.logo_url) {
    return (
      <img
        src={bu.logo_url} alt={bu.name}
        className="rounded-2xl object-contain border-2 border-white dark:border-gray-700 bg-white shadow-lg"
        style={{ width: size, height: size }}
      />
    );
  }
  const gradient = GRADIENTS[bu.name.charCodeAt(0) % GRADIENTS.length];
  return (
    <div
      className={`shrink-0 flex items-center justify-center rounded-2xl text-white font-black select-none shadow-lg bg-gradient-to-br ${gradient}`}
      style={{
        width: size, height: size,
        fontSize: size * 0.36,
        letterSpacing: '-0.02em',
      }}
    >
      {bu.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ bu }: { bu: BusinessUnit }) {
  if (bu.is_deleted) return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-900/25 dark:text-rose-400 dark:ring-rose-800">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-400 shrink-0" /> Archived
    </span>
  );
  if (bu.is_active) return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/25 dark:text-emerald-400 dark:ring-emerald-800">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> Active
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/25 dark:text-amber-400 dark:ring-amber-800">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" /> Inactive
    </span>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 dark:text-gray-500">{children}</span>
      <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────
function InfoRow({
  icon: Icon, label, value, href, iconColor = 'text-gray-400 dark:text-gray-500',
}: {
  icon: React.ElementType; label: string; value: string | null | undefined;
  href?: string; iconColor?: string;
}) {
  if (!value) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800/60 ${iconColor}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
          <p className="text-xs text-gray-400 dark:text-gray-600 italic">Not configured</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800/60 ${iconColor}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        {href ? (
          <a href={href} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline truncate block">{value}</a>
        ) : (
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Masked Compliance Field ──────────────────────────────────────────────────
function MaskedField({
  icon: Icon, label, value, maskFrom,
}: {
  icon: React.ElementType; label: string; value: string | null | undefined; maskFrom: number;
}) {
  const [show, setShow] = React.useState(false);
  const display = value
    ? (show ? value : value.slice(0, maskFrom) + '•'.repeat(Math.max(0, value.length - maskFrom)))
    : null;
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800/60 text-gray-400">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</p>
        {value ? (
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-semibold text-gray-800 dark:text-gray-200">{display}</span>
            <button
              onClick={() => setShow(s => !s)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label={show ? 'Hide' : 'Show'}
            >
              {show ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-600 italic">Not configured</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export function BusinessUnitQuickViewDrawer({
  isOpen, onClose, businessUnit: bu, onEdit, onArchive, onRestore, onViewDetail,
}: Props) {
  const isSuperAdmin = useAuthStore(state => state.isSuperAdmin);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !bu) return null;

  const addressParts = [bu.address_line1, bu.address_line2, bu.city, bu.state, bu.pincode, bu.country].filter(Boolean);
  const hasAddress = addressParts.length > 0;
  const hasCompliance = !!(bu.gst_number || bu.pan_number || bu.registration_number);

  const content = (
    <div className="fixed inset-0 z-[300] flex items-stretch justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Quick view: ${bu.name}`}
        className="relative z-10 flex flex-col w-full max-w-[420px] bg-white dark:bg-gray-900 shadow-2xl
          border-l border-gray-200 dark:border-gray-800 animate-[slideInRight_0.25s_ease-out_both]"
        style={{ maxHeight: '100dvh' }}
      >
        {/* ── Accent stripe */}
        <div
          className="h-1.5 w-full shrink-0"
          style={{
            background: 'linear-gradient(90deg, #6366f1, #a855f7)',
          }}
        />

        {/* ── Header (sticky) */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-start gap-4">
            <BuAvatar bu={bu} size={60} />
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight truncate">{bu.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <code className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300">
                      {bu.code}
                    </code>
                    {bu.is_main_branch && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" aria-hidden="true" /> Main Branch
                      </span>
                    )}
                  </div>
                  <div className="mt-2">
                    <StatusBadge bu={bu} />
                  </div>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close quick view"
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Identity & Domain */}
          <div>
            <SectionHeader>Identity &amp; Domain</SectionHeader>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
              <InfoRow icon={Building2} label="Organization" value={bu.organization_name} iconColor="text-violet-500" />
              <InfoRow icon={Globe2} label="Business Domain" value={bu.business_domain_name} iconColor="text-indigo-500" />
              <InfoRow
                icon={GitBranch}
                label="Branch Type"
                value={bu.is_main_branch ? 'Main Branch' : 'Sub Branch'}
                iconColor={bu.is_main_branch ? 'text-amber-500' : 'text-gray-400'}
              />
              <InfoRow
                icon={Users}
                label="Users"
                value={bu.users_count !== undefined ? String(bu.users_count) : '0'}
                iconColor="text-blue-500"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <SectionHeader>Contact</SectionHeader>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
              <InfoRow icon={Mail} label="Email" value={bu.email} href={bu.email ? `mailto:${bu.email}` : undefined} iconColor="text-sky-500" />
              <InfoRow icon={Phone} label="Phone" value={bu.phone} href={bu.phone ? `tel:${bu.phone}` : undefined} iconColor="text-teal-500" />
            </div>
          </div>

          {/* Location */}
          <div>
            <SectionHeader>Location</SectionHeader>
            {hasAddress ? (
              <div className="flex items-start gap-3 py-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800/60 text-emerald-500">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Address</p>
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 space-y-0.5">
                    {bu.address_line1 && <div>{bu.address_line1}</div>}
                    {bu.address_line2 && <div>{bu.address_line2}</div>}
                    {(bu.city || bu.state || bu.pincode) && (
                      <div>{[bu.city, bu.state, bu.pincode].filter(Boolean).join(', ')}</div>
                    )}
                    {bu.country && <div className="text-gray-500">{bu.country}</div>}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-gray-400 dark:text-gray-600 italic">
                No address on record
              </div>
            )}
          </div>

          {/* Compliance */}
          <div>
            <SectionHeader>Compliance</SectionHeader>
            {hasCompliance ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
                {bu.registration_number && (
                  <InfoRow icon={Hash} label="Registration No." value={bu.registration_number} iconColor="text-violet-500" />
                )}
                <MaskedField icon={ShieldCheck} label="GST Number" value={bu.gst_number} maskFrom={6} />
                <MaskedField icon={CreditCard} label="PAN Number" value={bu.pan_number} maskFrom={4} />
              </div>
            ) : (
              <div className="py-3 text-center text-xs text-gray-400 dark:text-gray-600 italic">
                No compliance data configured
              </div>
            )}
          </div>

          {/* Locale */}
          <div>
            <SectionHeader>Locale</SectionHeader>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
              <InfoRow icon={Clock} label="Timezone" value={bu.effective_timezone || bu.timezone} iconColor="text-orange-500" />
              <InfoRow icon={DollarSign} label="Currency" value={bu.effective_currency || bu.currency_code} iconColor="text-green-500" />
            </div>
          </div>

          {/* Timestamps */}
          {bu.created_at && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Created:</span>{' '}
              {formatIST(bu.created_at, 'dd MMM yyyy, HH:mm')}
              {bu.updated_at && (
                <>
                  {' '}·{' '}
                  <span className="font-semibold">Updated:</span>{' '}
                  {formatIST(bu.updated_at, 'dd MMM yyyy')}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer actions (sticky) */}
        <div className="shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
          <div className="flex gap-2">
            {/* View Detail — primary */}
            <button
              onClick={() => { onViewDetail?.(bu); onClose(); }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              View Details <ArrowRight className="h-4 w-4" />
            </button>

            {/* Edit — only if not archived & super admin */}
            {isSuperAdmin && !bu.is_deleted && onEdit && (
              <button
                onClick={() => { onEdit(bu); onClose(); }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                title="Edit Business Unit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}

            {/* Archive / Restore — super admin only */}
            {isSuperAdmin && (
              bu.is_deleted ? (
                onRestore && (
                  <button
                    onClick={() => { onRestore(bu); onClose(); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                    title="Restore Business Unit"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )
              ) : (
                onArchive && (
                  <button
                    onClick={() => { onArchive(bu); onClose(); }}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 px-3 py-2.5 text-sm font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-all"
                    title="Archive Business Unit"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

export default BusinessUnitQuickViewDrawer;
