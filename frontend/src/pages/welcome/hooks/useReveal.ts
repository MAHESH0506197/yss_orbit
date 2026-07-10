// yss_orbit\frontend\src\modules\welcome\hooks\useReveal.ts
import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useReveal(delay = 0, threshold = 0.1) {
  const ref = useRef<any>(null);
  const [visible, setVisible] = useState(prefersReducedMotion);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const obs = new IntersectionObserver(
      ([entry]) => {
        // @ts-expect-error - Auto-patched TS18048
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -30px 0px' }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return {
    ref,
    className: undefined as string | undefined,
    style: {
      opacity:    visible ? 1 : 0,
      transform:  visible ? 'translateY(0)' : 'translateY(28px)',
      transition: prefersReducedMotion
        ? 'none'
        : `opacity 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s,
           transform 0.75s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    },
  };
}
