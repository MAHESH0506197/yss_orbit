// yss_orbit\frontend\src\features\pqm\components\SLACountdown.tsx
import React from 'react';
import { Clock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SLACountdownProps {
  targetClosureDate: string | null;
  isSafetyCritical?: boolean;
  actualClosureDate?: string | null;
}

function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  // Strip time for day-level comparison
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - now.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function SLACountdown({
  targetClosureDate,
  isSafetyCritical = false,
  actualClosureDate,
}: SLACountdownProps) {
  const { t } = useTranslation();

  if (actualClosureDate) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600,
          color: '#059669',
        }}
        aria-label={t('pqm.sla.closed', 'Closed')}
      >
        <Clock size={12} />
        {t('pqm.sla.closed', 'Closed')}
      </span>
    );
  }

  if (!targetClosureDate) {
    return (
      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
        {t('pqm.sla.no_date', '—')}
      </span>
    );
  }

  const days = getDaysRemaining(targetClosureDate);
  const isOverdue = days < 0;
  const isUrgent = days >= 0 && days <= 3;

  let color = '#059669'; // green
  let bg = '#ECFDF5';
  let border = '#6EE7B7';

  if (isOverdue) {
    color = '#DC2626';
    bg = '#FEF2F2';
    border = '#FCA5A5';
  } else if (isUrgent) {
    color = '#B45309';
    bg = '#FFFBEB';
    border = '#FDE68A';
  }

  const label = isOverdue
    ? t('pqm.sla.overdue_days', `${Math.abs(days)}d overdue`, { count: Math.abs(days) })
    : days === 0
    ? t('pqm.sla.due_today', 'Due today')
    : t('pqm.sla.days_left', `${days}d left`, { count: days });

  const IconComponent = isOverdue ? AlertTriangle : Clock;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 7px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 600,
        color,
        background: bg,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap',
      }}
      aria-label={`SLA: ${label}`}
    >
      <IconComponent size={11} />
      {label}
      {isSafetyCritical && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            marginLeft: '4px',
            padding: '1px 5px',
            borderRadius: '999px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#fff',
            background: '#DC2626',
          }}
          title={t('pqm.safety_critical', 'Safety Critical')}
          aria-label={t('pqm.safety_critical', 'Safety Critical')}
        >
          <ShieldAlert size={9} />
          {t('pqm.sc', 'SC')}
        </span>
      )}
    </span>
  );
}
