// yss_orbit\frontend\src\modules\welcome\components\Toast.tsx
/**
 * Toast
 *
 * Global Toast Notification Renderer.
 * Place <ToastContainer /> once inside PublicLayout (or App root).
 *
 * Features:
 * - Success / Error / Info / Warning variants
 * - Slide-in + fade-out animation
 * - Click to dismiss
 * - Auto-dismiss with progress bar
 * - Stacks multiple toasts
 * - Accessible (role="alert", aria-live)
 */

import React, { useEffect, useState } from 'react';
import { useToastState } from '../hooks/useToast';

/* ── Types ──────────────────────────────────────────────────────────────── */

interface ToastData {
  id:        number;
  type:      'success' | 'error' | 'info' | 'warning';
  title?:    string;
  message?:  string;
  duration?: number;
}

interface ToastItemProps {
  toast:     ToastData;
  onDismiss: (id: number) => void;
}

/* ── Icons ──────────────────────────────────────────────────────────────── */

const ICONS: Record<ToastData['type'], React.ReactElement> = {
  success: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v5M10 7v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L18 17H2L10 3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 9v4M10 14.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

const TYPE_COLORS: Record<ToastData['type'], { color: string; bg: string; border: string }> = {
  success: { color: '#22C55E', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.30)'  },
  error:   { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.30)'  },
  info:    { color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.30)' },
  warning: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.30)' },
};

/* ── ToastItem ──────────────────────────────────────────────────────────── */

function ToastItem({ toast, onDismiss }: ToastItemProps): React.ReactElement {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const colors = TYPE_COLORS[toast.type] ?? TYPE_COLORS.info;

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = (): void => {
    setLeaving(true);
    setTimeout(() => onDismiss(toast.id), 320);
  };

  return (
    <div
      role="alert"
      aria-live="polite"
      onClick={handleDismiss}
      style={{
        display:        'flex',
        alignItems:     'flex-start',
        gap:            '0.875rem',
        padding:        '1rem 1.125rem',
        borderRadius:    14,
        background:     'var(--toast-bg, rgba(17,24,39,0.95))',
        backdropFilter: 'blur(20px)',
        border:         `1.5px solid ${colors.border}`,
        boxShadow:      '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)',
        cursor:         'pointer',
        minWidth:        320,
        maxWidth:        420,
        opacity:         visible && !leaving ? 1 : 0,
        transform:       visible && !leaving ? 'translateX(0)' : 'translateX(30px)',
        transition:     'opacity 0.32s ease, transform 0.32s cubic-bezier(0.16,1,0.3,1)',
        position:       'relative',
        overflow:       'hidden',
      }}
    >
      {/* Left colour bar */}
      <div style={{
        position:    'absolute',
        left: 0, top: 0, bottom: 0,
        width:        3,
        background:   colors.color,
        borderRadius: '2px 0 0 2px',
      }} />

      {/* Icon */}
      <div style={{
        color:        colors.color,
        flexShrink:   0,
        marginTop:   '1px',
        background:   colors.bg,
        borderRadius: 8,
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {ICONS[toast.type] ?? ICONS.info}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <div style={{
            fontSize:     '0.9rem',
            fontWeight:    600,
            color:        'var(--foreground)',
            fontFamily:   "'DM Sans', sans-serif",
            marginBottom:  toast.message ? '0.2rem' : 0,
          }}>
            {toast.title}
          </div>
        )}
        {toast.message && (
          <div style={{
            fontSize:   '0.83rem',
            color:      'var(--muted-foreground)',
            fontFamily: "'DM Sans', sans-serif",
            lineHeight:  1.55,
          }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Dismiss × */}
      <button
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); handleDismiss(); }}
        aria-label="Dismiss notification"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--muted-foreground)', padding: '2px', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'color 0.2s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </button>

      {/* Progress bar */}
      {(toast.duration ?? 5000) > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height:    2,
          background: colors.color + '30',
        }}>
          <div style={{
            height:    '100%',
            background: colors.color,
            animation: `toast-progress ${toast.duration ?? 5000}ms linear forwards`,
          }} />
        </div>
      )}

      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

/* ── ToastContainer (default export) ───────────────────────────────────── */

export default function ToastContainer(): React.ReactElement | null {
  const { toasts, dismiss } = useToastState();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position:      'fixed',
        bottom:        '1.5rem',
        right:         '1.5rem',
        zIndex:         9999,
        display:       'flex',
        flexDirection: 'column',
        gap:           '0.625rem',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast: any) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast as ToastData} onDismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
