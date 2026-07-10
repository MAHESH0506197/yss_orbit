// yss_orbit\frontend\src\modules\welcome\components\HeroSection.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollSync } from '../hooks/useScrollSync';
import { Button } from '@/components/ui/Button';

const SERVICES = [
  { label: 'HRMS',      icon: '👥', angle: 0,   radius: 255 },
  { label: 'POS',       icon: '🛒', angle: 60,  radius: 200 },
  { label: 'Pharmacy',  icon: '💊', angle: 120, radius: 155 },
  { label: 'Inventory', icon: '📦', angle: 180, radius: 255 },
  { label: 'CRM',       icon: '🤝', angle: 240, radius: 200 },
  { label: 'Analytics', icon: '📊', angle: 300, radius: 155 },
];

const TRUST = [
  { label: 'Enterprise-Grade Security', icon: '🛡️', href: '#security' },
  { label: 'Role-Based Access',         icon: '👥', href: '#security' },
  { label: 'End-to-End Encrypted',      icon: '🔒', href: '#security' },
];

const R = 200, CX = 260, CY = 260;

export default function HeroSection() {
  const { scrollToSection } = useScrollSync(['features']);

  return (
    <section id="hero" className="min-h-[80svh] flex items-center pt-8 pb-16 px-[clamp(1.25rem,8vw,9rem)] relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center max-w-[1300px] mx-auto text-center lg:text-left">
        
        {/* LEFT */}
        <div className="flex flex-col z-10 items-center lg:items-start">
          <div className="mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[100ms] fill-mode-both">
            <div className="inline-flex items-center gap-2.5 py-[0.42rem] px-4 rounded-full bg-primary/10 border-[1.5px] border-primary/30">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="font-mono text-[0.68rem] text-primary uppercase tracking-[0.18em]">The YSS Orbit Ecosystem</span>
            </div>
          </div>

          <h1 className="font-serif text-[clamp(2.1rem,4vw,3.6rem)] leading-[1.1] tracking-[-0.025em] text-foreground font-normal mb-6 transition-colors duration-300 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[200ms] fill-mode-both">
            Unified{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent font-bold">
              Intelligence
            </span>
            <br />
            for Every Operation
          </h1>

          <p className="text-[1.05rem] text-muted-foreground max-w-[50ch] leading-[1.75] mb-9 font-normal animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[300ms] fill-mode-both">
            YSS Orbit is an enterprise platform that unifies HRMS, POS, Pharmacy, Inventory, CRM, and Analytics into a single, secure, multi-tenant ecosystem built for scale.
          </p>

          <div className="flex gap-3.5 flex-wrap mb-11 justify-center lg:justify-start animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[400ms] fill-mode-both">
            <Button size="lg" className="rounded-xl px-9 font-sans font-semibold text-[0.95rem] shadow-[0_6px_28px_rgba(var(--primary),0.3)] hover:-translate-y-[3px] hover:shadow-[0_10px_36px_rgba(var(--primary),0.4)] transition-all">
              <Link to="/login" className="flex items-center">
                Get Started <span className="ml-2 text-lg">›</span>
              </Link>
            </Button>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-[500ms] fill-mode-both flex flex-wrap justify-center lg:justify-start gap-3 w-full max-w-lg">
            {TRUST.map(item => (
              <a key={item.label} href={item.href} className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 no-underline transition-all duration-200 hover:opacity-75 shadow-sm hover:shadow hover:-translate-y-[1px]">
                <span className="text-[0.85rem]">{item.icon}</span>
                <span className="text-[0.65rem] font-mono text-foreground font-semibold uppercase tracking-[0.05em]">{item.label}</span>
              </a>
            ))}
          </div>

        </div>

        <div className="hidden lg:flex justify-center items-center -mt-2">
          <div className="relative w-[520px] h-[520px] animate-in fade-in zoom-in-95 duration-1000 delay-500 fill-mode-both">
            <svg viewBox="0 0 520 520" width="520" height="520" className="absolute inset-0">
              <defs>
                <linearGradient id="ai-rg1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity="1" />
                  <stop offset="50%"  stopColor="#a78bfa" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="ai-rg2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   stopColor="#f59e0b" stopOpacity="1" />
                  <stop offset="50%"  stopColor="#f97316" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="ai-rg3" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%"   stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Multiple concentric tracks for a deep 3D ecosystem feel */}
              <circle cx={CX} cy={CY} r={R} stroke="url(#ai-rg1)" strokeWidth="1.5" strokeDasharray="4 8" fill="none" opacity="0.85"/>
              <circle cx={CX} cy={CY} r={R - 45} stroke="url(#ai-rg2)" strokeWidth="1.5" strokeDasharray="2 6" fill="none" opacity="0.85"/>
              <circle cx={CX} cy={CY} r={R + 55} stroke="url(#ai-rg3)" strokeWidth="1.5" fill="none" opacity="0.85"/>
              
              {/* Glowing data particles orbiting the tracks */}
              <circle cx={CX + R} cy={CY} r="3.5" className="fill-blue-500" filter="url(#glow)">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="25s" repeatCount="indefinite" />
              </circle>
              <circle cx={CX - R + 45} cy={CY} r="3" className="fill-indigo-400" filter="url(#glow)">
                <animateTransform attributeName="transform" type="rotate" from={`360 ${CX} ${CY}`} to={`0 ${CX} ${CY}`} dur="35s" repeatCount="indefinite" />
              </circle>
              <circle cx={CX} cy={CY - R - 55} r="4" className="fill-purple-500" filter="url(#glow)">
                <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="50s" repeatCount="indefinite" />
              </circle>

              {/* Connecting data lines */}
              {SERVICES.map(s => {
                const rad = (s.angle*Math.PI)/180;
                const startR = 60;
                return (
                  <line 
                    key={s.label} 
                    x1={CX+startR*Math.cos(rad)} 
                    y1={CY+startR*Math.sin(rad)} 
                    x2={CX+s.radius*Math.cos(rad)} 
                    y2={CY+s.radius*Math.sin(rad)} 
                    stroke="url(#lineGrad)"
                    strokeWidth="1.5" 
                    strokeDasharray="4 4"
                  />
                );
              })}
              
              {/* Glowing inner hub */}
              <circle cx={CX} cy={CY} r={56} className="stroke-primary/40 fill-transparent" strokeWidth="1.5" filter="drop-shadow(0 0 25px rgba(59,130,246,0.25))"/>
              
              {/* Double pulsing radar rings */}
              <circle cx={CX} cy={CY} r={56} className="stroke-primary" strokeWidth="2" fill="none" opacity=".5">
                <animate attributeName="r" from="56" to="115" dur="3.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from=".5" to="0" dur="3.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx={CX} cy={CY} r={56} className="stroke-indigo-400" strokeWidth="1.5" fill="none" opacity=".3">
                <animate attributeName="r" from="56" to="85" dur="3.5s" begin="1.75s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from=".4" to="0" dur="3.5s" begin="1.75s" repeatCount="indefinite"/>
              </circle>
              
              {/* Center Logo */}
              <image href="/images/branding/YSS_Logo.png" x={CX - 36} y={CY - 36} width="72" height="72" />
              <style>{`
                @keyframes hero-orbit { to { transform: rotate(360deg); } }
                @keyframes hero-orbit-r { to { transform: rotate(-360deg); } }
              `}</style>
            </svg>
            
            {/* Rotating Orbit Nodes */}
            <div className="absolute inset-0 rounded-full" style={{ animation: 'hero-orbit 120s linear infinite' }}>
              {SERVICES.map(s => {
                const rad = (s.angle*Math.PI)/180;
                return (
                  <div 
                    key={s.label} 
                    style={{ top: CY+s.radius*Math.sin(rad), left: CX+s.radius*Math.cos(rad) }} 
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div 
                      style={{ animation: 'hero-orbit-r 120s linear infinite' }}
                      className="py-3 px-4.5 rounded-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/60 dark:border-white/10 flex items-center gap-2.5 shadow-[0_8px_30px_rgb(0,0,0,0.06)] whitespace-nowrap transition-all duration-300 hover:scale-110 hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)] hover:border-primary/30 cursor-default"
                    >
                      <span className="text-[1.2rem]">{s.icon}</span>
                      <span className="text-[0.85rem] font-sans font-semibold text-foreground">{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
