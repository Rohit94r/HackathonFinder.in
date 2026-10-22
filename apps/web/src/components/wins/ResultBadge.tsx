import { Award, Medal, Star, Trophy } from 'lucide-react';
import { RESULT_LABELS, type ResultKind } from '@/data/people';
import { cn } from '@/lib/cn';

// Same hue per result everywhere (badges, the profile ring, banners): gold, red, orange, grey.
export const RESULT_STYLES: Record<ResultKind, string> = {
  winner: 'bg-amber-400 text-navy ring-amber-500/40',
  'runner-up': 'bg-brand-50 text-brand-700 ring-accent/25 dark:bg-brand-400/15 dark:text-brand-200',
  finalist: 'bg-pop-soft text-[#a4460a] ring-pop/30 dark:bg-pop/15 dark:text-[#ffc59a]',
  participant: 'bg-ink/[0.06] text-ink/70 ring-ink/15',
};

/** Hex colours for chart marks, matching the badges. The legend always names each one. */
export const RESULT_COLORS: Record<ResultKind, string> = {
  winner: '#E5A00D',
  'runner-up': '#ec3750',
  finalist: '#ff8c37',
  participant: '#8a8a93',
};

export const RESULT_ICONS = { winner: Trophy, 'runner-up': Medal, finalist: Award, participant: Star } as const;

export default function ResultBadge({ result, className }: { result: ResultKind; className?: string }) {
  const Icon = RESULT_ICONS[result];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        RESULT_STYLES[result],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {RESULT_LABELS[result]}
    </span>
  );
}
