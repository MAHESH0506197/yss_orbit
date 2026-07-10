// yss_orbit\frontend\src\modules\welcome\components\ScrollProgressBar.tsx
/**
 * ScrollProgressBar
 *
 * Thin branded progress bar at the very top of the viewport.
 * Fills left-to-right as user scrolls down the page.
 * Uses requestAnimationFrame for smooth, jank-free updates.
 */

import React, { useEffect, useRef } from 'react';

export default function ScrollProgressBar(): React.ReactElement {
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = (): void => {
      if (!barRef.current) return;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct       = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      barRef.current.style.width = `${pct}%`;
    };

    const onScroll = (): void => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        top:            0,
        left:           0,
        width:         '100%',
        height:         2.5,
        zIndex:         299,
        background:    'transparent',
        pointerEvents: 'none',
      }}
    >
      <div
        ref={barRef}
        style={{
          height:       '100%',
          width:        '0%',
          background:   'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.7), #0D9488)',
          boxShadow:    '0 0 8px hsl(var(--primary) / 0.5)',
          transition:   'width 0.08s linear',
          borderRadius: '0 2px 2px 0',
        }}
      />
    </div>
  );
}
