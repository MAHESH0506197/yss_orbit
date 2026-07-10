// yss_orbit/frontend/src/layouts/auth/AuthLayout.tsx
// v8 — Larger text on left, orbit fully visible (no clipping), certifications stay at bottom without scroll.
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, FileText, Sun, Moon, LogIn, Users } from 'lucide-react';
import { useBrandingContext } from '@/utils/shared/hooks/useBrandingContext';
import { AuthIllustration } from '@/components/ui/AuthIllustration';

interface AuthLayoutProps {
  children?: React.ReactNode;
  illustration?: React.ReactNode;
  heading?: string;
  subheading?: string;
  leftPanelContent?: React.ReactNode;
}

function getIsDark() { return document.documentElement.classList.contains('dark'); }

function tokens(dark: boolean) {
  return {
    pillBorder:    dark ? 'rgba(129,140,248,0.35)' : 'rgba(99,102,241,0.3)',
    pillBg:        dark ? 'rgba(99,102,241,0.13)'  : 'rgba(99,102,241,0.07)',
    pillText:      dark ? '#a5b4fc'                : '#4338ca',
    h2Color:       dark ? '#ffffff'                : '#0f172a',
    descColor:     dark ? 'rgba(255,255,255,0.7)'  : 'rgba(15,23,42,0.7)',
    mutedColor:    dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)',
    certLine:      dark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)',
    cardBg:        dark ? 'rgba(15,23,42,0.80)'    : 'rgba(255,255,255,0.96)',
    cardBorder:    dark ? 'rgba(129,140,248,0.18)' : 'rgba(99,102,241,0.15)',
    cardShadow:    dark
      ? '0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.06)'
      : '0 32px 80px rgba(99,102,241,0.12),0 8px 24px rgba(0,0,0,0.06)',
    cardHighlight: dark
      ? 'linear-gradient(90deg,transparent,rgba(129,140,248,0.25),transparent)'
      : 'linear-gradient(90deg,transparent,rgba(99,102,241,0.14),transparent)',
    headingColor:  dark ? '#f8faff'                : '#0f172a',
    subColor:      dark ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.6)',
    toggleBg:      dark ? 'rgba(99,102,241,0.18)'  : 'rgba(99,102,241,0.09)',
    toggleBorder:  dark ? 'rgba(129,140,248,0.28)' : 'rgba(99,102,241,0.22)',
    toggleColor:   dark ? '#a5b4fc'                : '#4338ca',
    mobileSub:     dark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.5)',
  };
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  illustration,
  heading = 'Welcome Back',
  subheading = 'Access your secure workspace',
  leftPanelContent,
}) => {
  const { config, isLoading } = useBrandingContext();
  const logoSrc = config?.logo_url || '/images/branding/YSS_Logo.png';
  const appName = 'YSS Orbit';
  const isCoBrand = config?.mode === 'co_brand';
  const isWhiteLabel = config?.mode === 'white_label';

  const [isDark, setIsDark] = useState(getIsDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('yss-orbit-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  };

  const t = tokens(isDark);

  return (
    <div style={{
      position:   'relative',
      width:      '100%',
      minHeight:  '100vh',
      margin:     0,
      padding:    0,
      overflow:   'hidden',
      background: isDark
        ? 'linear-gradient(145deg,#080d1e 0%,#0f1535 35%,#131040 65%,#09080f 100%)'
        : 'linear-gradient(145deg,#eef2ff 0%,#f0f4ff 40%,#faf5ff 70%,#f8faff 100%)',
      fontFamily: "'Sora',ui-sans-serif,system-ui,sans-serif",
      transition: 'background 0.45s',
      boxSizing:  'border-box',
    }}>

      {/* Ambient glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: isDark
          ? `radial-gradient(ellipse 65% 60% at 15% 40%,rgba(99,102,241,0.14) 0%,transparent 65%),
             radial-gradient(ellipse 50% 45% at 80% 70%,rgba(168,85,247,0.10) 0%,transparent 60%)`
          : `radial-gradient(ellipse 65% 60% at 15% 40%,rgba(99,102,241,0.09) 0%,transparent 65%),
             radial-gradient(ellipse 50% 45% at 80% 70%,rgba(168,85,247,0.06) 0%,transparent 60%)`,
        transition: 'background 0.45s',
      }} />

      {/* Theme toggle */}
      <button type="button" onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 50,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '2.5rem', height: '2.5rem', borderRadius: '50%',
          background: t.toggleBg, border: `1.5px solid ${t.toggleBorder}`,
          color: t.toggleColor, cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.35s',
        }}>
        {isDark ? <Sun style={{ width: '1.1rem', height: '1.1rem' }} /> : <Moon style={{ width: '1.1rem', height: '1.1rem' }} />}
      </button>

      {/* ── Main flex ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', minHeight: '100vh' }}>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            LEFT PANEL
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <aside className="auth-left-panel" style={{
          display:        'none',
          flexDirection:  'column',
          justifyContent: 'space-between',
          width: '56%', maxWidth: '780px',
          flexShrink: 0,
          position: 'relative',
          /* REMOVED overflow:hidden so the orbit doesn't get clipped on the left edge */
          padding: 'clamp(1.5rem,2.5vh,2rem) 0 clamp(1.2rem,2vh,1.5rem) clamp(1.5rem,2.5vw,3rem)',
        }}>

          {/* ── Orbit: anchored right, allowed to overflow container slightly ── */}
          <AuthIllustration style={{
            position:  'absolute',
            right:     '-2%',
            top:       '50%',
            transform: 'translateY(-50%)',
            width:     'clamp(380px,52%,580px)',
            height:    'clamp(380px,52%,580px)',
            opacity:   isDark ? 0.95 : 0.90,
            transition:'opacity 0.45s',
            zIndex:    0,
            pointerEvents: 'none',
          }} />

          {/* ── TOP: text content (Larger Font Sizes) ── */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '58%' }}>
            
            {/* Logo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
              <img src={logoSrc} alt={`${appName} Logo`} className="auth-logo-anim" style={{
                height: 'clamp(48px,6vh,65px)', width: 'auto', objectFit: 'contain',
                filter: isDark
                  ? 'drop-shadow(0 4px 14px rgba(99,102,241,0.45))'
                  : 'drop-shadow(0 4px 14px rgba(99,102,241,0.22))',
              }} />
              {isCoBrand && (
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: t.mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '0.25rem' }}>
                  Powered by YSS Orbit
                </span>
              )}
            </div>
            


            {leftPanelContent ? (
              <div style={{ marginTop: '1.25rem' }}>
                {leftPanelContent}
              </div>
            ) : (
              <>
                {/* Pill */}
                <div style={{ marginTop: 'clamp(1.2rem,2.5vh,2rem)' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', borderRadius: '9999px',
                    border: `1px solid ${t.pillBorder}`, background: t.pillBg,
                    padding: '0.3rem 1rem',
                    fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', color: t.pillText,
                    backdropFilter: 'blur(8px)',
                  }}>
                    The YSS Orbit Ecosystem
                  </span>
                </div>

                {/* Headline */}
                <h2 style={{
                  marginTop: 'clamp(1rem,2vh,1.5rem)',
                  fontSize: 'clamp(2.1rem,3.2vw,3.8rem)',
                  fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.03em',
                  color: t.h2Color,
                }}>
                  Unified <span style={{
                    background: 'linear-gradient(135deg,#818cf8 0%,#c084fc 50%,#38bdf8 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>Intelligence</span><br />
                  for Every Operation
                </h2>

                {/* Description */}
                <p style={{
                  marginTop: 'clamp(0.8rem,1.5vh,1.2rem)',
                  fontSize: 'clamp(0.95rem,1.3vw,1.15rem)',
                  lineHeight: 1.75,
                  color: t.descColor,
                }}>
                  YSS Orbit is an enterprise platform that unifies HRMS, POS, Pharmacy, 
                  Inventory, CRM, and Analytics into a single, secure, multi-tenant ecosystem built for scale.
                </p>

                {/* Module pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'clamp(1rem,1.8vh,1.5rem)' }}>
                  {['HRMS','POS','Pharmacy','Inventory','CRM','Analytics'].map(m => (
                    <span key={m} style={{
                      fontSize: '0.75rem', fontWeight: 600,
                      padding: '0.25rem 0.75rem', borderRadius: '9999px',
                      background: t.pillBg, border: `1px solid ${t.pillBorder}`,
                      color: t.pillText,
                    }}>{m}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── BOTTOM: Certifications (Actually implemented!) ── */}
          <div style={{ position: 'relative', zIndex: 2, maxWidth: '60%' }}>
            <div style={{
              paddingTop: '1rem',
              borderTop: `1px solid ${t.certLine}`,
              display: 'flex', flexWrap: 'wrap', gap: '1.25rem', alignItems: 'center',
            }}>
              {[
                { 
                  Icon: ShieldCheck, 
                  label: 'Enterprise-Grade Security',             
                  color: '#10b981',
                  tooltip: 'Protected by state-of-the-art cloud infrastructure, 24/7 proactive monitoring, and industry-leading security practices.',
                  align: 'left'
                },
                { 
                  Icon: Users,        
                  label: 'Role-Based Access',     
                  color: '#60a5fa',
                  tooltip: 'Ensure the right people have the right access. Precisely control and restrict permissions for every employee, manager, and administrator.',
                  align: 'center'
                },
                { 
                  Icon: Lock,    
                  label: 'End-to-End Encrypted',          
                  color: '#a78bfa',
                  tooltip: 'Your sensitive business information is heavily encrypted at rest and in transit, meaning unauthorized parties can never read your data.',
                  align: 'center'
                },
              ].map(({ Icon, label, color, tooltip, align }) => (
                <div 
                  key={label} 
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', position: 'relative', cursor: 'pointer' }}
                  onMouseEnter={() => setActiveTooltip(label)}
                  onMouseLeave={() => setActiveTooltip(null)}
                  onClick={() => setActiveTooltip(activeTooltip === label ? null : label)}
                >
                  <Icon style={{ width: '0.9rem', height: '0.9rem', color, flexShrink: 0 }} />
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', color: t.mutedColor,
                  }}>{label}</span>

                  {/* Tooltip Popup */}
                  {activeTooltip === label && (
                    <div style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 0.8rem)',
                      left: align === 'left' ? '-10px' : '50%',
                      transform: align === 'left' ? 'none' : 'translateX(-50%)',
                      width: '260px',
                      padding: '0.85rem',
                      background: isDark ? 'rgba(30,41,59,0.98)' : 'rgba(255,255,255,0.98)',
                      border: `1px solid ${t.certLine}`,
                      borderRadius: '0.6rem',
                      boxShadow: '0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 15px -6px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(16px)',
                      zIndex: 9999,
                      animation: align === 'left' ? 'tooltip-fade-in-left 0.2s ease-out forwards' : 'tooltip-fade-in-center 0.2s ease-out forwards',
                    }}>
                      {/* Tooltip pointer arrow */}
                      <div style={{
                        position: 'absolute',
                        bottom: '-0.3rem',
                        left: align === 'left' ? '1.5rem' : '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        width: '0.6rem',
                        height: '0.6rem',
                        background: isDark ? 'rgba(30,41,59,0.98)' : 'rgba(255,255,255,0.98)',
                        borderRight: `1px solid ${t.certLine}`,
                        borderBottom: `1px solid ${t.certLine}`,
                      }} />
                      <p style={{
                        margin: 0,
                        fontSize: '0.78rem',
                        lineHeight: 1.5,
                        color: t.h2Color,
                        fontWeight: 500,
                        textAlign: 'left'
                      }}>{tooltip}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            RIGHT PANEL — auth card
        â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section style={{
          flex: '1 1 0%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          paddingTop:    'clamp(2rem,6vh,5rem)',
          paddingBottom: 'clamp(1.5rem,3vh,2.5rem)',
          paddingLeft:   'clamp(1rem,2.5vw,2rem)',
          paddingRight:  'clamp(1rem,2.5vw,2.5rem)',
          minHeight: '100vh',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 10,
        }}>
          <div style={{ width: '100%', maxWidth: '440px' }}>

            {/* Mobile branding */}
            <div className="auth-mobile-brand" style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>
                <img src={logoSrc} alt={`${appName} Logo`} className="auth-logo-anim"
                  style={{ height: '56px', width: 'auto', maxWidth: '160px', objectFit: 'contain' }} />
                {isCoBrand && (
                  <span style={{ fontSize: '0.6rem', fontWeight: 600, color: t.mutedColor, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Powered by YSS Orbit
                  </span>
                )}
              </div>
              <p style={{
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.13em',
                textTransform: 'uppercase', color: t.mobileSub, margin: 0,
              }}>The YSS Orbit Ecosystem</p>
            </div>

            {/* Glass card */}
            <div style={{
              position: 'relative',
              borderRadius: '1.75rem',
              border: `1px solid ${t.cardBorder}`,
              background: t.cardBg,
              backdropFilter: 'blur(32px) saturate(1.8)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
              boxShadow: t.cardShadow,
              padding: 'clamp(1.75rem,4vw,2.75rem)',
              transition: 'background 0.45s, border-color 0.45s, box-shadow 0.45s',
            }}>
              {/* Top highlight */}
              <div aria-hidden="true" style={{
                position: 'absolute', top: 0, left: '8%', right: '8%',
                height: '1px', background: t.cardHighlight, borderRadius: '9999px',
              }} />

              {/* Card Header: Icon + Heading side-by-side */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem' }}>
                {/* Login icon */}
                <div style={{
                  width: '3.2rem', height: '3.2rem', borderRadius: '0.85rem', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--color-primary, #4f46e5) 0%, var(--color-primary-dark, #7c3aed) 60%, #2563eb 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isDark
                    ? '0 4px 18px rgba(99,102,241,0.55)'
                    : '0 4px 18px rgba(99,102,241,0.35)',
                }}>
                  <LogIn style={{ width: '1.4rem', height: '1.4rem', color: '#fff' }} />
                </div>

                {/* Heading */}
                <div>
                  <h2 style={{
                    fontSize: 'clamp(1.4rem,2.2vw,1.75rem)', fontWeight: 800,
                    letterSpacing: '-0.03em', color: t.headingColor,
                    margin: '0 0 0.25rem', transition: 'color 0.45s',
                  }}>{heading}</h2>
                  <p style={{
                    fontSize: 'clamp(0.8rem,1vw,0.85rem)', color: t.subColor,
                    margin: 0, lineHeight: 1.5, transition: 'color 0.45s',
                  }}>{subheading}</p>
                </div>
              </div>

              <div>{children}</div>
            </div>

            {illustration && (
              <div className="auth-mobile-brand" style={{ marginTop: '1.5rem' }}>{illustration}</div>
            )}
          </div>
        </section>
      </div>

      {/* ── Responsive & Animation rules ── */}
      <style>{`
        @keyframes auth-logo-float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .auth-logo-anim {
          animation: auth-logo-float 5s ease-in-out infinite;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
          cursor: pointer;
        }
        .auth-logo-anim:hover {
          transform: scale(1.08) translateY(-2px) !important;
          animation-play-state: paused;
          filter: drop-shadow(0 12px 28px rgba(99, 102, 241, 0.65)) !important;
        }

        @media (min-width: 1024px) {
          .auth-left-panel   { display: flex  !important; }
          .auth-mobile-brand { display: none  !important; }
        }
        @media (max-width: 1023px) {
          .auth-left-panel   { display: none  !important; }
          .auth-mobile-brand { display: block !important; }
        }
        @media (min-width: 1024px) and (max-width: 1280px) {
          .auth-left-panel { width: 54% !important; }
        }
        @media (max-width: 767px) {
          section {
            padding-top:   1.25rem !important;
            padding-left:  1rem !important;
            padding-right: 1rem !important;
          }
        }
        @media (max-width: 380px) {
          section {
            padding-top:   1rem !important;
            padding-left:  0.75rem !important;
            padding-right: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;
