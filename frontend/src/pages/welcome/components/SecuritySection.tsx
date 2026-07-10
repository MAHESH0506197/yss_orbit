// yss_orbit\frontend\src\modules\welcome\components\SecuritySection.tsx
import React from 'react';
import SectionDivider from './SectionDivider';
import { useReveal } from '../hooks/useReveal';

const SECURITY_FEATURES = [
  {
    title: 'Enterprise-Grade Infrastructure',
    desc:  'Protected by state-of-the-art cloud infrastructure with 99.99% uptime, 24/7 proactive monitoring, and industry-leading security practices.',
    color: '#3b82f6', // blue
  },
  {
    title: 'Role-Based Access Control',
    desc:  'Ensure the right people have the right access. Precisely control and restrict permissions for every employee, manager, and administrator.',
    color: '#10b981', // emerald
  },
  {
    title: 'End-to-End Encryption',
    desc:  'Your sensitive business information is heavily encrypted at rest (AES-256) and in transit, meaning unauthorized parties can never read your data.',
    color: '#8b5cf6', // violet
  },
  {
    title: 'Immutable Audit Logs',
    desc:  'Every system action and data change is logged in tamper-proof audit trails, providing total transparency and readiness for internal compliance reviews.',
    color: '#f59e0b', // amber
  },
];

function SecurityCard({ feat, index }: { feat: any, index: number }) {
  const rv = useReveal(index * 0.1);

  return (
    <div
      ref={rv.ref}
      className={`rounded-2xl border-[1.5px] border-border border-t-[3px] bg-white/80 p-7 backdrop-blur-[14px] transition-all duration-300 hover:shadow-lg dark:bg-slate-900/70 ${rv.className || ''}`}
      style={{
        ...rv.style,
        borderTopColor: feat.color,
      }}
    >
      {/* Color accent dot */}
      <div 
        className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${feat.color}18`, borderColor: `${feat.color}35`, borderWidth: '1.5px' }}
      >
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: feat.color }} />
      </div>

      <h3 className="mb-2 font-sans text-base font-semibold text-foreground transition-colors duration-300">
        {feat.title}
      </h3>
      <p className="text-[0.88rem] leading-[1.72] text-muted-foreground transition-colors duration-300">
        {feat.desc}
      </p>
    </div>
  );
}

export default function SecuritySection() {
  const rvHeader = useReveal(0);

  return (
    <section id="security" className="relative">
      <SectionDivider variant={2} flip />
      <div className="mx-auto max-w-screen-xl px-[clamp(1.25rem,5vw,5rem)] pb-28 pt-24">
        <div ref={rvHeader.ref} className={`mb-16 ${rvHeader.className || ''}`} style={rvHeader.style}>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 max-w-[56ch]">
            <span className="text-primary text-sm uppercase tracking-wider font-semibold block mb-2">Enterprise Security</span>
            Security is <em className="italic text-primary">not an add-on.</em>
          </h2>
          <p className="text-lg text-muted-foreground max-w-[56ch]">YSS ORBIT is architected from the ground up with robust data protection, strict access controls, and enterprise-grade infrastructure.</p>
        </div>

        <div className="mt-12 grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-5">
          {SECURITY_FEATURES.map((feat, i) => (
            <SecurityCard key={feat.title} feat={feat} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
