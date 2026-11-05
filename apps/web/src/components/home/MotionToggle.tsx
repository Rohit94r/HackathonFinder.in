'use client';

import { useEffect, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { MOTION_KEY } from '@/lib/theme';
import { cn } from '@/lib/cn';

/**
 * Pauses the homepage's moving parts (the announcement ticker and the board's page flips).
 * Anything that moves on its own for more than five seconds needs a way to stop it (WCAG 2.2.2).
 * The choice is kept in this browser and applied before first paint (see app/layout.tsx).
 */
export default function MotionToggle({ className }: { className?: string }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => setPaused(document.documentElement.dataset.motion === 'paused'), []);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    if (next) document.documentElement.dataset.motion = 'paused';
    else delete document.documentElement.dataset.motion;
    try {
      if (next) localStorage.setItem(MOTION_KEY, 'paused');
      else localStorage.removeItem(MOTION_KEY);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={paused}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-ink/15 px-2.5 py-1.5 font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-ink/60 transition-colors hover:border-ink/40 hover:text-ink motion-reduce:hidden',
        className
      )}
    >
      {paused ? <Play className="h-3 w-3" aria-hidden="true" /> : <Pause className="h-3 w-3" aria-hidden="true" />}
      {paused ? 'Play animations' : 'Pause animations'}
    </button>
  );
}
