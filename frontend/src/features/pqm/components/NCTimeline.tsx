// yss_orbit\frontend\src\features\pqm\components\NCTimeline.tsx
import React from 'react';
import {
  GitBranch,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  Paperclip,
  CalendarClock,
  Info,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PQMStatusHistoryEntry, PQMApprovalStep, PQMComment } from '../types';
import { formatIST } from '@/utils/date';

interface TimelineEntry {
  id: string;
  type: 'status' | 'approval' | 'comment' | 'attachment' | 'extension';
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle?: string;
  actor: string;
  timestamp: string;
}

interface NCTimelineProps {
  statusHistory?: PQMStatusHistoryEntry[];
  approvalSteps?: PQMApprovalStep[];
  comments?: PQMComment[];
}

function getEventIcon(eventType: string): {
  icon: React.ReactNode;
  color: string;
  bg: string;
} {
  const t = eventType.toLowerCase();
  if (t.includes('approved') || t.includes('closure')) {
    return { icon: <CheckCircle size={14} />, color: '#059669', bg: '#ECFDF5' };
  }
  if (t.includes('reject') || t.includes('closed')) {
    return { icon: <XCircle size={14} />, color: '#DC2626', bg: '#FEF2F2' };
  }
  if (t.includes('rework')) {
    return { icon: <RotateCcw size={14} />, color: '#D97706', bg: '#FFFBEB' };
  }
  if (t.includes('attach')) {
    return { icon: <Paperclip size={14} />, color: '#6366F1', bg: '#EEF2FF' };
  }
  if (t.includes('extension') || t.includes('calendar')) {
    return { icon: <CalendarClock size={14} />, color: '#0EA5E9', bg: '#F0F9FF' };
  }
  if (t.includes('comment') || t.includes('note')) {
    return { icon: <MessageSquare size={14} />, color: '#8B5CF6', bg: '#F5F3FF' };
  }
  return { icon: <GitBranch size={14} />, color: '#2563EB', bg: '#DBEAFE' };
}

export function NCTimeline({ statusHistory = [], approvalSteps = [], comments = [] }: NCTimelineProps) {
  const { t } = useTranslation();

  const entries: TimelineEntry[] = [];

  // Status history entries
  statusHistory.forEach((h) => {
    const { icon, color, bg } = getEventIcon(h.event_type);
    entries.push({
      id: `history-${h.id}`,
      type: 'status',
      icon,
      iconColor: color,
      iconBg: bg,
      title: h.from_status
        ? `${h.from_status} → ${h.to_status}`
        : h.to_status,
      subtitle: h.reason || undefined,
      actor: h.actor_id,
      timestamp: h.created_at,
    });
  });

  // Approval step decisions
  approvalSteps
    .filter((s) => s.decision !== 'Pending')
    .forEach((s) => {
      const { icon, color, bg } = getEventIcon(s.decision);
      entries.push({
        id: `approval-${s.id}`,
        type: 'approval',
        icon,
        iconColor: color,
        iconBg: bg,
        title: `${s.stage === 'review' ? t('pqm.approval.stage_review', 'Review') : t('pqm.approval.stage_verification', 'Verification')} — ${s.decision}`,
        subtitle: s.comments || undefined,
        actor: s.approver_id,
        timestamp: s.decided_at ?? '',
      });
    });

  // Comments
  comments.forEach((c) => {
    entries.push({
      id: `comment-${c.id}`,
      type: 'comment',
      icon: <MessageSquare size={14} />,
      iconColor: '#8B5CF6',
      iconBg: '#F5F3FF',
      title: c.is_internal
        ? t('pqm.timeline.internal_note', 'Internal Note')
        : t('pqm.timeline.comment', 'Comment'),
      subtitle: c.body,
      actor: c.author_id,
      timestamp: c.created_at,
    });
  });

  // Sort ascending
  entries.sort((a, b) => {
    if (!a.timestamp) return -1;
    if (!b.timestamp) return 1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  if (entries.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '40px 0',
          color: '#9CA3AF',
        }}
      >
        <Info size={24} />
        <p style={{ fontSize: '13px' }}>
          {t('pqm.timeline.empty', 'No history entries yet.')}
        </p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '32px' }}>
      {/* Vertical connector line */}
      <div
        style={{
          position: 'absolute',
          left: '15px',
          top: '20px',
          bottom: '20px',
          width: '2px',
          background: 'linear-gradient(to bottom, #E5E7EB, #E5E7EB)',
        }}
        aria-hidden="true"
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {entries.map((entry) => (
          <div key={entry.id} style={{ position: 'relative' }}>
            {/* Icon node */}
            <span
              style={{
                position: 'absolute',
                left: '-32px',
                top: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: entry.iconBg,
                color: entry.iconColor,
                border: `2px solid ${entry.iconBg}`,
                boxShadow: '0 0 0 3px #fff',
                zIndex: 1,
              }}
              aria-hidden="true"
            >
              {entry.icon}
            </span>

            {/* Content */}
            <div
              style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  marginBottom: entry.subtitle ? '6px' : 0,
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                  {entry.title}
                </span>
                <span style={{ fontSize: '11px', color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                  {entry.timestamp
                    ? formatIST(new Date(entry.timestamp), 'PP pp')
                    : ''}
                </span>
              </div>

              {entry.subtitle && (
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: '12px',
                    color: '#6B7280',
                    lineHeight: 1.5,
                  }}
                >
                  {entry.subtitle}
                </p>
              )}

              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#9CA3AF' }}>
                {/* TODO: replace actor_id with user display name */}
                {t('pqm.timeline.by', 'By')}: <code>{entry.actor}</code>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
