// src/components/background/PublicBackground.tsx

/**
 * YSS Orbit — PublicBackground
 *
 * Animated canvas background for all public pages.
 * Supports light & dark mode via DOM class detection.
 * Variants:
 *   'hero'  — wide orb movement for the Welcome page
 *   'auth'  — quieter, subtle movement for login / forgot-password / OTP pages
 *
 * Architecture:
 *   6 composited layers painted every frame:
 *     1. Enterprise base gradient   (linear, full-canvas)
 *     2. Luxury orbs                (radial glows, lighter blend)
 *     3. Premium particles          (radial dot glows, source-over)
 *     4. Atmosphere                 (central radial highlight)
 *     5. Micro grain                (off-screen noise canvas, tiled)
 *     6. Executive vignette         (edge darkening)
 *
 * Bug fixes applied (v2):
 *   - RAF leak on unmount: cancelled flag prevents stale frame callbacks
 *   - Orb gradient crash: guarded against r <= 0 before createRadialGradient
 *   - Composite op not restored: save/restore wraps the orb render block
 *   - Resize debounce: 150 ms debounce prevents thrash on rapid resize
 *   - Particle rebuild: particles are rebuilt when crossing mobile breakpoint
 *   - Per-frame palette allocation: palettes are module-level singletons
 */

import React, { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PublicBackgroundProps {
  /** 'hero' = wide orb movement (Welcome page); 'auth' = quieter (Login etc.) */
  variant?: 'hero' | 'auth';
}

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
const PARTICLE_COUNT_DESKTOP = 20;
const PARTICLE_COUNT_MOBILE  = 12;
const RESIZE_DEBOUNCE_MS     = 150;

/**
 * Palette singletons — avoids allocating a new object every animation frame.
 * getPalette() simply returns one of these two references.
 */
const PALETTE_DARK: Readonly<ThemePalette> = {
  base0:        '#050816',
  base1:        '#0A1024',
  base2:        '#101938',
  base3:        '#172554',
  indigo:       '#4F46E5',
  burgundy:     '#9F1239',
  teal:         '#0F766E',
  particleAlpha: 0.72,
  vignette:     'rgba(0,0,0,0.72)',
};

const PALETTE_LIGHT: Readonly<ThemePalette> = {
  base0:        '#F8FAFC',
  base1:        '#F1F5F9',
  base2:        '#E2E8F0',
  base3:        '#CBD5E1',
  indigo:       '#4F46E5',
  burgundy:     '#9F1239',
  teal:         '#0F766E',
  particleAlpha: 0.38,
  vignette:     'rgba(226,232,240,0.22)',
};

const getPalette = (dark: boolean): Readonly<ThemePalette> =>
  dark ? PALETTE_DARK : PALETTE_LIGHT;

// ─────────────────────────────────────────────────────────────────────────────
// Factory helpers
// ─────────────────────────────────────────────────────────────────────────────

const createOrbs = (): Orb[] => [
  { x: 0.18, y: 0.22, radius: 0.90, color: 'indigo',   speedX: 0.00005, speedY: 0.00004, phase: 0   },
  { x: 0.82, y: 0.70, radius: 0.78, color: 'burgundy', speedX: 0.00004, speedY: 0.00005, phase: 2.1 },
  { x: 0.52, y: 0.48, radius: 0.62, color: 'teal',     speedX: 0.00006, speedY: 0.00004, phase: 4.2 },
];

const createParticles = (count: number): Particle[] =>
  Array.from({ length: count }, () => ({
    x:     Math.random(),
    y:     Math.random(),
    // velocities expressed as fraction-of-viewport per millisecond
    vx:    (Math.random() - 0.5) * 0.00008,
    vy:    (Math.random() - 0.5) * 0.00008,
    size:  Math.random() * 1.8 + 0.6,   // min 0.6 â†’ never zero
    alpha: Math.random() * 0.45 + 0.20,
  }));

// ─────────────────────────────────────────────────────────────────────────────
// Standalone helpers (pure, no side effects)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bakes a 180Ã—180 random noise tile into an off-screen canvas and returns
 * a repeating CanvasPattern for the grain overlay.
 * Returns null if the browser cannot create a 2D context.
 */
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
    img.data[i]     = v;   // R
    img.data[i + 1] = v;   // G
    img.data[i + 2] = v;   // B
    img.data[i + 3] = dark ? 7 : 10;  // A — very low opacity
  }
  gctx.putImageData(img, 0, 0);

  return ctx.createPattern(grain, 'repeat');
}

function getOrbHexColor(palette: Readonly<ThemePalette>, color: Orb['color']): string {
  switch (color) {
    case 'indigo':   return palette.indigo;
    case 'burgundy': return palette.burgundy;
    case 'teal':     return palette.teal;
    // TypeScript exhaustive switch — default is unreachable but satisfies the linter
    default:         return palette.indigo;
  }
}

/**
 * Simple debounce utility.
 * Returns a debounced version of fn that delays execution by `wait` ms.
 */
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

export const PublicBackground: React.FC<PublicBackgroundProps> = ({
  variant = 'hero',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return undefined;
    // ctx is guaranteed non-null from here — alias to satisfy TS18047 in closures
    const safeCtx = ctx as CanvasRenderingContext2D;

    // ── State shared across resize / render ─────────────────────────────────

    let animationFrame: number | null = null;

    /**
     * BUG FIX #1 — RAF leak:
     * cancelled flag is set true in cleanup so that any pending rAF callback
     * that fires AFTER cancelAnimationFrame() will exit immediately rather
     * than scheduling another frame. This closes the unmount race condition.
     */
    let cancelled = false;

    let width  = 0;
    let height = 0;
    let grainPattern: CanvasPattern | null = null;

    // Track whether we are currently in mobile mode so we can detect breakpoint
    // crossings on resize and rebuild the particle array accordingly.
    let currentIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
    let particles       = createParticles(
      currentIsMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP
    );

    const orbs = createOrbs();

    // ── Theme detection ─────────────────────────────────────────────────────
    const getIsDark = (): boolean =>
      document.documentElement.classList.contains('dark');

    // ── resize ──────────────────────────────────────────────────────────────
    /**
     * Resets canvas dimensions to match the current viewport at device pixel
     * ratio, regenerates the grain pattern, and rebuilds particles if the
     * mobile/desktop breakpoint has been crossed.
     *
     * BUG FIX #2 — Resize debounce:
     * Wrapped in a 150 ms debounce so that rapid resize events (e.g. dragging
     * a browser window) don't thrash with repeated ImageData allocations.
     */
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

      // BUG FIX #3 — Particle rebuild on breakpoint crossing:
      const nowMobile = width < MOBILE_BREAKPOINT;
      if (nowMobile !== currentIsMobile) {
        currentIsMobile = nowMobile;
        particles = createParticles(
          nowMobile ? PARTICLE_COUNT_MOBILE : PARTICLE_COUNT_DESKTOP
        );
      }
    }, RESIZE_DEBOUNCE_MS);

    // ── render ───────────────────────────────────────────────────────────────
    function render() {
      // BUG FIX #1 continued — exit immediately if component has unmounted
      if (cancelled) return;

      const time    = performance.now();
      const dark    = getIsDark();
      const palette = getPalette(dark);

      // Nothing to draw until resize() has set dimensions
      if (width === 0 || height === 0) {
        animationFrame = requestAnimationFrame(render);
        return;
      }

      safeCtx.clearRect(0, 0, width, height);

      // ── Layer 1: Enterprise base gradient ─────────────────────────────────
      const bg = safeCtx.createLinearGradient(0, 0, width * 0.9, height);
      bg.addColorStop(0,    palette.base0);
      bg.addColorStop(0.30, palette.base1);
      bg.addColorStop(0.65, palette.base2);
      bg.addColorStop(1,    palette.base3);
      safeCtx.fillStyle = bg;
      safeCtx.fillRect(0, 0, width, height);

      // ── Layer 2: Luxury orbs ──────────────────────────────────────────────
      /**
       * BUG FIX #4 — Composite operation restore:
       * Wrapped in save/restore so that if any error occurs inside this block,
       * globalCompositeOperation is guaranteed to revert to 'source-over'.
       */
      safeCtx.save();
      safeCtx.globalCompositeOperation = 'lighter';

      const movement = variant === 'auth' ? 0.04 : 0.10;

      orbs.forEach((orb, index) => {
        const x = width  * orb.x
          + Math.sin(time * orb.speedX + orb.phase + index) * width  * movement;
        const y = height * orb.y
          + Math.cos(time * orb.speedY + orb.phase + index) * height * movement;

        // Breathing radius — oscillates Â±6% around the base radius
        const r = width * orb.radius * (0.92 + Math.sin(time * 0.00015 + orb.phase) * 0.06);

        /**
         * BUG FIX #5 — Orb gradient crash:
         * createRadialGradient throws DOMException if inner or outer radius <= 0.
         * This can happen when width is 0 (e.g. during first paint before resize),
         * or on extremely narrow viewports. Skip this orb if radius is not positive.
         */
        if (r <= 0) return;

        const hexColor = getOrbHexColor(palette, orb.color);
        const gradient = safeCtx.createRadialGradient(x, y, 0, x, y, r);

        if (dark) {
          gradient.addColorStop(0,    `${hexColor}44`);
          gradient.addColorStop(0.35, `${hexColor}18`);
          gradient.addColorStop(0.75, `${hexColor}08`);
        } else {
          gradient.addColorStop(0,    `${hexColor}22`);
          gradient.addColorStop(0.35, `${hexColor}12`);
          gradient.addColorStop(0.75, `${hexColor}06`);
        }
        gradient.addColorStop(1, 'transparent');

        safeCtx.fillStyle = gradient;
        safeCtx.beginPath();
        safeCtx.arc(x, y, r, 0, Math.PI * 2);
        safeCtx.fill();
      });

      safeCtx.restore(); // restores globalCompositeOperation = 'source-over'

      // ── Layer 3: Premium particles ────────────────────────────────────────
      particles.forEach(p => {
        // Advance position (wrap around viewport boundaries)
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -0.02) p.x = 1.02;
        if (p.x >  1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        if (p.y >  1.02) p.y = -0.02;

        const px = p.x * width;
        const py = p.y * height;

        // Breathing pulse — different phase per particle
        const pulse = 0.65 + Math.sin(time * 0.001 + p.x * 15 + p.y * 15) * 0.35;
        const alpha = p.alpha * palette.particleAlpha * pulse;

        // p.size is always >= 0.6 (see createParticles), so p.size * 4 >= 2.4 — safe
        const particleRadius = p.size * 4;
        const pg = safeCtx.createRadialGradient(px, py, 0, px, py, particleRadius);
        pg.addColorStop(0,    `rgba(255,255,255,${alpha.toFixed(4)})`);
        pg.addColorStop(0.45, `rgba(99,102,241,${(alpha * 0.45).toFixed(4)})`);
        pg.addColorStop(1,    'transparent');

        safeCtx.fillStyle = pg;
        safeCtx.beginPath();
        safeCtx.arc(px, py, particleRadius, 0, Math.PI * 2);
        safeCtx.fill();
      });

      // ── Layer 4: Atmosphere (central radial highlight) ────────────────────
      const atmosphereOuterRadius = width * 0.90;
      if (atmosphereOuterRadius > 0) {
        const atm = safeCtx.createRadialGradient(
          width * 0.5, height * 0.35, width * 0.05,
          width * 0.5, height * 0.35, atmosphereOuterRadius,
        );
        atm.addColorStop(0, dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.72)');
        atm.addColorStop(1, 'rgba(255,255,255,0)');
        safeCtx.fillStyle = atm;
        safeCtx.fillRect(0, 0, width, height);
      }

      // ── Layer 5: Micro grain overlay ──────────────────────────────────────
      if (grainPattern) {
        safeCtx.save();
        safeCtx.globalAlpha = dark ? 0.18 : 0.08;
        safeCtx.fillStyle   = grainPattern;
        safeCtx.fillRect(0, 0, width, height);
        safeCtx.restore();
      }

      // ── Layer 6: Executive vignette (edge darkening) ──────────────────────
      const vignetteOuter = Math.max(width, height);
      const vignetteInner = width * 0.12;
      // Guard: outer must be strictly greater than inner
      if (vignetteOuter > vignetteInner) {
        const vignette = safeCtx.createRadialGradient(
          width * 0.5, height * 0.5, vignetteInner,
          width * 0.5, height * 0.5, vignetteOuter,
        );
        vignette.addColorStop(0,    'rgba(0,0,0,0)');
        vignette.addColorStop(0.75, 'rgba(0,0,0,0)');
        vignette.addColorStop(1,    palette.vignette);
        safeCtx.fillStyle = vignette;
        safeCtx.fillRect(0, 0, width, height);
      }

      animationFrame = requestAnimationFrame(render);
    }

    // ── Initialise ───────────────────────────────────────────────────────────

    // Call resize synchronously first time so width/height are set before
    // the first render frame. Bypass the debounce by calling the inner impl
    // directly via IIFE — debounce delay is only for subsequent resize events.
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

    // MutationObserver: regenerate grain pattern when the dark class is toggled.
    // The gradient & orb colours adapt automatically each frame via getIsDark().
    const themeObserver = new MutationObserver(() => {
      grainPattern = createNoisePattern(ctx, getIsDark());
    });
    themeObserver.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['class'],
    });

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      cancelled = true;  // stop any pending rAF callback from scheduling another

      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      themeObserver.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [variant]);

  return (
    <>
      {/*
        Canvas is absolute (NOT fixed) because the parent container in
        PublicLayout is already `fixed inset-0 z-0`. Using fixed here would
        create a double-stacking-context issue in some browsers.
      */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none select-none"
      />

      {/* Bottom-edge fade — blends canvas into the page content below */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/[0.02] dark:to-black/[0.10]"
      />
    </>
  );
};

export default PublicBackground;
