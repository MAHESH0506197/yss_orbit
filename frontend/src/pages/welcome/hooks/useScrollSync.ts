// yss_orbit\frontend\src\modules\welcome\hooks\useScrollSync.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export const NAVBAR_HEIGHT = 68;
const ACTIVATION_OFFSET = NAVBAR_HEIGHT + 80;

export function useScrollSync(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState('');
  const idsRef = useRef(sectionIds);
  
  useEffect(() => { idsRef.current = sectionIds; }, [sectionIds]);

  useEffect(() => {
    function detect() {
      const ids = idsRef.current;
      if (!ids.length) return;
      let found = '';
      for (let i = ids.length - 1; i >= 0; i--) {
        // @ts-expect-error - Auto-patched TS2345
        const el = document.getElementById(ids[i]);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= ACTIVATION_OFFSET) {
          // @ts-expect-error - Auto-patched TS2322
          found = ids[i];
          break;
        }
      }
      setActiveSection(prev => (prev !== found ? found : prev));
    }

    detect();
    window.addEventListener('scroll', detect, { passive: true });
    window.addEventListener('resize', detect, { passive: true });
    return () => {
      window.removeEventListener('scroll', detect);
      window.removeEventListener('resize', detect);
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const elementTop = el.getBoundingClientRect().top + window.pageYOffset;
    const targetY = Math.max(0, elementTop - NAVBAR_HEIGHT - 8);
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  }, []);

  return { activeSection, scrollToSection };
}
