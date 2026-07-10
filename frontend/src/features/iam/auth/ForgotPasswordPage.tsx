/**
 * YSS Orbit - ForgotPasswordPage
 * Sends OTP via POST /api/v1/auth/password/forgot/
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts/auth/AuthLayout';

function getIsDark() { return document.documentElement.classList.contains('dark'); }

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(getIsDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError('Please enter your username.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/password/forgot/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data?.error?.message || data?.detail || 'Something went wrong. Please try again.');
        return;
      }
      
      // Navigate to OTP verify page and pass username in state
      navigate('/forgot-password/otp', { state: { username: username.trim() } });
      
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { num: 1, title: 'Account Recovery', desc: 'Enter your registered username to begin.' },
    { num: 2, title: 'Verify Identity', desc: 'Check your email for a secure 6-digit OTP.' },
    { num: 3, title: 'Reset Password', desc: 'Create and confirm your new password.' }
  ];
  const currentStep = 1;

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
    <AuthLayout heading="Reset Password" subheading="Enter your username to receive an OTP" leftPanelContent={leftPanelContent}>
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)', border: `1px solid ${isDark ? 'rgba(248,113,113,0.25)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
            {error}
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          <label htmlFor="username" style={{ fontSize: '0.85rem', fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)' }}>
            Username
          </label>
          <input
            id="username" type="text" autoComplete="username"
            placeholder="e.g. mahesh" value={username}
            onChange={e => setUsername(e.target.value)}
            disabled={loading}
            style={{
              width: '100%', height: '2.75rem', padding: '0 0.875rem', borderRadius: '0.625rem',
              border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.22)'}`,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '0.9rem', outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <button style={{ 
          width: '100%', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', border: 'none', color: '#fff', 
          padding: '12px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', 
          boxShadow: '0 4px 20px rgba(99,102,241,0.42)', opacity: loading ? 0.7 : 1, marginTop: '0.5rem'
        }} type="submit" disabled={loading}>
          {loading ? 'Sending OTP…' : 'Send OTP'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)', marginTop: 8, marginBottom: 0 }}>
          <Link to="/login" style={{ color: isDark ? 'rgba(129,140,248,0.9)' : 'rgba(79,70,229,0.9)', textDecoration: 'none' }}>
            â† Back to Sign In
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
