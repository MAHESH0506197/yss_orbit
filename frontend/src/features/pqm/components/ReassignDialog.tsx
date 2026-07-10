// yss_orbit\frontend\src\features\pqm\components\ReassignDialog.tsx
import React, { useState } from 'react';
import { UserCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReassignDialogProps {
  ncNumber: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onConfirm: (newAssigneeId: string, reason: string) => void;
  onClose: () => void;
}

export function ReassignDialog({
  ncNumber,
  isOpen,
  isSubmitting = false,
  onConfirm,
  onClose,
}: ReassignDialogProps) {
  const { t } = useTranslation();
  const [newAssigneeId, setNewAssigneeId] = useState('');
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const isAssigneeValid = newAssigneeId.trim().length > 0;
  const isReasonValid = reason.trim().length >= 5;
  const isFormValid = isAssigneeValid && isReasonValid;

  function handleConfirm() {
    setTouched(true);
    if (!isFormValid) return;
    onConfirm(newAssigneeId.trim(), reason.trim());
  }

  function handleClose() {
    setNewAssigneeId('');
    setReason('');
    setTouched(false);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reassign-dialog-title"
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={dialogStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#D97706' }}>
              <UserCheck size={18} aria-hidden="true" />
            </span>
            <h2 id="reassign-dialog-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>
              {t('pqm.reassign.title', 'Reassign NC')}
            </h2>
          </div>
          <button onClick={handleClose} style={iconBtnStyle} aria-label={t('common.close', 'Close')}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', color: '#4B5563', margin: 0 }}>
            {t(
              'pqm.reassign.description',
              `Reassigning {{ncNumber}}. Select a new assignee and provide a reason.`,
              { ncNumber },
            )}
          </p>

          {/* New assignee — text input; TODO: replace with user picker component */}
          <div>
            <label style={labelStyle} htmlFor="reassign-assignee">
              {t('pqm.reassign.assignee_label', 'New Assignee (User ID)')}
              <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>
            </label>
            <input
              id="reassign-assignee"
              type="text"
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={t('pqm.reassign.assignee_placeholder', 'Enter user ID or username...')}
              style={{
                ...inputStyle,
                borderColor: touched && !isAssigneeValid ? '#DC2626' : '#D1D5DB',
              }}
            />
            {/* TODO: Replace above input with a searchable UserPicker component */}
            {touched && !isAssigneeValid && (
              <p style={errorStyle}>
                {t('pqm.reassign.assignee_error', 'Please select a new assignee.')}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label style={labelStyle} htmlFor="reassign-reason">
              {t('pqm.reassign.reason_label', 'Reason')}
              <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>
            </label>
            <textarea
              id="reassign-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder={t('pqm.reassign.reason_placeholder', 'Why is this NC being reassigned?')}
              style={{
                ...textareaStyle,
                borderColor: touched && !isReasonValid ? '#DC2626' : '#D1D5DB',
              }}
            />
            {touched && !isReasonValid && (
              <p style={errorStyle}>
                {t('pqm.reassign.reason_error', 'Reason must be at least 5 characters.')}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={handleClose} style={cancelBtnStyle} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            style={{
              ...primaryBtnStyle,
              background: '#D97706',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <UserCheck size={14} />
            {isSubmitting
              ? t('pqm.reassign.reassigning', 'Reassigning...')
              : t('pqm.reassign.confirm', 'Reassign')}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px',
};

const dialogStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: '12px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
  width: '100%',
  maxWidth: '500px',
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 24px',
  borderBottom: '1px solid #F3F4F6',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '10px',
  padding: '16px 24px',
  borderTop: '1px solid #F3F4F6',
  background: '#F9FAFB',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '13px',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  fontSize: '13px',
  fontFamily: 'inherit',
  resize: 'vertical',
  boxSizing: 'border-box',
  outline: 'none',
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  background: '#fff',
  color: '#374151',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#6B7280',
  display: 'flex',
  alignItems: 'center',
  padding: '4px',
  borderRadius: '4px',
};

const errorStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#DC2626',
  marginTop: '4px',
};
