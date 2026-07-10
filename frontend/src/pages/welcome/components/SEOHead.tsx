// yss_orbit\frontend\src\modules\welcome\components\SEOHead.tsx
/**
 * SEOHead
 *
 * Injects all SEO meta tags into <head> via DOM manipulation.
 * Works with React without react-helmet (zero extra deps).
 *
 * Injects:
 * - <title> + meta description
 * - Open Graph (Facebook, LinkedIn, WhatsApp preview)
 * - Twitter Card
 * - Canonical URL
 * - JSON-LD: SoftwareApplication + Organization schemas
 * - robots meta
 *
 * SETUP in .env / .env.production:
 *   VITE_SITE_URL=https://www.yssorbit.com
 *   VITE_OG_IMAGE_URL=https://www.yssorbit.com/og-image.png  (1200x630px)
 */

import { useEffect } from 'react';

const SITE_URL = import.meta.env.VITE_SITE_URL     || 'https://www.yssorbit.com';
const OG_IMAGE = import.meta.env.VITE_OG_IMAGE_URL || `${SITE_URL}/og-image.png`;
const IS_DEV   = import.meta.env.DEV;

const SEO = {
  title:       'YSS ORBIT — Unified Retail, Payroll, HR & Time Platform for India',
  description: 'YSS ORBIT brings Retail Operations, Payroll, HR Management, and Time & Attendance into one unified platform. Trusted by 12,000+ businesses across India. Start your 30-day free trial today.',
  keywords:    'payroll software india, HR management software, retail POS india, time attendance software, unified business platform, YSS ORBIT',
  canonical:    SITE_URL,
} as const;

function setMeta(selector: string, attr: string, content: string): void {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    const match = selector.match(/\[([^\]]+)/);
    if (match) {
      // @ts-expect-error - Auto-patched TS2532
      const parts = match[1].match(/([^=]+)="([^"]+)/);
      if (parts?.[1] && parts?.[2]) el.setAttribute(parts[1], parts[2]);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, content);
}

export default function SEOHead(): null {
  useEffect(() => {
    // Title
    document.title = SEO.title;

    // Basic meta
    setMeta('meta[name="description"]',  'content', SEO.description);
    setMeta('meta[name="keywords"]',     'content', SEO.keywords);
    setMeta('meta[name="robots"]',       'content', IS_DEV ? 'noindex,nofollow' : 'index,follow');
    setMeta('meta[name="author"]',       'content', 'YSS ORBIT Technologies Pvt. Ltd.');
    setMeta('meta[name="theme-color"]',  'content', '#B8864E');

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = SEO.canonical;

    // Open Graph
    setMeta('meta[property="og:type"]',         'content', 'website');
    setMeta('meta[property="og:title"]',         'content', SEO.title);
    setMeta('meta[property="og:description"]',   'content', SEO.description);
    setMeta('meta[property="og:url"]',           'content', SEO.canonical);
    setMeta('meta[property="og:image"]',         'content', OG_IMAGE);
    setMeta('meta[property="og:image:width"]',   'content', '1200');
    setMeta('meta[property="og:image:height"]',  'content', '630');
    setMeta('meta[property="og:site_name"]',     'content', 'YSS ORBIT');
    setMeta('meta[property="og:locale"]',        'content', 'en_IN');

    // Twitter Card
    setMeta('meta[name="twitter:card"]',        'content', 'summary_large_image');
    setMeta('meta[name="twitter:title"]',       'content', SEO.title);
    setMeta('meta[name="twitter:description"]', 'content', SEO.description);
    setMeta('meta[name="twitter:image"]',       'content', OG_IMAGE);
    setMeta('meta[name="twitter:site"]',        'content', '@yssorbit');

    // JSON-LD: SoftwareApplication
    const appSchema = {
      '@context':           'https://schema.org',
      '@type':              'SoftwareApplication',
      name:                 'YSS ORBIT',
      applicationCategory: 'BusinessApplication',
      operatingSystem:      'Web, iOS, Android',
      url:                   SITE_URL,
      description:           SEO.description,
      offers: {
        '@type':         'Offer',
        price:           '1999',
        priceCurrency:   'INR',
        priceValidUntil: '2026-12-31',
        availability:    'https://schema.org/InStock',
      },
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:   '4.8',
        reviewCount:   '1240',
        bestRating:    '5',
        worstRating:   '1',
      },
    };

    // JSON-LD: Organization
    const orgSchema = {
      '@context': 'https://schema.org',
      '@type':    'Organization',
      name:       'YSS ORBIT Technologies Pvt. Ltd.',
      url:         SITE_URL,
      logo:       `${SITE_URL}/logo.png`,
      sameAs: [
        'https://linkedin.com/company/yssorbit',
        'https://twitter.com/yssorbit',
      ],
      contactPoint: {
        '@type':           'ContactPoint',
        telephone:         '+91-40-0000-0000',
        contactType:       'customer service',
        areaServed:        'IN',
        availableLanguage: ['English', 'Hindi', 'Telugu'],
      },
      address: {
        '@type':          'PostalAddress',
        addressLocality:  'Hyderabad',
        addressRegion:    'Telangana',
        addressCountry:   'IN',
      },
    };

    ['app-schema', 'org-schema'].forEach(id => document.getElementById(id)?.remove());

    const injectSchema = (id: string, data: object): void => {
      const s = document.createElement('script');
      s.id          = id;
      s.type        = 'application/ld+json';
      s.textContent = JSON.stringify(data);
      document.head.appendChild(s);
    };

    injectSchema('app-schema', appSchema);
    injectSchema('org-schema', orgSchema);

    return () => {
      ['app-schema', 'org-schema'].forEach(id => document.getElementById(id)?.remove());
    };
  }, []);

  return null;
}
