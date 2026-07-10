import React from 'react';
import SectionDivider from './SectionDivider';
import { useReveal } from '../hooks/useReveal';

interface Domain {
  id: string;
  colorKey: 'primary' | 'blue' | 'teal' | 'violet';
  label: string;
  tagline: string;
  description: string;
  bullets: string[];
  icon: React.ReactNode;
}

const DOMAINS: Domain[] = [
  {
    id:       'pos',
    colorKey: 'primary',
    label:    'Point of Sale (POS)',
    tagline:  'Lightning-fast checkout.',
    description: 'Unify every sales channel with a cloud POS that works offline. Process transactions smoothly and securely at any scale.',
    bullets:  ['Cloud + Offline Mode', 'Multi-store Sync', 'Quick Checkout'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="10" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/>
        <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id:       'inventory',
    colorKey: 'blue',
    label:    'Inventory Management',
    tagline:  'Never run out of stock.',
    description: 'Real-time stock tracking across unlimited locations. Optimize your supply chain with automatic reorder logic and barcode scanning.',
    bullets:  ['Real-time Tracking', 'Auto-reorder Logic', 'Multi-warehouse'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:       'pharmacy',
    colorKey: 'teal',
    label:    'Pharmacy System',
    tagline:  'Precision healthcare.',
    description: 'Specialized workflows for dispensing, expiry date tracking, and digital prescription management tailored for modern pharmacies.',
    bullets:  ['Expiry Tracking', 'Prescription Mgmt', 'Batch Control'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M10.5 20.5l-6-6a4.95 4.95 0 1 1 7-7l6 6a4.95 4.95 0 1 1-7 7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id:       'hrms',
    colorKey: 'violet',
    label:    'HRMS & Payroll',
    tagline:  'Empower your workforce.',
    description: 'A complete HCM platform covering the full employee lifecycle. Automated payroll, biometric time-tracking, and integrated onboarding.',
    bullets:  ['Automated Payroll', 'Biometric Clock-in', 'Leave Management'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id:       'crm',
    colorKey: 'primary',
    label:    'CRM & Loyalty',
    tagline:  'Know your customers.',
    description: 'Build lasting customer relationships with integrated loyalty programs, targeted marketing, and deep purchase history insights.',
    bullets:  ['Loyalty Points', 'Customer Insights', 'Targeted Marketing'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id:       'analytics',
    colorKey: 'blue',
    label:    'Business Analytics',
    tagline:  'Data-driven decisions.',
    description: 'Transform raw data into actionable insights with real-time dashboards, custom report generation, and predictive trend analysis.',
    bullets:  ['Real-time Dashboards', 'Custom Reports', 'Trend Prediction'],
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <line x1="18" y1="20" x2="18" y2="10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="12" y1="20" x2="12" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="6" y1="20" x2="6" y2="14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
  },
];

const colorStyles = {
  primary: {
    wrapperText: 'text-primary',
    iconBg: 'bg-primary/10',
    iconBorder: 'border-primary/20',
    bulletBg: 'bg-primary/20',
    bulletBorder: 'border-primary/40',
    link: 'text-primary',
    hoverBorder: 'hover:border-primary/50',
  },
  blue: {
    wrapperText: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
    iconBorder: 'border-blue-500/20',
    bulletBg: 'bg-blue-500/20',
    bulletBorder: 'border-blue-500/40',
    link: 'text-blue-500',
    hoverBorder: 'hover:border-blue-500/50',
  },
  teal: {
    wrapperText: 'text-teal-500',
    iconBg: 'bg-teal-500/10',
    iconBorder: 'border-teal-500/20',
    bulletBg: 'bg-teal-500/20',
    bulletBorder: 'border-teal-500/40',
    link: 'text-teal-500',
    hoverBorder: 'hover:border-teal-500/50',
  },
  violet: {
    wrapperText: 'text-violet-500',
    iconBg: 'bg-violet-500/10',
    iconBorder: 'border-violet-500/20',
    bulletBg: 'bg-violet-500/20',
    bulletBorder: 'border-violet-500/40',
    link: 'text-violet-500',
    hoverBorder: 'hover:border-violet-500/50',
  },
};

function DomainCard({ domain, delay }: { domain: Domain; delay: number }) {
  const rv = useReveal(delay);
  const styles = colorStyles[domain.colorKey];

  return (
    <div ref={rv.ref as React.RefObject<HTMLDivElement>} style={rv.style as React.CSSProperties} className="h-full">
      <article
        className={`group h-full p-8 rounded-[18px] border-[1.5px] border-border bg-white/70 dark:bg-slate-900/60 backdrop-blur-[16px] shadow-sm hover:-translate-y-[6px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col hover:bg-white/95 dark:hover:bg-slate-900/85 hover:shadow-lg ${styles.hoverBorder}`}
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border-[1.5px] ${styles.iconBg} ${styles.iconBorder} ${styles.wrapperText}`}>
          {domain.icon}
        </div>

        {/* Title */}
        <h3 className="font-serif text-[1.35rem] font-normal text-foreground mb-[0.6rem] transition-colors duration-300 leading-[1.2]">
          {domain.label}
        </h3>

        {/* Description */}
        <p className="text-[0.9rem] text-muted-foreground leading-[1.7] mb-6 flex-grow transition-colors duration-300">
          {domain.description}
        </p>

        {/* Bullets */}
        <ul className="list-none p-0 m-0 mb-0 flex flex-col gap-2">
          {domain.bullets.map(b => (
            <li key={b} className="text-[0.83rem] text-muted-foreground flex items-center gap-2">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${styles.bulletBg} ${styles.bulletBorder} ${styles.wrapperText}`}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l2 2 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="text-muted-foreground">{b}</span>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative">
      <SectionDivider variant={1} flip />
      <div className="py-24 px-[clamp(1.25rem,5vw,5rem)] max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            <span className="text-primary text-sm uppercase tracking-wider font-semibold block mb-2">Operational Pillars</span>
            Unified intelligence for <em className="text-primary italic">every department.</em>
          </h2>
          <p className="text-lg text-muted-foreground">One platform, six powerful modules — real-time data flowing seamlessly across your entire business ecosystem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {DOMAINS.map((domain, i) => (
            <DomainCard key={domain.id} domain={domain} delay={i * 0.08} />
          ))}
        </div>
      </div>
    </section>
  );
}
