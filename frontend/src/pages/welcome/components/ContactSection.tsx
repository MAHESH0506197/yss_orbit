// yss_orbit\frontend\src\modules\welcome\components\ContactSection.tsx
import React, { useState } from 'react';
import SectionDivider from './SectionDivider';
import { useReveal } from '../hooks/useReveal';
import { Mail, MapPin, Phone, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const META_ITEMS = [
  { label:'Email',           value:'sales@yssorbit.com',         href:'mailto:sales@yssorbit.com',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { label:'Phone / WhatsApp', value:'+91 40 0000 0000',           href:'tel:+914000000000',
    icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 010 1.17 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg> },
];

export default function ContactSection() {
  const rvHeader = useReveal(0);
  const rvContent = useReveal(0.1);

  return (
    <section id="contact" className="relative">
      <SectionDivider variant={4} flip />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div ref={rvHeader.ref} className={`text-center mb-16 ${rvHeader.className || ''}`} style={rvHeader.style}>
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Get in touch
          </h2>
          <p className="text-lg text-muted-foreground">
            Have questions about our enterprise plans or need a custom integration? Our team is here to help.
          </p>
        </div>

        <div ref={rvContent.ref} className={`mt-14 flex flex-col sm:flex-row items-center justify-center gap-6 ${rvContent.className || ''}`} style={rvContent.style}>
          {META_ITEMS.map(item => (
            <a key={item.label} href={item.href} 
              className="flex w-full max-w-[320px] flex-col items-center justify-center gap-4 rounded-2xl border-[1.5px] border-border bg-white/85 p-8 no-underline backdrop-blur-[12px] transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg dark:bg-slate-900/65"
            >
              <div className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-xl border-[1.5px] border-primary/30 bg-primary/10 text-primary">
                {item.icon}
              </div>
              <div className="text-center">
                <div className="mb-2 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-muted-foreground">{item.label}</div>
                <div className="text-[1.1rem] font-semibold text-foreground">{item.value}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
