'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DiscoveryTab {
  id: string;
  label: string;
  count: number;
  /** The same view on the Explore page, with every result. */
  href: string;
  content: React.ReactNode;
}

/** Tabs over pre-rendered card grids. Arrow keys move between tabs (WAI-ARIA tabs pattern). */
export default function DiscoveryTabs({ tabs }: { tabs: DiscoveryTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    setActive(tabs[next].id);
    refs.current[next]?.focus();
  };

  if (!current) return null;

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-line sm:flex-row sm:items-end sm:justify-between">
        <div role="tablist" aria-label="Browse hackathons" className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
          {tabs.map((t, i) => {
            const selected = t.id === current.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
                  selected ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
                )}
              >
                {t.label}
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums',
                    selected ? 'bg-accent-soft text-brand-700 dark:bg-accent/20 dark:text-brand-200' : 'bg-ink/[0.05] text-muted'
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
        <Link href={current.href} className="hidden shrink-0 items-center gap-1 pb-3 text-sm font-medium text-accent hover:text-accent-dark sm:inline-flex">
          View all {current.count}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== current.id}
          className="pt-6"
        >
          {t.content}
        </div>
      ))}

      <Link href={current.href} className="btn-secondary mt-6 w-full sm:hidden">
        View all {current.count}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
