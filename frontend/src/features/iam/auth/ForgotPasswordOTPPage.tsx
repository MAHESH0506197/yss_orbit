/**
 * YSS Orbit — ForgotPasswordOTPPage
 * Step 2 of password reset flow: Collects the OTP.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/auth/AuthLayout';

function getIsDark() { return document.documentElement.classList.contains('dark'); }

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function ForgotPasswordOTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username;

  const [isDark, setIsDark] = useState(getIsDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!username) {
      navigate('/forgot-password');
    }
  }, [username, navigate]);

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [error, setError] = useState('');
  
  // Resend Timer State
  const [timeLeft, setTimeLeft] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (timeLeft <= 0) return undefined;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const code = digits.join('');

  const handleNext = (otp: string) => {
    if (otp.length < OTP_LENGTH) { setError('Please enter the complete 6-digit code.'); return; }
    navigate('/reset-password', { state: { username, otp } });
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isResending) return;
    setIsResending(true);
    setError('');
    setResendMessage('');
    try {
      const res = await fetch('/auth/password/forgot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || data?.detail || 'Failed to resend OTP');
      }
      setResendMessage('A new OTP has been sent!');
      setTimeLeft(RESEND_COOLDOWN);
      setDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Unable to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    if (val.length === OTP_LENGTH) {
      setDigits(val.slice(0, OTP_LENGTH).split(''));
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

  if (!username) return null;

  const steps = [
    { num: 1, title: 'Account Recovery', desc: 'Enter your registered username to begin.' },
    { num: 2, title: 'Verify Identity', desc: 'Check your email for a secure 6-digit OTP.' },
    { num: 3, title: 'Reset Password', desc: 'Create and confirm your new password.' }
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
          Password Reset
        </h3>
        <p style={{
          fontSize: '1rem',
          lineHeight: 1.6,
          color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
          margin: 0
        }}>
          Follow these simple steps to regain access to your enterprise workspace.
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

  return (
    <AuthLayout heading="Check your inbox" subheading={`Enter the 6-digit code we sent to the email associated with ${username}`} leftPanelContent={leftPanelContent}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {error && <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)', border: `1px solid ${isDark ? 'rgba(248,113,113,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>{error}</div>}
        {resendMessage && <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#10b981' }}>{resendMessage}</div>}

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
            padding: '12px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: code.length < OTP_LENGTH ? 'not-allowed' : 'pointer', 
            boxShadow: '0 4px 20px rgba(99,102,241,0.42)', opacity: code.length < OTP_LENGTH ? 0.6 : 1 
          }}
          disabled={code.length < OTP_LENGTH}
          onClick={() => handleNext(code)}
        >
          Next
        </button>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          {timeLeft > 0 ? (
            <p style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)', margin: 0 }}>
              Resend code in <strong style={{ color: isDark ? '#ffffff' : '#0f172a' }}>{timeLeft}s</strong>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              style={{
                background: 'none', border: 'none', padding: 0,
                fontSize: 13, fontWeight: 600, color: isResending ? 'rgba(99,102,241,0.5)' : '#4f46e5',
                cursor: isResending ? 'default' : 'pointer', textDecoration: 'none'
              }}
            >
              {isResending ? 'Sending...' : 'Didn\'t receive a code? Resend'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)', marginTop: 8, marginBottom: 0 }}>
          <Link to="/login" style={{ color: isDark ? 'rgba(129,140,248,0.9)' : 'rgba(79,70,229,0.9)', textDecoration: 'none' }}>
            â† Back to Sign In
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
