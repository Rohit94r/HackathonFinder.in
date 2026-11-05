'use client';

import { useEffect, useRef } from 'react';

// Characters you'd see in source code, weighted towards punctuation so it reads as code, not text.
const GLYPHS = '{}[]()<>/\\=;:+-*&|!?#$_.,01{}<>/=;()=>constletfnifreturnasyncawait'.split('');

interface Pulse {
  x: number;
  y: number;
  born: number;
}

/**
 * The hero background: a field of code characters that keep changing, with signal pulses
 * rippling across it and a glow that follows the pointer. Drawn on a canvas at ~30 fps,
 * paused off-screen and in background tabs; a single still frame for reduced motion.
 */
export default function CodeField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let cell = 18;
    let row = 22;
    let cols = 0;
    let rows = 0;
    let glyphs = new Uint8Array(0);
    let heat = new Float32Array(0);
    const pulses: Pulse[] = [];
    const mouse = { x: -1000, y: -1000, tx: -1000, ty: -1000 };
    let visible = true;
    let frame = 0;
    let last = 0;
    let lastPulse = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = width < 640 ? 16 : 18;
      row = width < 640 ? 20 : 22;
      cols = Math.ceil(width / cell) + 1;
      rows = Math.ceil(height / row) + 1;
      glyphs = new Uint8Array(cols * rows).map(() => Math.floor(Math.random() * GLYPHS.length));
      heat = new Float32Array(cols * rows);
      ctx.font = `500 ${width < 640 ? 11 : 12}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
    };

    const draw = (now: number) => {
      // Ease the glow towards the pointer.
      mouse.x += (mouse.tx - mouse.x) * 0.12;
      mouse.y += (mouse.ty - mouse.y) * 0.12;

      if (!still) {
        // A few characters change every frame.
        const changes = Math.max(4, Math.floor(glyphs.length * 0.004));
        for (let i = 0; i < changes; i++) {
          const k = Math.floor(Math.random() * glyphs.length);
          glyphs[k] = Math.floor(Math.random() * GLYPHS.length);
          heat[k] = 1;
        }
        if (now - lastPulse > 1600) {
          lastPulse = now;
          pulses.push({ x: Math.random() * width, y: Math.random() * height * 0.75, born: now });
        }
        while (pulses.length && now - pulses[0].born > 3200) pulses.shift();
      }

      ctx.clearRect(0, 0, width, height);
      for (let r = 0; r < rows; r++) {
        const y = r * row + row / 2;
        for (let c = 0; c < cols; c++) {
          const x = c * cell + cell / 2;
          const k = r * cols + c;

          const dm = Math.hypot(x - mouse.x, y - mouse.y);
          const glow = dm < 200 ? (1 - dm / 200) ** 2 : 0;

          let ring = 0;
          for (const p of pulses) {
            const age = (now - p.born) / 1000;
            const radius = age * 240;
            const band = 1 - Math.abs(Math.hypot(x - p.x, y - p.y) - radius) / 46;
            if (band > 0) ring = Math.max(ring, band * (1 - age / 3.2));
          }

          const flicker = heat[k];
          if (flicker > 0) heat[k] = flicker * 0.9;

          const alpha = 0.075 + glow * 0.75 + ring * 0.45 + flicker * 0.16;
          if (alpha < 0.08 && !ring && !glow) {
            ctx.fillStyle = 'rgba(148,153,180,0.075)';
          } else if (glow > ring) {
            ctx.fillStyle = `rgba(165,163,255,${Math.min(1, alpha)})`;
          } else if (ring > 0.05) {
            ctx.fillStyle = `rgba(125,211,252,${Math.min(1, alpha)})`;
          } else {
            ctx.fillStyle = `rgba(148,153,180,${Math.min(1, alpha)})`;
          }
          ctx.fillText(GLYPHS[glyphs[k]], x, y);
        }
      }
    };

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      if (!visible || document.hidden || now - last < 33) return;
      last = now;
      draw(now);
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - rect.left;
      mouse.ty = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.tx = -1000;
      mouse.ty = -1000;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(canvas);

    if (still) {
      draw(performance.now());
    } else {
      window.addEventListener('pointermove', onPointer, { passive: true });
      document.addEventListener('pointerleave', onLeave);
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className={className} />;
}
