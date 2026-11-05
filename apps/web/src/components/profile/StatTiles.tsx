import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatTone = 'amber' | 'pink' | 'violet' | 'cyan';

export interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: StatTone;
}

// Tone names are kept for callers; the colours are the site palette: brand red and ink tints.
const TONES: Record<StatTone, string> = {
  amber: 'bg-accent text-white',
  pink: 'bg-accent/10 text-brand-700 dark:text-brand-300',
  violet: 'bg-ink/[0.07] text-ink',
  cyan: 'bg-ink/[0.07] text-ink/80',
};

/** A row of headline numbers, LeetCode style. */
export default function StatTiles({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {items.map(({ label, value, icon: Icon, tone = 'violet' }) => (
        <div key={label} className="card flex items-center gap-3 p-4">
          <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', TONES[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="truncate text-xs font-medium uppercase tracking-wider text-ink/60">{label}</dt>
            <dd className="font-display text-3xl leading-none text-ink">{value.toLocaleString('en-US')}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
