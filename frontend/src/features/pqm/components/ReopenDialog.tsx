// yss_orbit\frontend\src\features\pqm\components\ReopenDialog.tsx
import React, { useState } from 'react';
import { RefreshCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReopenDialogProps {
  ncNumber: string;
  isOpen: boolean;
  isSubmitting?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

export function ReopenDialog({
  ncNumber,
  isOpen,
  isSubmitting = false,
  onConfirm,
  onClose,
}: ReopenDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  if (!isOpen) return null;

  const isValid = reason.trim().length >= 10;

  function handleConfirm() {
    setTouched(true);
    if (!isValid) return;
    onConfirm(reason.trim());
  }

  function handleClose() {
    setReason('');
    setTouched(false);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reopen-dialog-title"
      style={overlayStyle}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div style={dialogStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#DC2626' }}>
              <RefreshCcw size={18} aria-hidden="true" />
            </span>
            <h2 id="reopen-dialog-title" style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#111827' }}>
              {t('pqm.reopen.title', 'Reopen Non-Conformance')}
            </h2>
          </div>
          <button onClick={handleClose} style={iconBtnStyle} aria-label={t('common.close', 'Close')}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: '13px', color: '#4B5563', marginBottom: '16px' }}>
            {t('pqm.reopen.description', `You are about to reopen NC {{ncNumber}}. Please provide a reason.`, { ncNumber })}
          </p>

          <label style={labelStyle} htmlFor="reopen-reason">
            {t('pqm.reopen.reason_label', 'Reason for Reopening')}
            <span style={{ color: '#DC2626', marginLeft: '4px' }}>*</span>
          </label>
          <textarea
            id="reopen-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t(
              'pqm.reopen.reason_placeholder',
              'Describe why this NC needs to be reopened (min 10 characters)...',
            )}
            style={{
              ...textareaStyle,
              borderColor: touched && !isValid ? '#DC2626' : '#D1D5DB',
            }}
          />
          {touched && !isValid && (
            <p style={{ fontSize: '11px', color: '#DC2626', marginTop: '4px' }}>
              {t('pqm.reopen.reason_error', 'Reason must be at least 10 characters.')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={footerStyle}>
          <button onClick={handleClose} style={cancelBtnStyle} disabled={isSubmitting}>
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || (touched && !isValid)}
            style={{
              ...primaryBtnStyle,
              background: '#DC2626',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            <RefreshCcw size={14} />
            {isSubmitting
              ? t('pqm.reopen.reopening', 'Reopening...')
              : t('pqm.reopen.confirm', 'Reopen NC')}
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
  maxWidth: '480px',
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
