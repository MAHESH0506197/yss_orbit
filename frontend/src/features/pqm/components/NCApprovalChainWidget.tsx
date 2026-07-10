// yss_orbit\frontend\src\features\pqm\components\NCApprovalChainWidget.tsx
import React from 'react';
import { CheckCircle, XCircle, RotateCcw, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PQMApprovalStep, ApprovalDecision } from '../types';
import { formatIST } from '@/utils/date';

interface DecisionConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  label: string;
}

const DECISION_CONFIG: Record<ApprovalDecision, DecisionConfig> = {
  Pending:  { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', icon: <Clock size={12} />,      label: 'Pending' },
  Approved: { color: '#059669', bg: '#ECFDF5', border: '#6EE7B7', icon: <CheckCircle size={12} />, label: 'Approved' },
  Rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5', icon: <XCircle size={12} />,    label: 'Rejected' },
  Rework:   { color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: <RotateCcw size={12} />,  label: 'Rework' },
};

interface NCApprovalChainWidgetProps {
  steps: PQMApprovalStep[];
  currentUserId?: string;
  onApprove?: (stepId: string, comments: string) => void;
  onReject?: (stepId: string, comments: string) => void;
  onRework?: (stepId: string, comments: string) => void;
}

interface ActionRowState {
  stepId: string;
  comments: string;
}

export function NCApprovalChainWidget({
  steps,
  currentUserId,
  onApprove,
  onReject,
  onRework,
}: NCApprovalChainWidgetProps) {
  const { t } = useTranslation();
  const [actionState, setActionState] = React.useState<ActionRowState | null>(null);

  const sorted = [...steps].sort((a, b) => a.sequence_order - b.sequence_order);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {sorted.length === 0 && (
        <p style={{ fontSize: '13px', color: '#6B7280', textAlign: 'center', padding: '24px 0' }}>
          {t('pqm.approval.no_steps', 'No approval steps defined.')}
        </p>
      )}

      {sorted.map((step, idx) => {
        const dcfg = DECISION_CONFIG[step.decision];
        const isCurrentUserStep =
          step.decision === 'Pending' && currentUserId && step.approver_id === currentUserId;
        const isActionOpen = actionState?.stepId === step.id;

        return (
          <div
            key={step.id}
            style={{
              border: `1px solid ${dcfg.border}`,
              borderRadius: '10px',
              padding: '14px 16px',
              background: dcfg.bg,
              position: 'relative',
            }}
          >
            {/* Step header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {/* Step number */}
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: dcfg.color,
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>

              {/* Stage label */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {step.stage === 'review'
                  ? t('pqm.approval.stage_review', 'Review')
                  : t('pqm.approval.stage_verification', 'Verification')}
              </span>

              <span style={{ flex: 1 }} />

              {/* Decision badge */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: dcfg.color,
                  background: '#fff',
                  border: `1px solid ${dcfg.border}`,
                }}
                aria-label={`Decision: ${dcfg.label}`}
              >
                {dcfg.icon}
                {dcfg.label}
              </span>
            </div>

            {/* Approver row — TODO: resolve approver_id to display name via user lookup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <User size={13} color="#9CA3AF" />
              <span style={{ fontSize: '12px', color: '#374151' }}>
                {t('pqm.approval.approver', 'Approver')}:{' '}
                <code style={{ fontSize: '11px', color: '#6B7280' }}>
                  {/* TODO: replace approver_id with user display name lookup */}
                  {step.approver_id}
                </code>
              </span>
            </div>

            {/* Comments */}
            {step.comments && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'rgba(0,0,0,0.04)',
                  fontSize: '12px',
                  color: '#374151',
                  lineHeight: 1.5,
                }}
              >
                &ldquo;{step.comments}&rdquo;
              </div>
            )}

            {/* Decided at */}
            {step.decided_at && (
              <p style={{ marginTop: '6px', fontSize: '11px', color: '#9CA3AF' }}>
                {formatIST(new Date(step.decided_at), 'PP pp')}
              </p>
            )}

            {/* Action buttons — only for current user's pending step */}
            {isCurrentUserStep && (
              <div style={{ marginTop: '12px' }}>
                {!isActionOpen ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setActionState({ stepId: step.id, comments: '' })}
                      style={btnStyle('#059669')}
                    >
                      <CheckCircle size={13} />
                      {t('pqm.approval.action_approve', 'Approve')}
                    </button>
                    <button
                      onClick={() => setActionState({ stepId: step.id, comments: '' })}
                      style={btnStyle('#DC2626')}
                    >
                      <XCircle size={13} />
                      {t('pqm.approval.action_reject', 'Reject')}
                    </button>
                    <button
                      onClick={() => setActionState({ stepId: step.id, comments: '' })}
                      style={btnStyle('#D97706')}
                    >
                      <RotateCcw size={13} />
                      {t('pqm.approval.action_rework', 'Request Rework')}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      rows={3}
                      placeholder={t('pqm.approval.comments_placeholder', 'Enter comments (optional)...')}
                      value={actionState.comments}
                      onChange={(e) =>
                        setActionState((prev) => prev ? { ...prev, comments: e.target.value } : prev)
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '13px',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          onApprove?.(step.id, actionState.comments);
                          setActionState(null);
                        }}
                        style={btnStyle('#059669')}
                      >
                        <CheckCircle size={13} />
                        {t('pqm.approval.confirm_approve', 'Confirm Approve')}
                      </button>
                      <button
                        onClick={() => {
                          onReject?.(step.id, actionState.comments);
                          setActionState(null);
                        }}
                        style={btnStyle('#DC2626')}
                      >
                        <XCircle size={13} />
                        {t('pqm.approval.confirm_reject', 'Confirm Reject')}
                      </button>
                      <button
                        onClick={() => {
                          onRework?.(step.id, actionState.comments);
                          setActionState(null);
                        }}
                        style={btnStyle('#D97706')}
                      >
                        <RotateCcw size={13} />
                        {t('pqm.approval.confirm_rework', 'Confirm Rework')}
                      </button>
                      <button
                        onClick={() => setActionState(null)}
                        style={btnStyle('#6B7280')}
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 12px',
    borderRadius: '6px',
    border: `1px solid ${color}`,
    background: 'transparent',
    color,
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };
}
