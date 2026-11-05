import { Check, CheckCircle2, Clock, Laptop, Sparkles, Users, XCircle } from 'lucide-react';
import { teamModeLabel, type TeamMode, type TeamStatus } from '@/data/teamPosts';
import { cn } from '@/lib/cn';
import type { SkillMatch } from './teamUtils';

// Small pieces shared by the Team Finder cards and panels. Colours are the site palette
// only: brand red for what matters to the viewer, ink tints for everything else.

export function ModeBadge({ mode }: { mode: TeamMode }) {
  const Icon = mode === 'online' ? Laptop : Users;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-ink/[0.06] px-2 py-0.5 text-[11px] font-semibold text-ink/75">
      <Icon className="h-3 w-3" aria-hidden="true" />
      {teamModeLabel(mode)}
    </span>
  );
}

export function MatchBadge({ match }: { match: SkillMatch }) {
  const tone = match.pct >= 75 ? 'bg-accent text-white' : match.pct > 0 ? 'bg-accent/10 text-brand-700 dark:text-brand-300' : 'bg-ink/5 text-ink/60';
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-xs font-bold', tone)}>
      <Sparkles className="h-3 w-3" aria-hidden="true" />
      {match.pct}% match
    </span>
  );
}

/** Class names for one skill chip; `hit` marks a skill that matches the viewer. */
export function skillChip(hit = false): string {
  return cn(
    'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium',
    hit ? 'bg-accent/10 text-brand-700 ring-1 ring-inset ring-accent/30 dark:text-brand-300' : 'bg-ink/[0.06] text-ink/80'
  );
}

/** A row of skill chips; skills in `highlight` stand out as matches. */
export function SkillChips({ label, skills, highlight = [] }: { label?: string; skills: string[]; highlight?: string[] }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {label && <span className="w-12 shrink-0 pt-0.5 font-semibold text-ink/55">{label}</span>}
      <div className="flex min-w-0 flex-wrap gap-1.5">
        {skills.length === 0 && <span className="pt-0.5 text-ink/45">None listed</span>}
        {skills.map((s) => {
          const hit = highlight.includes(s);
          return (
            <span key={s} className={skillChip(hit)}>
              {hit && <Check className="h-3 w-3" aria-hidden="true" />}
              {s}
              {hit && <span className="sr-only"> (match)</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** "2 of 4 members": a filled bar per seat, plus the spots left. */
export function TeamSize({ members, teamMax }: { members: number; teamMax: number }) {
  const open = Math.max(0, teamMax - members);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-ink">
          {members} of {teamMax} members
        </span>
        <span className={open ? 'font-semibold text-brand-700 dark:text-brand-300' : 'text-ink/55'}>
          {open === 0 ? 'Team full' : `${open} ${open === 1 ? 'spot' : 'spots'} open`}
        </span>
      </div>
      <div className="mt-1.5 flex gap-1" aria-hidden="true">
        {Array.from({ length: teamMax }, (_, i) => (
          <span key={i} className={cn('h-1.5 flex-1 rounded-full', i < members ? 'bg-accent' : 'bg-ink/10')} />
        ))}
      </div>
    </div>
  );
}

export function MatchNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-accent/[0.07] px-3 py-2 text-xs font-medium text-ink/80">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function YouBadge({ label = 'You' }: { label?: string }) {
  return <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold uppercase text-surface">{label}</span>;
}

/** Marks the preview's sample students, who can't get requests, invites or messages. */
export function SampleBadge() {
  return (
    <span
      className="rounded border border-ink/15 bg-ink/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink/65"
      title="A sample student for the preview. They can’t get requests, invites or messages."
    >
      Sample
    </span>
  );
}

const STATUS: Record<TeamStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Waiting', className: 'bg-ink/[0.07] text-ink/80', icon: Clock },
  accepted: { label: 'Accepted', className: 'bg-accent/10 text-brand-700 dark:text-brand-300', icon: CheckCircle2 },
  declined: { label: 'Declined', className: 'bg-ink/5 text-ink/55', icon: XCircle },
  withdrawn: { label: 'Withdrawn', className: 'bg-ink/5 text-ink/55', icon: XCircle },
};

export function StatusChip({ status }: { status: TeamStatus }) {
  const { label, className, icon: Icon } = STATUS[status];
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold', className)}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}

/** A short status line on a card, e.g. "Request sent. Waiting for Aarav." */
export function StatusLine({ tone = 'muted', children }: { tone?: 'good' | 'muted'; children: React.ReactNode }) {
  return (
    <p
      role="status"
      className={cn(
        'mb-3 flex items-start gap-1.5 text-xs font-semibold',
        tone === 'good' ? 'text-brand-700 dark:text-brand-300' : 'text-ink/60'
      )}
    >
      {tone === 'good' && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
      <span>{children}</span>
    </p>
  );
}

/** Inline error under an action. */
export function ActionError({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-2 text-xs font-medium text-brand-700 dark:text-brand-300">
      {children}
    </p>
  );
}
