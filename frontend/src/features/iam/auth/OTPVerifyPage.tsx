/**
 * YSS Orbit — OTPVerifyPage
 * Verifies MFA OTP via POST /api/v1/auth/mfa/verify/
 * Accepts 6-digit code with auto-submit on complete entry.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/auth/AuthLayout';
import toast from 'react-hot-toast';

function getIsDark() { return document.documentElement.classList.contains('dark'); }

const OTP_LENGTH = 6;

export default function OTPVerifyPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = params.get('return') || '/dashboard';

  const [isDark, setIsDark] = useState(getIsDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const [pendingAuth] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('pendingAuth') || '{}'); }
    catch { return {}; }
  });
  const purpose = pendingAuth.purpose || pendingAuth.status || 'MFA_REQUIRED';
  const isEmailVerification = purpose === 'EMAIL_VERIFICATION' || purpose === 'EMAIL_VERIFICATION_REQUIRED';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join('');

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (code.length === OTP_LENGTH && digits.every(d => d !== '')) {
      handleVerify(code);
    }
  }, [code]);

  const handleVerify = async (otp: string) => {
    if (otp.length < OTP_LENGTH) { setError('Please enter the complete 6-digit code.'); return; }
    setError(''); setLoading(true); setResendMessage('');
    try {
      const res = await fetch('/api/v1/auth/otp/verify/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otp, user_id: pendingAuth.pending_user_id, purpose }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || data?.detail || 'Invalid or expired code. Please try again.'); setDigits(Array(OTP_LENGTH).fill('')); inputRefs.current[0]?.focus(); return; }
      
      if (isEmailVerification) {
        toast.success('Email verified successfully! Please sign in again.');
        // Optionally logout just to clear the immediate token if the backend issued one automatically
        fetch('/api/v1/auth/logout/', { method: 'POST', credentials: 'include' }).catch(() => {});
        sessionStorage.removeItem('pendingAuth');
        navigate('/login', { replace: true });
      } else {
        if (data?.data?.access) localStorage.setItem('access_token', data.data.access);
        navigate(returnUrl, { replace: true });
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleResend = async () => {
    if (!pendingAuth.pending_user_id) return;
    setResendLoading(true);
    setResendMessage('');
    setError('');
    try {
      const res = await fetch('/api/v1/auth/otp/resend/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: pendingAuth.pending_user_id, purpose })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message || data?.detail || data?.message || 'Failed to resend OTP. Please try again later.');
      } else {
        setResendMessage('A new OTP has been sent successfully.');
        setDigits(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    // Handle paste of full code
    if (val.length === OTP_LENGTH) {
      const pasted = val.slice(0, OTP_LENGTH).split('');
      setDigits(pasted);
      inputRefs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    next[idx] = val.slice(-1);
    setDigits(next);
    if (val && idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const steps = isEmailVerification ? [
    { num: 1, title: 'Sign In', desc: 'Securely verify your credentials.' },
    { num: 2, title: 'Email Verification', desc: 'Enter the 6-digit code sent to your email.' },
    { num: 3, title: 'Secure Workspace', desc: 'Access your enterprise applications safely.' }
  ] : [
    { num: 1, title: 'Sign In', desc: 'Securely verify your credentials.' },
    { num: 2, title: 'Two-Factor Authentication', desc: 'Enter the 6-digit code to prove your identity.' },
    { num: 3, title: 'Secure Workspace', desc: 'Access your enterprise applications safely.' }
  ];
  const currentStep = 2;

  const leftPanelContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', maxWidth: '420px', paddingRight: '20px' }}>
      <style>{`
        @keyframes activeStepPulse {
          0% { box-shadow: 0 0 0 0 ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}; }
          70% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
        .step-item { transition: transform 0.3s ease; }
        .step-item.active { transform: translateX(5px); }
      `}</style>

      <div>
        <h3 style={{ 
          fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', 
          fontWeight: 800, 
          marginBottom: '0.75rem', 
          color: isDark ? '#ffffff' : '#0f172a',
          letterSpacing: '-0.5px'
        }}>
          Identity Verification
        </h3>
        <p style={{
          fontSize: '1rem',
          lineHeight: 1.6,
          color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
          margin: 0
        }}>
          We require an extra layer of security before granting access.
        </p>
      </div>
      
      <div style={{ position: 'relative', paddingLeft: '0.5rem' }}>
        {/* Connecting Line */}
        <div style={{
          position: 'absolute',
          top: '24px',
          bottom: '30px',
          left: '25px',
          width: '2px',
          background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.15)',
          zIndex: 0
        }} />

        {steps.map((step, idx) => {
          const isActive = step.num === currentStep;
          const isPast = step.num < currentStep;
          
          return (
            <div 
              key={step.num} 
              className={`step-item ${isActive ? 'active' : ''}`}
              style={{ 
                display: 'flex', 
                gap: '1.25rem', 
                marginBottom: idx === steps.length - 1 ? 0 : '2.5rem', 
                position: 'relative', 
                zIndex: 1,
                opacity: (isActive || isPast) ? 1 : 0.6
              }}
            >
              {/* Step Indicator */}
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                flexShrink: 0,
                background: isActive ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : (isPast ? (isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)') : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)')),
                color: isActive ? '#fff' : (isPast ? '#4f46e5' : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.3)')),
                animation: isActive ? 'activeStepPulse 2s infinite' : 'none',
                border: isActive ? 'none' : `1px solid ${isPast ? 'rgba(99,102,241,0.3)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)')}`,
                boxShadow: isActive ? `0 4px 12px ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.25)'}` : 'none',
              }}>
                {isPast ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : step.num}
              </div>
              
              {/* Step Content */}
              <div style={{ paddingTop: '5px' }}>
                <div style={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 800, 
                  color: isActive ? (isDark ? '#ffffff' : '#0f172a') : (isPast ? (isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)') : (isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)')),
                  marginBottom: '0.35rem',
                  letterSpacing: '-0.3px'
                }}>
                  {step.title}
                </div>
                <div style={{ 
                  fontSize: '0.95rem', 
                  lineHeight: 1.6,
                  color: isActive ? (isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)') : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)')
                }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const heading = isEmailVerification ? "Email Verification" : "Two-factor verification";
  const subheading = isEmailVerification ? `Enter the 6-digit code sent to ${pendingAuth.email_masked || 'your email'}.` : "Enter the 6-digit code sent to your registered email address.";

  return (
    <AuthLayout heading={heading} subheading={subheading} leftPanelContent={leftPanelContent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)', border: `1px solid ${isDark ? 'rgba(248,113,113,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>{error}</div>}
        {resendMessage && <div style={{ background: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.06)', border: `1px solid ${isDark ? 'rgba(74,222,128,0.25)' : 'rgba(34,197,94,0.2)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#22c55e' }}>{resendMessage}</div>}

        {/* OTP input boxes */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 8, marginTop: 8 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={OTP_LENGTH}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading || resendLoading}
              style={{
                width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700,
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
                border: `1.5px solid ${d ? 'rgba(99,102,241,0.6)' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.22)'}`,
                borderRadius: 10, color: isDark ? '#ffffff' : '#0f172a', outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#4f46e5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.15)'; }}
              onBlur={e => { if (!d) e.currentTarget.style.borderColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.22)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          ))}
        </div>

        <button
          style={{ 
            width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', color: '#fff', 
            padding: '12px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: (loading || code.length < OTP_LENGTH || resendLoading) ? 'not-allowed' : 'pointer', 
            boxShadow: '0 4px 20px rgba(99,102,241,0.42)', opacity: (loading || code.length < OTP_LENGTH || resendLoading) ? 0.6 : 1 
          }}
          disabled={loading || code.length < OTP_LENGTH || resendLoading}
          onClick={() => handleVerify(code)}
        >
          {loading ? 'Verifying…' : 'Verify Code'}
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <button 
            onClick={handleResend}
            disabled={loading || resendLoading}
            style={{ 
              background: 'none', border: 'none', padding: 0, 
              fontSize: 13, color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,23,42,0.7)',
              cursor: (loading || resendLoading) ? 'not-allowed' : 'pointer',
              opacity: (loading || resendLoading) ? 0.6 : 1,
              textDecoration: 'underline'
            }}
          >
            {resendLoading ? 'Resending...' : 'Resend Code'}
          </button>
          
          <Link to="/login" style={{ fontSize: 13, color: isDark ? 'rgba(129,140,248,0.9)' : 'rgba(79,70,229,0.9)', textDecoration: 'none' }}>
            â† Back to Sign In
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
