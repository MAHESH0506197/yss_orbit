/**
 * YSS Orbit — WelcomePage
 * ─────────────────────────────────────────────────────────────────────────
 *  Wraps every public section in <PublicLayout> which provides:
 *    • Sticky glassmorphism navbar (Platform / Modules / Security / Pricing)
 *    • Theme pill toggle  • Mobile drawer  • PublicBackground
 *    • SEOHead  • AnnouncementBanner  • ScrollProgressBar
 *    • CookieBanner  • SocialProofPopup  • ExitIntentPopup  • LiveChatWidget
 *    • Rich multi-column footer
 *
 *  Section render order (matches PublicLayout NAV_ITEMS & ALL_SECTIONS):
 *    hero â†’ stats â†’ features(#platform) â†’ industries(#modules)
 *    â†’ problems â†’ solution â†’ roi â†’ comparison
 *    â†’ security â†’ trust â†’ pricing â†’ faq â†’ cta â†’ contact
 *
 *  SectionDivider is placed between every section for visual rhythm.
 *  ToastContainer is mounted here (required by CTASection & ContactSection).
 *
 *  âŒ Files now REDUNDANT — safe to delete:
 *     src/modules/welcome/components/PublicNavbar.tsx
 *     src/modules/welcome/components/PublicFooter.tsx
 * ─────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { PublicLayout } from '@/components/layouts/PublicLayout';

// ── Section components ────────────────────────────────────────────────────
import HeroSection           from './components/HeroSection';
import FeaturesSection       from './components/FeaturesSection';
import SecuritySection       from './components/SecuritySection';
import PricingSection        from './components/PricingSection';
import ContactSection        from './components/ContactSection';

import ToastContainer    from './components/Toast';

/* ── Scroll-anchor helper ─────────────────────────────────────────────────
 *  Creates an invisible in-flow anchor so navbar links like #platform and
 *  #modules can scroll accurately even though section components use
 *  their own internal IDs (e.g. id="features", id="industries").
 * ─────────────────────────────────────────────────────────────────────── */
function NavAnchor({ id }: { id: string }) {
  return (
    <span
      id={id}
      aria-hidden="true"
      style={{
        display:       'block',
        height:        0,
        marginTop:     -76,   // offset = navbar height
        paddingTop:    76,
        pointerEvents: 'none',
        visibility:    'hidden',
      }}
    />
  );
}

/* ── WelcomePage ──────────────────────────────────────────────────────────── */
export default function WelcomePage() {
  return (
    <PublicLayout bgVariant="hero" fullBleed>

      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <HeroSection />

      {/* ── 2. Platform  (#platform â†’ features) ─────── */}
      <NavAnchor id="platform" />

      <FeaturesSection />

      {/* ── 7. Security  (#security) ─────────────────────────── */}
      <SecuritySection />

      {/* ── 9. Pricing  (#pricing) ───────────────────────────── */}
      <PricingSection />

      {/* ── 12. Contact ──────────────────────────────────────── */}
      <ContactSection />

      {/* ── Global toast renderer (fixed, z-9999) ────────────── */}
      {/* Required by CTASection â†’ useToast and ContactSection â†’ useContactForm */}
      <ToastContainer />

    </PublicLayout>
  );
}
