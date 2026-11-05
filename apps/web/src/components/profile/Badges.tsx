import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BADGES, type BadgeState } from './badgeData';

/** Earned badges in colour, locked ones greyed out with their progress. */
export default function Badges({ states }: { states: BadgeState[] }) {
  const byId = new Map(states.map((s) => [s.id, s]));
  const earned = states.filter((s) => s.earned).length;

  return (
    <div>
      <p className="mb-4 text-sm text-ink/70">
        <strong className="text-ink">{earned}</strong> of {BADGES.length} earned
      </p>
      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
        {BADGES.map((b) => {
          const state = byId.get(b.id);
          const isEarned = Boolean(state?.earned);
          const Icon = b.icon;
          return (
            <li key={b.id} className="flex flex-col items-center text-center">
              <span
                className={cn(
                  'relative inline-flex h-14 w-14 items-center justify-center rounded-xl',
                  isEarned ? cn(b.tone, 'shadow-card') : 'bg-ink/5 text-ink/30'
                )}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                {!isEarned && (
                  <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-card text-ink/50 ring-1 ring-ink/10">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span className={cn('mt-2 text-xs font-semibold', isEarned ? 'text-ink' : 'text-ink/60')}>{b.name}</span>
              <span className="mt-0.5 text-[11px] leading-4 text-ink/55">
                {b.description}
                {!isEarned && state?.progress && ` (${state.progress.value}/${state.progress.goal})`}
              </span>
              <span className="sr-only">{isEarned ? 'Earned' : 'Not earned yet'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
