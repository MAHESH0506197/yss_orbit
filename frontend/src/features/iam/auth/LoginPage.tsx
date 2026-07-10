// yss_orbit/frontend/src/features/iam/auth/pages/LoginPage.tsx
// Full light + dark mode form inputs — reads `isDark` from <html>.dark class.
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Lock, AlertTriangle } from 'lucide-react';
import { AuthLayout } from '@/components/layouts/auth/AuthLayout';

// 4.4 fix: C-2 — Use canonical useLogin hook (HttpOnly cookies, full post-login routing).
// Previous implementation called apiService directly and stored localStorage.setItem('access_token')
// which is a CRITICAL B06 Â§5.10 violation. localStorage tokens are readable by any JS (XSS).
import { api } from '@/api/client';
import { useLogin } from '@/features/iam/auth/hooks/useAuth';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormValues = z.infer<typeof loginSchema>;

/* ── Theme helper ── */
function getIsDark() {
  return document.documentElement.classList.contains('dark');
}
function useIsDark() {
  const [dark, setDark] = useState(getIsDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(getIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/* ── Design tokens per mode ── */
function tokens(dark: boolean) {
  return {
    labelColor:      dark ? 'rgba(255,255,255,0.85)' : 'rgba(15,23,42,0.85)',
    inputBg:         dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.85)',
    inputBorder:     dark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.22)',
    inputBorderErr:  dark ? 'rgba(248,113,113,0.55)' : 'rgba(239,68,68,0.5)',
    inputBorderFoc:  dark ? 'rgba(99,102,241,0.7)'   : 'rgba(99,102,241,0.65)',
    inputBgFoc:      dark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,1)',
    inputText:       dark ? '#ffffff'                : '#0f172a',
    inputPlaceholder:dark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.4)',
    iconColor:       dark ? 'rgba(255,255,255,0.4)'  : 'rgba(15,23,42,0.4)',
    errText:         '#f87171',
    errBg:           dark ? 'rgba(239,68,68,0.1)'    : 'rgba(239,68,68,0.06)',
    errBorder:       dark ? 'rgba(248,113,113,0.25)' : 'rgba(239,68,68,0.2)',
    linkColor:       dark ? 'rgba(129,140,248,0.9)'  : 'rgba(79,70,229,0.9)',
    footerColor:     dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)',
    btnGrad:         'linear-gradient(135deg, var(--color-primary, #4f46e5) 0%, var(--color-primary-dark, #7c3aed) 100%)',
    btnGradDis:      'rgba(99,102,241,0.45)',
    btnShadow:       '0 4px 20px rgba(99,102,241,0.42)',
  };
}

/* ── Field wrapper ── */
interface FieldProps {
  label: string; id: string; error?: string;
  labelRight?: React.ReactNode; children: React.ReactNode;
  t: ReturnType<typeof tokens>;
}
function Field({ label, id, error, labelRight, children, t }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label htmlFor={id} style={{ fontSize: '0.85rem', fontWeight: 500, color: t.labelColor, cursor: 'pointer', transition: 'color 0.3s' }}>
          {label}
        </label>
        {labelRight}
      </div>
      {children}
      {error && <p style={{ fontSize: '0.78rem', color: t.errText, marginTop: '0.1rem' }}>{error}</p>}
    </div>
  );
}

/* ── Text input ── */
interface TIProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconLeft?: React.ReactNode; iconRight?: React.ReactNode;
  hasError?: boolean; t: ReturnType<typeof tokens>;
}
const TextInput = React.forwardRef<HTMLInputElement, TIProps>(
  ({ iconLeft, iconRight, hasError, t, style, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {iconLeft && (
          <span style={{ position: 'absolute', left: '0.75rem', display: 'flex', alignItems: 'center', color: t.iconColor, pointerEvents: 'none', zIndex: 1, transition: 'color 0.3s' }}>
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          style={{
            width:         '100%',
            height:        '2.75rem',
            paddingLeft:   iconLeft  ? '2.5rem' : '0.875rem',
            paddingRight:  iconRight ? '2.5rem' : '0.875rem',
            borderRadius:  '0.625rem',
            border:        `1.5px solid ${hasError ? t.inputBorderErr : focused ? t.inputBorderFoc : t.inputBorder}`,
            background:    focused ? t.inputBgFoc : t.inputBg,
            color:         t.inputText,
            fontSize:      '0.9rem',
            outline:       'none',
            transition:    'border-color 0.2s, background 0.2s, color 0.3s',
            boxSizing:     'border-box',
            fontFamily:    'inherit',
            ...style,
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {iconRight && (
          <span style={{ position: 'absolute', right: '0.75rem', display: 'flex', alignItems: 'center', color: t.iconColor, zIndex: 1, transition: 'color 0.3s' }}>
            {iconRight}
          </span>
        )}
      </div>
    );
  }
);
TextInput.displayName = 'TextInput';

/* ── Password input with show/hide ── */
const PasswordInput = React.forwardRef<HTMLInputElement, Omit<TIProps, 'iconRight' | 'type'>>(
  (props, ref) => {
    const [show, setShow] = React.useState(false);
    const EyeIcon = () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {show
          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        }
      </svg>
    );
    return (
      <TextInput
        {...props}
        ref={ref}
        type={show ? 'text' : 'password'}
        iconRight={
          <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'} tabIndex={-1}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', display: 'flex' }}>
            <EyeIcon />
          </button>
        }
      />
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

/* ── Submit button ── */
function SubmitBtn({ loading, children, t }: { loading?: boolean; children: React.ReactNode; t: ReturnType<typeof tokens> }) {
  return (
    <button
      type="submit" disabled={loading}
      style={{
        width: '100%', height: '2.875rem', borderRadius: '0.625rem', border: 'none',
        background:     loading ? t.btnGradDis : t.btnGrad,
        color:          '#fff', fontSize: '0.95rem', fontWeight: 700,
        letterSpacing:  '0.01em',
        cursor:         loading ? 'not-allowed' : 'pointer',
        transition:     'opacity 0.2s, transform 0.2s, background 0.3s',
        boxShadow:      loading ? 'none' : t.btnShadow,
        fontFamily:     'inherit',
        display:        'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
    >
      {loading && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ animation: 'lgn-spin 0.8s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      )}
      {children}
      <style>{`@keyframes lgn-spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LOGIN PAGE
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function LoginPage() {
  const [params] = useSearchParams();
  const [globalError, setGlobalError] = useState('');
  
  // Unlock flow state
  const [lockedUsername, setLockedUsername] = useState('');
  const [unlockMode, setUnlockMode] = useState<'none'|'request'|'verify'|'success'>('none');
  const [unlockOTP, setUnlockOTP] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const isDark = useIsDark();
  const t = tokens(isDark);

  // 4.4 fix: Canonical hook — handles routing, authStore update, HttpOnly cookie auth.
  // Previous code did: localStorage.setItem('access_token', res.token) — CRITICAL B06 Â§5.10 violation.
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setGlobalError('');
    try {
      await loginMutation.mutateAsync({
        username: data.username.trim(),
        password: data.password,
      });
      // Routing is handled inside useLogin's onSuccess per B06 Â§5.19 post-login matrix.
    } catch (err: any) {
      const errCode = err?.response?.data?.error?.code;
      if (errCode === 'ACCOUNT_LOCKED') {
        const defaultBackendMsg = err?.response?.data?.error?.message || 'Your account is locked due to multiple failed login attempts.';
        setGlobalError(
          `${defaultBackendMsg}\n\nTo unlock your account immediately, you have two options:\n1. Click "Unlock Account" below to receive a secure OTP via email.\n2. Click "Forgot password?" to securely reset your password.`
        );
        setLockedUsername(err?.response?.data?.error?.details?.username || data.username);
        setUnlockMode('request');
      } else {
        setGlobalError(
          err?.response?.data?.error?.message ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          'Invalid credentials. Please try again.'
        );
        setUnlockMode('none');
      }
    }
  };

  const handleRequestUnlock = async () => {
    try {
      setUnlockLoading(true);
      setGlobalError('');
      await api.post('/api/v1/auth/unlock/request/', { username: lockedUsername });
      setUnlockMode('verify');
    } catch (e: any) {
      setGlobalError('Failed to request unlock OTP. Please try again.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleVerifyUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockOTP) return;
    try {
      setUnlockLoading(true);
      setGlobalError('');
      await api.post('/api/v1/auth/otp/verify/', { 
        username: lockedUsername, 
        otp: unlockOTP, 
        purpose: 'ACCOUNT_UNLOCK' 
      });
      setUnlockMode('success');
      setGlobalError('');
    } catch (e: any) {
      setGlobalError(e?.response?.data?.error?.message || 'Invalid or expired OTP.');
    } finally {
      setUnlockLoading(false);
    }
  };

  return (
    <AuthLayout heading="Welcome Back" subheading="Sign in to your enterprise workspace">

      {/* Global error */}
      {globalError && (
        <div style={{
          marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.625rem',
          borderRadius: '0.625rem', border: `1px solid ${t.errBorder}`, background: t.errBg,
          padding: '0.75rem 1rem', fontSize: '0.85rem', fontWeight: 500, color: t.errText,
          transition: 'background 0.3s, border-color 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
            <AlertTriangle style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0, marginTop: '0.05rem' }} />
            <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{globalError}</p>
          </div>
          
          {unlockMode === 'request' && (
            <button 
              type="button" 
              onClick={handleRequestUnlock}
              disabled={unlockLoading}
              style={{
                marginTop: '0.5rem',
                alignSelf: 'flex-start',
                padding: '0.4rem 0.8rem',
                borderRadius: '0.4rem',
                border: `1px solid ${t.linkColor}`,
                background: 'transparent',
                color: t.linkColor,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: unlockLoading ? 'not-allowed' : 'pointer',
                opacity: unlockLoading ? 0.6 : 1
              }}
            >
              {unlockLoading ? 'Sending...' : 'Unlock Account'}
            </button>
          )}
        </div>
      )}

      {unlockMode === 'verify' && (
        <form onSubmit={handleVerifyUnlock} style={{ marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', background: t.inputBg, borderRadius: '0.5rem', border: `1px solid ${t.inputBorder}` }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: t.labelColor }}>An unlock code has been sent to your email.</p>
          <TextInput
            placeholder="Enter 6-digit OTP"
            value={unlockOTP}
            onChange={(e) => setUnlockOTP(e.target.value)}
            disabled={unlockLoading}
            t={t}
          />
          <SubmitBtn loading={unlockLoading} t={t}>
            {unlockLoading ? 'Verifying...' : 'Verify & Unlock'}
          </SubmitBtn>
        </form>
      )}

      {unlockMode === 'success' && (
        <div style={{ marginBottom: '1.25rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '0.5rem', color: '#22c55e', fontSize: '0.85rem', fontWeight: 500 }}>
          Account unlocked successfully. You may now sign in.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Username */}
        <Field label="Username" id="username" error={errors.username?.message} t={t}>
          <TextInput id="username" placeholder="Enter your username" autoComplete="username"
            iconLeft={<User style={{ width: '1rem', height: '1rem' }} />}
            hasError={!!errors.username} disabled={isSubmitting} t={t}
            {...register('username')} />
        </Field>

        {/* Password */}
        <Field
          label="Password" id="password" error={errors.password?.message} t={t}
          labelRight={
            <Link to="/forgot-password" tabIndex={-1}
              style={{ fontSize: '0.78rem', fontWeight: 500, color: t.linkColor, textDecoration: 'none', transition: 'color 0.3s' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              Forgot password?
            </Link>
          }
        >
          <PasswordInput id="password" placeholder="••••••••" autoComplete="current-password"
            iconLeft={<Lock style={{ width: '1rem', height: '1rem' }} />}
            hasError={!!errors.password} disabled={isSubmitting} t={t}
            {...register('password')} />
        </Field>

        <SubmitBtn loading={isSubmitting} t={t}>
          {isSubmitting ? 'Authenticating…' : 'Sign In'}
        </SubmitBtn>
      </form>


    </AuthLayout>
  );
}
