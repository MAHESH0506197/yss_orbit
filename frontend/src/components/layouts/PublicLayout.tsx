// yss_orbit\frontend\src\layouts\PublicLayout.tsx


import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { PublicBackground } from '@/components/background/PublicBackground';
import {
  X,
  Menu,
  ChevronRight,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Boxes,
  DollarSign,
  HeartPulse,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import SEOHead from '@/pages/welcome/components/SEOHead';
import ScrollProgressBar from '@/pages/welcome/components/ScrollProgressBar';

/* ── Third-party Scripts ─────────────────────────────────────────────── */

const ALL_SECTIONS = [
  'hero','platform','security','pricing','contact',
];

function loadCalendly() {
  const url = import.meta.env.VITE_CALENDLY_URL;
  if (!url || import.meta.env.DEV || document.getElementById('calendly-script')) return;
  const link = Object.assign(document.createElement('link'), {
    rel: 'stylesheet', href: 'https://assets.calendly.com/assets/external/widget.css',
  });
  document.head.appendChild(link);
  const script = Object.assign(document.createElement('script'), {
    id: 'calendly-script',
    src: 'https://assets.calendly.com/assets/external/widget.js',
    async: true, defer: true,
  });
  document.head.appendChild(script);
}

/* ── Inline pill theme toggle ────────────────────────────────────────────── */

const SunSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="2" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const MoonSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      fill="currentColor" fillOpacity="0.18" />
  </svg>
);

interface ThemePillProps { isDark: boolean; onToggle: () => void; }

function ThemePill({ isDark, onToggle }: ThemePillProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-pressed={isDark}
      style={{
        position:     'relative',
        display:      'flex',
        alignItems:   'center',
        width:        '60px',
        height:       '31px',
        padding:      '3px',
        borderRadius: '999px',
        cursor:       'pointer',
        flexShrink:   0,
        border:       `1.5px solid ${isDark ? 'rgba(99,102,241,0.38)' : 'rgba(251,191,36,0.52)'}`,
        background:   isDark
          ? 'linear-gradient(135deg, rgba(15,23,42,0.96) 0%, rgba(30,27,75,0.7) 100%)'
          : 'linear-gradient(135deg, #FFFBEE 0%, #FEF3C7 100%)',
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.2)'
          : '0 1px 4px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition: 'border-color 0.4s ease, background 0.4s ease, box-shadow 0.4s ease',
        overflow:   'hidden',
      }}
    >
      {/* Sliding thumb */}
      <span
        aria-hidden="true"
        style={{
          position:     'absolute',
          top:          '2.5px',
          left:         isDark ? 'calc(100% - 25px - 2.5px)' : '2.5px',
          width:        '25px',
          height:       '25px',
          borderRadius: '50%',
          background:   isDark
            ? 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)'
            : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
          boxShadow: isDark
            ? '0 0 12px rgba(99,102,241,0.72), 0 2px 5px rgba(0,0,0,0.4)'
            : '0 0 10px rgba(245,158,11,0.55), 0 2px 5px rgba(0,0,0,0.1)',
          transition: 'left 0.44s cubic-bezier(0.34,1.3,0.64,1), background 0.4s ease, box-shadow 0.4s ease',
          zIndex:     0,
        }}
      />
      {/* Sun icon */}
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '27px', height: '25px', flexShrink: 0, zIndex: 1,
        color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)',
        transition: 'color 0.4s ease',
        pointerEvents: 'none',
      }}>
        <SunSvg />
      </span>
      {/* Moon icon */}
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '27px', height: '25px', flexShrink: 0, zIndex: 1,
        color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(110,70,0,0.3)',
        transition: 'color 0.4s ease',
        pointerEvents: 'none',
      }}>
        <MoonSvg />
      </span>
    </button>
  );
}

/* ── Types ───────────────────────────────────────────────────────────────── */

interface PublicLayoutProps {
  children:   React.ReactNode;
  bgVariant?: 'hero' | 'auth';
  fullBleed?: boolean;
}

const NAV_ITEMS = [
  { label: 'Modules',  href: '#platform' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing',  href: '#pricing' },
  { label: 'Contact',  href: '#contact' },
] as const;

/* ── Component ───────────────────────────────────────────────────────────── */

export const PublicLayout: React.FC<PublicLayoutProps> = ({
  children,
  bgVariant = 'hero',
  fullBleed = false,
}) => {
  const navigate   = useNavigate();
  const location   = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const [isDark,     setIsDark]     = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  /* Track scroll */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* Sync dark-mode state with DOM (ThemeProvider manages persistence) */
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => document.documentElement.classList.toggle('dark');

  /* Close mobile menu on route change */
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isWelcomePage = location.pathname === '/';

  useEffect(() => { loadCalendly(); }, []);

  /* ── Computed visual values ─────────────────────────────────────────── */

  const headerBg = scrolled
    ? (isDark ? 'rgba(5,7,16,0.65)'      : 'rgba(255,255,255,0.75)')
    : (isDark ? 'rgba(5,7,16,0.35)'      : 'rgba(255,255,255,0.5)');

  const headerBorder = scrolled
    ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.09)')
    : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)');

  const headerShadow = scrolled
    ? (isDark
      ? '0 2px 0 rgba(255,255,255,0.04) inset, 0 8px 40px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)'
      : '0 2px 0 rgba(255,255,255,0.8) inset, 0 8px 32px rgba(0,0,0,0.09), 0 2px 6px rgba(0,0,0,0.05)')
    : 'none';

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-[hsl(var(--public-bg))] text-foreground"
      style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}
    >

      <SEOHead />
      <ScrollProgressBar />

      {/* ── Background ────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <PublicBackground variant={bgVariant} />
      </div>

      {/* ════════════════════════════════════════════════════
          HEADER
      ════════════════════════════════════════════════════ */}
      <header
        style={{
          position:            'fixed',
          top:                 0,
          zIndex:              50,
          width:               '100%',
          background:          headerBg,
          backdropFilter:      'blur(24px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
          borderBottom:        `1px solid ${headerBorder}`,
          boxShadow:           headerShadow,
          transition:          'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"
          style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1440px', margin: '0 auto', padding: '0 1.5rem' }}
        >

          {/* Logo */}
          <button
            type="button"
            onClick={() => {
              if (location.pathname === '/' || location.pathname === '/welcome') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }}
            className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2
              focus-visible:ring-primary/50 rounded-lg px-1 py-0.5"
            aria-label="YSS Orbit home"
          >
            <img
              src="/images/branding/YSS_Logo.png"
              alt="YSS Orbit Logo"
              className="transition-all duration-300 hover:scale-105 hover:brightness-110"
              style={{ 
                height: 42, 
                objectFit: 'contain', 
                filter: isDark 
                  ? 'drop-shadow(0 4px 12px rgba(59,130,246,0.25))' 
                  : 'drop-shadow(0 4px 8px rgba(59,130,246,0.15))' 
              }}
            />
          </button>

          {/* Desktop Navigation Links */}
          {isWelcomePage && (
            <nav className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-8" aria-label="Desktop navigation">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.querySelector(item.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm font-semibold transition-all duration-200 hover:text-primary hover:scale-105"
                  style={{ color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(10,10,22,0.7)' }}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-2">

            {/* Pill theme toggle */}
            <ThemePill isDark={isDark} onToggle={toggleTheme} />

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2
                text-sm font-semibold transition-all duration-200
                hover:-translate-y-0.5 focus:outline-none
                focus-visible:ring-2 focus-visible:ring-primary/50"
              style={{
                background:   'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.82) 100%)',
                color:        'hsl(var(--primary-foreground))',
                border:       '1px solid hsl(var(--primary)/0.35)',
                boxShadow:    '0 4px 16px hsl(var(--primary)/0.35), 0 1px 0 rgba(255,255,255,0.15) inset',
                letterSpacing: '0.01em',
              }}
            >
              Sign in
            </button>

            {/* Unified Menu Button (Desktop & Mobile) */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-9 w-11 items-center justify-center rounded-lg
                transition-all duration-200 hover:scale-105 hover:bg-primary/10
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              style={{
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border:     `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                color:      isDark ? 'rgba(255,255,255,0.8)' : 'rgba(10,10,22,0.8)',
                marginLeft: '4px',
              }}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════
          UNIFIED NAVIGATION DRAWER
      ════════════════════════════════════════════════════ */}

      {/* Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 animate-in fade-in duration-200"
          style={{ background: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0.32)', backdropFilter: 'blur(5px)' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          background:          isDark
            ? 'linear-gradient(180deg, rgba(6,8,18,0.99) 0%, rgba(10,12,24,0.99) 100%)'
            : 'rgba(253,254,255,0.99)',
          backdropFilter:      'blur(32px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
          borderLeft:          `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow:           isDark
            ? '-16px 0 48px rgba(0,0,0,0.5)'
            : '-16px 0 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* Drawer header */}
        <div
          className="flex items-center justify-end px-5 py-4"
          style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}` }}
        >
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all
              hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            style={{
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border:     `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              color:      isDark ? 'rgba(255,255,255,0.6)' : 'rgba(10,10,22,0.6)',
            }}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav links */}
        {isWelcomePage && (
          <nav className="flex flex-col gap-0.5 px-3 py-4" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMobileOpen(false);
                  setTimeout(() => {
                    const el = document.querySelector(item.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-all duration-200 hover:bg-primary/8 hover:text-primary"
                style={{ color: isDark ? 'rgba(255,255,255,0.62)' : 'rgba(10,10,22,0.62)' }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}

        <div className="flex-1" />


      </div>

      {/* ════════════════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════════════════ */}
      <main className={cn('relative z-10 flex-1 pt-[64px]', !fullBleed && 'flex flex-col')}>
        {children}
      </main>


      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer 
        className="relative z-20 w-full py-6 mt-12 text-center text-sm font-medium tracking-wide" 
        style={{ 
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(10,10,22,0.6)' 
        }}
      >
        © 2026 YSS Orbit. All rights reserved.
      </footer>
    </div>
  );
};

export default PublicLayout;