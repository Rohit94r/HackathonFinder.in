'use client';

import { useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/cn';
import SaveButton from './SaveButton';

interface MobileRegisterBarProps {
  slug: string;
  title: string;
  open: boolean;
  /** "Closes tomorrow", "Happening now", … */
  when: string;
  /** "5 Nov", the registration deadline. */
  deadline: string;
  hurry: boolean;
}

/**
 * Phones: the deadline, Save and Register pinned to the bottom of a hackathon's page, so the
 * main action is always one tap away instead of below the map and the route. Hidden from lg up,
 * where the sidebar holds them.
 */
export default function MobileRegisterBar({ slug, title, open, when, deadline, hurry }: MobileRegisterBarProps) {
  // The page keeps clear of the bar and toasts sit above it (--hf-dock, see globals.css and Toaster).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--hf-dock', 'calc(68px + env(safe-area-inset-bottom))');
    return () => {
      root.style.removeProperty('--hf-dock');
    };
  }, []);

  return (
    <>
      <div
        data-theme="dark"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-surface/95 pb-[env(safe-area-inset-bottom)] text-ink backdrop-blur supports-[backdrop-filter]:bg-surface/85 lg:hidden"
      >
        <div className="platform-edge h-[3px]" aria-hidden="true" />
        <div className="mx-auto flex h-[65px] max-w-2xl items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className={cn('truncate font-display text-[17px] font-bold uppercase leading-tight', hurry ? 'text-board' : 'text-ink')}>{when}</p>
            {open && <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink/55">Board by {deadline}</p>}
          </div>
          <SaveButton slug={slug} title={title} size="lg" className="shrink-0" />
          {open ? (
            <a href={`/go/${slug}`} target="_blank" rel="noopener noreferrer" className="btn-primary h-11 shrink-0 px-4">
              Register
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          ) : (
            <span className="btn h-11 shrink-0 cursor-not-allowed border-ink/20 px-4 text-ink/50">Closed</span>
          )}
        </div>
      </div>
    </>
  );
}
