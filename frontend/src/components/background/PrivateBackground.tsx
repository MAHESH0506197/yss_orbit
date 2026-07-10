// src/components/background/PrivateBackground.tsx

/**
 * YSS Orbit — PrivateBackground
 *
 * Animated canvas background for authenticated dashboard pages.
 * Shares the luxury aesthetic of the PublicBackground but dialed down significantly
 * to ensure data-heavy dashboards remain legible and distraction-free.
 * 
 * Modifications from PublicBackground:
 * - Slower movement speeds (0.01 instead of 0.10)
 * - Lower opacity on orbs and particles
 * - Tighter vignette for better edge contrast on data tables
 */

import React, { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ThemePalette = {
  base0: string;
  base1: string;
  base2: string;
  base3: string;
  indigo: string;
  burgundy: string;
  teal: string;
  particleAlpha: number;
  vignette: string;
};

type Orb = {
  x: number;
  y: number;
  radius: number;
  color: 'indigo' | 'burgundy' | 'teal';
  speedX: number;
  speedY: number;
  phase: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MOBILE_BREAKPOINT = 768;
// Fewer particles for private dashboard to reduce visual noise
const PARTICLE_COUNT_DESKTOP = 8;
const PARTICLE_COUNT_MOBILE  = 4;
const RESIZE_DEBOUNCE_MS     = 150;

/**
 * Palette singletons
 */
const PALETTE_DARK: Readonly<ThemePalette> = {
  base0:        '#050816',
  base1:        '#090E1F',
  base2:        '#0E152B',
  base3:        '#121A38',
  indigo:       '#4F46E5',
  burgundy:     '#9F1239',
  teal:         '#0F766E',
  particleAlpha: 0.35,  // Dimmer for private
  vignette:     'rgba(0,0,0,0.85)', // Stronger vignette to box in data
};

const PALETTE_LIGHT: Readonly<ThemePalette> = {
  base0:        '#F8FAFC',
  base1:        '#F1F5F9',
  base2:        '#E9EEF5',
  base3:        '#DEE5EE',
  indigo:       '#4F46E5',
  burgundy:     '#9F1239',
  teal:         '#0F766E',
  particleAlpha: 0.15,  // Dimmer for private
  vignette:     'rgba(226,232,240,0.4)',
};

const getPalette = (dark: boolean): Readonly<ThemePalette> =>
  dark ? PALETTE_DARK : PALETTE_LIGHT;

// ─────────────────────────────────────────────────────────────────────────────
// Factory helpers
// ─────────────────────────────────────────────────────────────────────────────

const createOrbs = (): Orb[] => [
  { x: 0.20, y: 0.20, radius: 0.80, color: 'indigo',   speedX: 0.00002, speedY: 0.00002, phase: 0   },
  { x: 0.80, y: 0.80, radius: 0.60, color: 'burgundy', speedX: 0.00001, speedY: 0.00002, phase: 2.1 },
  { x: 0.50, y: 0.50, radius: 0.50, color: 'teal',     speedX: 0.00003, speedY: 0.00001, phase: 4.2 },
];

const createParticles = (count: number): Particle[] =>
  Array.from({ length: count }, () => ({
    x:     Math.random(),
    y:     Math.random(),
    vx:    (Math.random() - 0.5) * 0.00003, // Slower particles
    vy:    (Math.random() - 0.5) * 0.00003,
    size:  Math.random() * 1.2 + 0.4,
    alpha: Math.random() * 0.3 + 0.1,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// Standalone helpers
// ─────────────────────────────────────────────────────────────────────────────

function createNoisePattern(
  ctx: CanvasRenderingContext2D,
  dark: boolean,
): CanvasPattern | null {
  const grain = document.createElement('canvas');
  grain.width  = 180;
  grain.height = 180;

  const gctx = grain.getContext('2d');
  if (!gctx) return null;

  const img = gctx.createImageData(180, 180);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255;
    img.data[i]     = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = dark ? 4 : 6;  // Even subtler grain for dashboards
  }
  gctx.putImageData(img, 0, 0);

  return ctx.createPattern(grain, 'repeat');
}

function getOrbHexColor(palette: Readonly<ThemePalette>, color: Orb['color']): string {
  switch (color) {
    case 'indigo':   return palette.indigo;
    case 'burgundy': return palette.burgundy;
    case 'teal':     return palette.teal;
    default:         return palette.indigo;
  }
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, wait: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  }) as T;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const PrivateBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;
    // ctx is guaranteed non-null from here — cast once to silence TS18047 in closures
    const safeCtx = ctx as CanvasRenderingContext2D;

    let animationFrame: number | null = null;
    let cancelled = false;

    let width  = 0;
    let height = 0;
    let grainPattern: CanvasPattern | null = null;

    let currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    let particles       = createParticles(
      currentIsMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP
    );

    const orbs = createOrbs();

    const getIsDark = (): boolean =>
      document.documentElement.classList.contains('dark');

    const resize = debounce(function resizeImpl() {
      const dpr = window.devicePixelRatio || 1;
      width     = window.innerWidth;
      height    = window.innerHeight;

      canvas.width        = Math.round(width  * dpr);
      canvas.height       = Math.round(height * dpr);
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;

      safeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainPattern = createNoisePattern(ctx, getIsDark());

      const nowMobile = width < MOBILE_BREAKPOINT;
      if (nowMobile !== currentIsMobile) {
        currentIsMobile = nowMobile;
        particles = createParticles(
          nowMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP
        );
      }
    }, RESIZE_DEBOUNCE_MS);

    function render() {
      if (cancelled) return;

      const time    = performance.now();
      const dark    = getIsDark();
      const palette = getPalette(dark);

      if (width === 0 || height === 0) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      safeCtx.clearRect(0, 0, width, height);

      // Layer 1: Dashboard base gradient
      const bg = safeCtx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0,    palette.base0);
      bg.addColorStop(0.50, palette.base1);
      bg.addColorStop(1,    palette.base2);
      safeCtx.fillStyle = bg;
      safeCtx.fillRect(0, 0, width, height);

      // Layer 2: Subtle Orbs
      safeCtx.save();
      safeCtx.globalCompositeOperation = 'lighter';

      const movement = 0.02; // Extremely slow for dashboard

      orbs.forEach((orb, index) => {
        const x = width  * orb.x
          + Math.sin(time * orb.speedX + orb.phase + index) * width  * movement;
        const y = height * orb.y
          + Math.cos(time * orb.speedY + orb.phase + index) * height * movement;

        const r = width * orb.radius * (0.95 + Math.sin(time * 0.0001 + orb.phase) * 0.03);

        if (r <= 0) return;

        const hexColor = getOrbHexColor(palette, orb.color);
        const gradient = safeCtx.createRadialGradient(x, y, 0, x, y, r);

        if (dark) {
          gradient.addColorStop(0,    `${hexColor}22`); // Dimmer than public
          gradient.addColorStop(0.35, `${hexColor}0C`);
          gradient.addColorStop(0.75, `${hexColor}04`);
        } else {
          gradient.addColorStop(0,    `${hexColor}15`);
          gradient.addColorStop(0.35, `${hexColor}08`);
          gradient.addColorStop(0.75, `${hexColor}03`);
        }
        gradient.addColorStop(1, 'transparent');

        safeCtx.fillStyle = gradient;
        safeCtx.beginPath();
        safeCtx.arc(x, y, r, 0, Math.PI * 2);
        safeCtx.fill();
      });

      safeCtx.restore();

      // Layer 3: Sparse particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x >  1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        if (p.y >  1.02) p.y = -0.02;

        const px = p.x * width;
        const py = p.y * height;

        const pulse = 0.8 + Math.sin(time * 0.0005 + p.x * 10 + p.y * 10) * 0.2;
        const alpha = p.alpha * palette.particleAlpha * pulse;

        const particleRadius = p.size * 3; // Smaller for dashboard
        const pg = safeCtx.createRadialGradient(px, py, 0, px, py, particleRadius);
        pg.addColorStop(0,    `rgba(255,255,255,${alpha.toFixed(4)})`);
        pg.addColorStop(0.5,  `rgba(99,102,241,${(alpha * 0.4).toFixed(4)})`);
        pg.addColorStop(1,    'transparent');

        safeCtx.fillStyle = pg;
        safeCtx.beginPath();
        safeCtx.arc(px, py, particleRadius, 0, Math.PI * 2);
        safeCtx.fill();
      });

      // Layer 4: Micro grain
      if (grainPattern) {
        safeCtx.save();
        safeCtx.globalAlpha = dark ? 0.12 : 0.06;
        safeCtx.fillStyle   = grainPattern;
        safeCtx.fillRect(0, 0, width, height);
        safeCtx.restore();
      }

      // Layer 5: Stronger Executive vignette to draw eyes to data
      const vignetteOuter = Math.max(width, height);
      const vignetteInner = width * 0.15;
      if (vignetteOuter > vignetteInner) {
        const vignette = safeCtx.createRadialGradient(
          width * 0.5, height * 0.5, vignetteInner,
          width * 0.5, height * 0.5, vignetteOuter,
        );
        vignette.addColorStop(0,    'rgba(0,0,0,0)');
        vignette.addColorStop(0.6,  'rgba(0,0,0,0)');
        vignette.addColorStop(1,    palette.vignette);
        safeCtx.fillStyle = vignette;
        safeCtx.fillRect(0, 0, width, height);
      }

      animationFrame = requestAnimationFrame(render);
    }

    // Initialise
    (function resizeImmediate() {
      const dpr = window.devicePixelRatio || 1;
      width     = window.innerWidth;
      height    = window.innerHeight;

      canvas.width        = Math.round(width  * dpr);
      canvas.height       = Math.round(height * dpr);
      canvas.style.width  = `${width}px`;
      canvas.style.height = `${height}px`;

      safeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      grainPattern = createNoisePattern(ctx, getIsDark());
    })();

    render();

    window.addEventListener('resize', resize);

    const themeObserver = new MutationObserver(() => {
      grainPattern = createNoisePattern(ctx, getIsDark());
    });
    themeObserver.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['class'],
    });

    return () => {
      cancelled = true;
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none select-none"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background/5 dark:to-background/20"
      />
    </>
  );
};

export default PrivateBackground;
