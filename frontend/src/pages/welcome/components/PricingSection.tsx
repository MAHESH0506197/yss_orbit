// yss_orbit\frontend\src\modules\welcome\components\PricingSection.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionDivider from './SectionDivider';
import { useReveal } from '../hooks/useReveal';
import { Button } from '@/components/ui/Button';
import { formatIST } from '@/utils/date';

const PLANS = [
  {
    id:       'basic',
    name:     'Basic',
    icon:     '🌱',
    tagline:  'Perfect for small businesses getting started.',
    monthly:  2999,
    annual:   1999,
    currency: '₹',
    period:   '/month',
    seats:    'Up to 10 users',
    cta:      'Start Free Trial',
    color:    '#0D9488',
    features: [
      'Cloud POS',
      'Basic Inventory',
      'Standard Reports',
      'Email Support',
    ],
    missing: ['Multi-store Sync', 'Advanced HRMS', 'API Access'],
  },
  {
    id:       'pro',
    name:     'Professional',
    icon:     '🚀',
    tagline:  'Everything you need to grow your business.',
    monthly:  6999,
    annual:   4999,
    currency: '₹',
    period:   '/month',
    seats:    'Up to 50 users',
    cta:      'Start Free Trial',
    color:    '#B8864E',
    popular:  true,
    features: [
      'Everything in Basic',
      'Multi-store Sync',
      'Advanced Inventory',
      'Basic HRMS & Payroll',
      'Priority Support',
    ],
    missing: ['Custom Integrations', 'Dedicated Account Manager'],
  },
  {
    id:       'enterprise',
    name:     'Enterprise',
    icon:     '🏢',
    tagline:  'Custom solutions for large scale operations.',
    monthly:  null,
    annual:   null,
    currency: '₹',
    period:   '',
    seats:    'Unlimited users',
    cta:      'Contact Sales',
    color:    '#6D4FC2',
    features: [
      'Everything in Professional',
      'Custom API Integrations',
      'Dedicated Account Manager',
      'On-premise Deployment',
      '24/7 Phone Support',
    ],
    missing: [],
  },
];

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
      <circle cx="7" cy="7" r="6.5" fill={`${color}20`} stroke={`${color}50`} strokeWidth="1"/>
      <path d="M4.5 7l2 2 3-3" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-0.5 shrink-0">
      <circle cx="7" cy="7" r="6.5" className="fill-slate-400/10 stroke-slate-400/30" strokeWidth="1"/>
      <path d="M5 5l4 4M9 5l-4 4" stroke="#94A3B8" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function PricingCard({ plan, annual, onSelect, delay }: { plan: any, annual: boolean, onSelect: (p: any) => void, delay: number }) {
  const rv = useReveal(delay);

  const price   = annual ? plan.annual : plan.monthly;
  const savings = plan.monthly && plan.annual
    ? Math.round(((plan.monthly - plan.annual) / plan.monthly) * 100)
    : 0;

  return (
    <div ref={rv.ref} className={`relative h-full ${rv.className || ''}`} style={rv.style}>
      {plan.popular && (
        <div 
          className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-3.5 py-[3px] font-mono text-[0.7rem] font-bold uppercase tracking-[0.12em] text-white"
          style={{ background: `linear-gradient(90deg, ${plan.color}, var(--primary))` }}
        >
          ⭐ Most Popular
        </div>
      )}

      <div 
        className={`flex h-full flex-col rounded-[20px] border-[1.5px] p-7 backdrop-blur-[16px] transition-all duration-300 hover:-translate-y-1 ${
          plan.popular 
            ? 'border-transparent bg-white/98 shadow-lg dark:bg-slate-900/90' 
            : 'border-border bg-white/75 shadow-sm dark:bg-slate-900/60'
        }`}
        style={{
          borderColor: plan.popular ? `${plan.color}80` : undefined,
          borderWidth: plan.popular ? '2px' : undefined,
          boxShadow: plan.popular ? `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1), 0 0 40px ${plan.color}20` : undefined,
        }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="mb-2 text-2xl">{plan.icon}</div>
          <div className="font-sans text-[1.15rem] font-bold text-foreground">{plan.name}</div>
          <div className="mt-1 text-[0.8rem] leading-[1.5] text-muted-foreground">{plan.tagline}</div>
        </div>

        {/* Price */}
        <div className="mb-2">
          {price !== null ? (
            <div className="flex items-baseline gap-1">
              <span className="font-mono text-base text-muted-foreground">{plan.currency}</span>
              <span className="font-serif text-[clamp(2rem,3.5vw,2.5rem)] font-normal tracking-[-0.03em]" style={{ color: plan.color }}>
                {formatIST(price, 'PP pp')}
              </span>
              <span className="text-[0.8rem] text-muted-foreground">{plan.period}</span>
            </div>
          ) : (
            <div className="font-serif text-[1.8rem] font-normal" style={{ color: plan.color }}>Custom</div>
          )}
          {annual && savings > 0 && (
            <div className="mt-1 font-mono text-[0.75rem] text-teal-500">
              Save {savings}% annually
            </div>
          )}
        </div>

        <div 
          className="mb-6 inline-block rounded-md px-3 py-1.5 font-mono text-[0.78rem] text-muted-foreground"
          style={{ backgroundColor: `${plan.color}12` }}
        >
          {plan.seats}
        </div>

        {/* Features */}
        <ul className="mb-7 flex flex-1 flex-col gap-2 p-0">
          {plan.features.map((f: string) => (
            <li key={f} className="flex items-start gap-2 text-[0.84rem] text-foreground/80">
              <CheckIcon color={plan.color} /> {f}
            </li>
          ))}
          {plan.missing.map((f: string) => (
            <li key={f} className="flex items-start gap-2 text-[0.84rem] text-muted-foreground line-through decoration-border">
              <CrossIcon /> {f}
            </li>
          ))}
        </ul>


      </div>
    </div>
  );
}

export default function PricingSection() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const rvHeader = useReveal(0);

  const handleSelect = useCallback((plan: any) => {
    if (plan.id === 'enterprise') {
      const el = document.getElementById('contact');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/register?plan=${plan.id}&billing=${annual ? 'annual' : 'monthly'}`);
    }
  }, [navigate, annual]);

  return (
    <section id="pricing" className="relative">
      <SectionDivider variant={2} flip />
      <div className="mx-auto max-w-screen-xl px-[clamp(1.25rem,5vw,5rem)] pb-32 pt-24">
        <div ref={rvHeader.ref} className={`text-center mb-16 ${rvHeader.className || ''}`} style={rvHeader.style}>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            <span className="text-primary text-sm uppercase tracking-wider font-semibold block mb-2">Simple Pricing</span>
            Transparent pricing, <em className="italic text-primary">no surprises.</em>
          </h2>
          <p className="text-lg text-muted-foreground">All plans include a 30-day free trial. No credit card required to start.</p>
        </div>

        {/* Billing toggle */}
        <div className="mb-12 flex items-center justify-center gap-3.5">
          <span className={`font-sans text-[0.88rem] transition-colors duration-200 ${annual ? 'font-normal text-muted-foreground' : 'font-semibold text-foreground'}`}>
            Monthly
          </span>
          <div
            onClick={() => setAnnual(a => !a)}
            className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-250 ${annual ? 'bg-primary' : 'bg-border'}`}
          >
            <div className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-250 ease-out ${annual ? 'left-[23px]' : 'left-[3px]'}`} />
          </div>
          <span className={`font-sans text-[0.88rem] transition-colors duration-200 ${annual ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'}`}>
            Annual
            <span className="ml-1.5 rounded bg-teal-500/20 px-1.5 py-0.5 font-mono text-[0.72rem] font-medium text-teal-500">
              Save 20%
            </span>
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] items-start gap-6">
          {PLANS.map((plan, i) => (
            <PricingCard key={plan.id} plan={plan} annual={annual} onSelect={handleSelect} delay={i * 0.1} />
          ))}
        </div>

        {/* Footer note & CTA */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 text-center">
          <p className="font-sans text-[0.95rem] text-muted-foreground">
            For more details, tailored features, or custom enterprise plans, please get in touch with our team.
          </p>
          <Button 
            variant="primary"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-full px-8 py-2.5 font-sans font-semibold shadow-md transition-transform hover:-translate-y-0.5"
          >
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}
