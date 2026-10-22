import { Check, Laptop, Sparkles, Users } from 'lucide-react';
import { teamModeLabel, type TeamMode, type TeamStatus } from '@/data/teamPosts';
import { cn } from '@/lib/cn';
import type { SkillMatch } from './teamUtils';

const MODE_STYLES: Record<TeamMode, string> = {
  'in-person': 'bg-ink/5 text-ink/80',
  online: 'bg-pop/15 text-ink',
  either: 'bg-ink/5 text-ink/80',
};

export function ModeBadge({ mode }: { mode: TeamMode }) {
  const Icon = mode === 'online' ? Laptop : Users;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', MODE_STYLES[mode])}>
      <Icon className="h-3 w-3" />
      {teamModeLabel(mode)}
    </span>
  );
}

export function MatchBadge({ match }: { match: SkillMatch }) {
  const tone =
    match.pct >= 75
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/25 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/30'
      : match.pct > 0
        ? 'bg-amber-50 text-amber-800 ring-amber-500/30 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/30'
        : 'bg-ink/5 text-ink/60 ring-ink/10';
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset', tone)}>
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {match.pct}% match
    </span>
  );
}

/** A row of skill chips; skills in `highlight` stand out as matches. */
export function SkillChips({ label, skills, highlight = [] }: { label?: string; skills: string[]; highlight?: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs">
      {label && <span className="w-12 shrink-0 font-semibold text-ink/60">{label}</span>}
      {skills.map((s) => {
        const hit = highlight.includes(s);
        return (
          <span
            key={s}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium',
              hit
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-600/25 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/30'
                : 'bg-ink/5 text-ink/80'
            )}
          >
            {hit && <Check className="h-3 w-3" aria-hidden="true" />}
            {s}
            {hit && <span className="sr-only"> (match)</span>}
          </span>
        );
      })}
    </div>
  );
}

/** "2/4 members" with a dot per seat. */
export function TeamSize({ members, teamMax }: { members: number; teamMax: number }) {
  const open = Math.max(0, teamMax - members);
  return (
    <div className="flex items-center gap-2 text-xs text-ink/70">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: teamMax }, (_, i) => (
          <span key={i} className={cn('h-2.5 w-2.5 rounded-full', i < members ? 'bg-brand-500' : 'border border-ink/30')} />
        ))}
      </span>
      <span>
        <strong className="text-ink">
          {members}/{teamMax}
        </strong>{' '}
        members · {open === 0 ? 'full' : `${open} ${open === 1 ? 'spot' : 'spots'} open`}
      </span>
    </div>
  );
}

export function MatchNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function YouBadge({ label = 'You' }: { label?: string }) {
  return <span className="rounded bg-pop px-1.5 py-0.5 text-[10px] font-bold uppercase text-navy">{label}</span>;
}

/** Marks the preview's sample students, who can't answer requests or invites. */
export function SampleBadge() {
  return (
    <span className="rounded bg-ink/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink/70" title="A sample student for the preview">
      Sample
    </span>
  );
}

const STATUS_STYLES: Record<TeamStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200',
  accepted: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200',
  declined: 'bg-ink/5 text-ink/70',
  withdrawn: 'bg-ink/5 text-ink/60',
};

const STATUS_LABELS: Record<TeamStatus, string> = {
  pending: 'Waiting',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
};

export function StatusChip({ status }: { status: TeamStatus }) {
  return (
    <span className={cn('inline-flex shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

/** Inline error under an action. */
export function ActionError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-300">
      {children}
    </p>
  );
}
