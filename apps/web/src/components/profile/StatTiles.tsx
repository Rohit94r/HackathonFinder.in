import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatTone = 'amber' | 'pink' | 'violet' | 'cyan';

export interface StatItem {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: StatTone;
}

// Tone names are kept for callers; the colours are the landing palette (gold stays for wins).
const TONES: Record<StatTone, string> = {
  amber: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200',
  pink: 'bg-pop-soft text-[#a4460a] dark:bg-pop/15 dark:text-[#ffc59a]',
  violet: 'bg-brand-50 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200',
  cyan: 'bg-ink/[0.06] text-ink/80',
};

/** A row of headline numbers, LeetCode style. */
export default function StatTiles({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {items.map(({ label, value, icon: Icon, tone = 'violet' }) => (
        <div key={label} className="card flex items-center gap-3 p-4">
          <span className={cn('inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONES[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="truncate text-xs font-medium uppercase tracking-wider text-ink/60">{label}</dt>
            <dd className="font-display text-3xl leading-none text-ink">{value.toLocaleString('en-IN')}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
