// yss_orbit\frontend\src\features\pqm\components\DuplicateWarningBanner.tsx
import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NCListItem } from '../types';

interface DuplicateWarningBannerProps {
  duplicates: NCListItem[];
  onViewDuplicate?: (id: string) => void;
  onDismiss?: () => void;
}

export function DuplicateWarningBanner({
  duplicates,
  onViewDuplicate,
  onDismiss,
}: DuplicateWarningBannerProps) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (dismissed || duplicates.length === 0) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        background: '#FFFBEB',
        border: '1px solid #FCD34D',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '16px',
      }}
    >
      {/* Banner header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <AlertTriangle
          size={18}
          color="#D97706"
          style={{ flexShrink: 0, marginTop: '1px' }}
          aria-hidden="true"
        />

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400E', margin: 0 }}>
            {t(
              'pqm.duplicate.warning_title',
              `${duplicates.length} similar non-conformance(s) found`,
              { count: duplicates.length },
            )}
          </p>
          <p style={{ fontSize: '12px', color: '#B45309', margin: '4px 0 0' }}>
            {t(
              'pqm.duplicate.warning_subtitle',
              'Review these before submitting to avoid duplicates. You can still submit.',
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={linkBtnStyle}
            aria-expanded={expanded}
          >
            {expanded
              ? t('pqm.duplicate.hide', 'Hide')
              : t('pqm.duplicate.show', `Show ${duplicates.length}`, { count: duplicates.length })}
          </button>

          <button
            onClick={() => {
              setDismissed(true);
              onDismiss?.();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#B45309',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label={t('common.dismiss', 'Dismiss')}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Expanded list */}
      {expanded && (
        <ul
          style={{
            margin: '10px 0 0 28px',
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {duplicates.map((nc) => (
            <li key={nc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#92400E',
                  background: '#FDE68A',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                {nc.nc_number}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#374151',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={nc.title}
              >
                {nc.title}
              </span>
              {onViewDuplicate && (
                <button
                  onClick={() => onViewDuplicate(nc.id)}
                  style={{ ...linkBtnStyle, display: 'inline-flex', alignItems: 'center', gap: '2px' }}
                >
                  {t('pqm.duplicate.view', 'View')}
                  <ChevronRight size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const linkBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#D97706',
  fontSize: '12px',
  fontWeight: 600,
  padding: 0,
  textDecoration: 'underline',
  fontFamily: 'inherit',
};
