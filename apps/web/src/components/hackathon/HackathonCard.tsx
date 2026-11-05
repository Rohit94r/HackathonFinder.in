import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, CalendarDays, MapPin, Navigation, Users } from 'lucide-react';
import { eventTypeLabel, modeLabel, placeName, sourceBySlug, themeName } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { deadlineLabel, formatDateRange, formatDay, formatKm, formatPrizeShort, formatTeamSize } from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';
import EventArt from './EventArt';
import SaveButton from './SaveButton';
import StatusBadge from './StatusBadge';

export type CardVariant = 'standard' | 'featured' | 'compact';

interface HackathonCardProps {
  h: HackathonView;
  /** Km from the student, when we know where they are and the event is in person. */
  distanceKm?: number;
  /** standard: grid card. featured: wide, image beside the details. compact: one dense row for lists. */
  variant?: CardVariant;
  /** Load the cover straight away (above the fold). */
  eager?: boolean;
  className?: string;
}

/** "Closes in 3 days" for open events; otherwise what's happening now. */
export function deadlineText(h: HackathonView): string {
  if (h.status === 'open' || h.status === 'closing-soon') return deadlineLabel(h.daysToDeadline);
  if (h.status === 'in-progress') return 'Happening now';
  return h.status === 'completed' ? 'Event ended' : 'Registration closed';
}

function prizeText(h: HackathonView): string {
  return h.prizePool > 0 ? formatPrizeShort(h.prizePool, h.prizeCurrency) : 'See official page';
}

function whereText(h: HackathonView): string {
  return h.mode === 'online' ? 'Online' : placeName(h);
}

function Tags({ h, max = 2 }: { h: HackathonView; max?: number }) {
  const extra = h.themes.length - max;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Themes">
      {h.themes.slice(0, max).map((t) => (
        <li key={t} className={cn('rounded-md px-2 py-0.5 text-xs font-medium', themeStyle(t).soft)}>
          {themeName(t)}
        </li>
      ))}
      {extra > 0 && <li className="rounded-md bg-ink/[0.05] px-2 py-0.5 text-xs font-medium text-muted">+{extra}</li>}
      {h.fee === 0 && <li className="rounded-md bg-ink/[0.05] px-2 py-0.5 text-xs font-medium text-ink/70">Free</li>}
      {h.beginnerFriendly && <li className="rounded-md bg-ink/[0.05] px-2 py-0.5 text-xs font-medium text-ink/70">Beginner-friendly</li>}
    </ul>
  );
}

/** Organizer line with the verified tick. */
function Organizer({ h }: { h: HackathonView }) {
  return (
    <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
      <span className="truncate">{h.organizer || `Listed on ${sourceBySlug(h.sources[0])?.name ?? 'HackathonFinder'}`}</span>
      {h.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-label="Verified organizer" />}
    </p>
  );
}

/** Title as a stretched link: the whole card is clickable, while the bookmark stays a separate button. */
function TitleLink({ h, className }: { h: HackathonView; className?: string }) {
  return (
    <Link
      href={`/hackathons/${h.slug}`}
      prefetch={false}
      className={cn(
        'text-ink outline-none transition-colors after:absolute after:inset-0 after:z-[1] after:rounded-xl group-hover:text-accent focus-visible:after:ring-2 focus-visible:after:ring-accent',
        className
      )}
    >
      {h.title}
    </Link>
  );
}

function Deadline({ h }: { h: HackathonView }) {
  const open = h.status === 'open' || h.status === 'closing-soon';
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Deadline</dt>
      <dd className="mt-0.5">
        {open && <span className="block truncate text-sm font-semibold text-ink">{formatDay(h.registrationDeadline)}</span>}
        <span
          className={cn(
            'block truncate',
            open ? 'text-xs' : 'text-sm',
            h.status === 'closing-soon' ? 'font-medium text-warning dark:text-amber-300' : 'text-muted'
          )}
        >
          {deadlineText(h)}
        </span>
      </dd>
    </div>
  );
}

function Prize({ h }: { h: HackathonView }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">Prize pool</dt>
      <dd className={cn('mt-0.5 truncate text-sm font-semibold', h.prizePool > 0 ? 'text-ink' : 'font-normal text-muted')}>{prizeText(h)}</dd>
    </div>
  );
}

function Where({ h, distanceKm }: { h: HackathonView; distanceKm?: number }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm text-ink/75">
      {distanceKm !== undefined ? (
        <Navigation className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
      ) : (
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
      )}
      <span className="truncate">
        {whereText(h)}
        {h.mode !== 'online' && <span className="text-muted"> · {modeLabel(h.mode)}</span>}
        {distanceKm !== undefined && <span className="font-medium text-accent"> · {formatKm(distanceKm)} away</span>}
      </span>
    </p>
  );
}

export default function HackathonCard({ h, distanceKm, variant = 'standard', eager = false, className }: HackathonCardProps) {
  if (variant === 'compact') {
    return (
      <article
        data-hf-impression={h.slug}
        className={cn('group relative flex items-center gap-4 rounded-xl border border-line bg-card p-3 transition-colors hover:border-ink/20', className)}
      >
        <EventArt title={h.title} imageUrl={h.imageUrl} className="h-16 w-24 shrink-0 rounded-lg sm:h-[72px] sm:w-28" />
        <div className="min-w-0 flex-1">
          <Organizer h={h} />
          <h3 className="mt-0.5 line-clamp-1 text-[15px] font-semibold leading-snug">
            <TitleLink h={h} />
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{whereText(h)}</span>
            <span className={cn(h.prizePool > 0 && 'font-medium text-ink')}>{prizeText(h)}</span>
            <span className={cn(h.status === 'closing-soon' && 'font-medium text-warning dark:text-amber-300')}>{deadlineText(h)}</span>
          </p>
        </div>
        <SaveButton slug={h.slug} title={h.title} className="relative z-[2] shrink-0" />
      </article>
    );
  }

  if (variant === 'featured') {
    return (
      <article
        data-hf-impression={h.slug}
        className={cn(
          'group relative grid overflow-hidden rounded-xl border border-line bg-card shadow-card transition-[box-shadow,border-color] duration-200 hover:border-ink/15 hover:shadow-lift md:grid-cols-[1.1fr_1fr]',
          className
        )}
      >
        <div className="relative">
          <EventArt title={h.title} imageUrl={h.imageUrl} size="hero" eager={eager} className="aspect-[16/9] h-full w-full md:aspect-auto md:min-h-[300px]" />
          <div className="absolute left-3 top-3 z-[2] flex gap-1.5">
            <StatusBadge status={h.status} />
            {h.featured && <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-white">Featured</span>}
          </div>
        </div>
        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-accent">{eventTypeLabel(h.type)}</p>
              <Organizer h={h} />
            </div>
            <SaveButton slug={h.slug} title={h.title} className="relative z-[2] shrink-0" />
          </div>
          <h3 className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">
            <TitleLink h={h} />
          </h3>
          {h.tagline && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{h.tagline}</p>}
          <div className="mt-4 space-y-2">
            <Where h={h} distanceKm={distanceKm} />
            <p className="flex items-center gap-1.5 text-sm text-ink/75">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
              {formatDateRange(h.startDate, h.endDate)}
            </p>
          </div>
          <div className="mt-4">
            <Tags h={h} max={3} />
          </div>
          <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-line pt-4">
            <Prize h={h} />
            <Deadline h={h} />
          </dl>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent">
            View details
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      data-hf-impression={h.slug}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-line bg-card shadow-card transition-[box-shadow,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-ink/15 hover:shadow-lift motion-reduce:hover:translate-y-0',
        className
      )}
    >
      <div className="relative">
        <EventArt title={h.title} imageUrl={h.imageUrl} eager={eager} className="aspect-[16/9] w-full" />
        <div className="absolute left-3 top-3 z-[2] flex gap-1.5">
          <StatusBadge status={h.status} />
          {h.featured && <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-white">Featured</span>}
        </div>
        <SaveButton slug={h.slug} title={h.title} className="absolute right-3 top-3 z-[2]" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Organizer h={h} />
        <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold leading-snug">
          <TitleLink h={h} />
        </h3>
        <div className="mt-2.5 space-y-1.5">
          <Where h={h} distanceKm={distanceKm} />
          <p className="flex items-center gap-1.5 text-sm text-ink/75">
            <Users className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
            <span className="truncate">{formatTeamSize(h.teamMin, h.teamMax, h.teamSizeKnown !== false)}</span>
          </p>
        </div>
        <div className="mt-3">
          <Tags h={h} />
        </div>
        <div className="mt-auto pt-4">
          <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3">
            <Prize h={h} />
            <Deadline h={h} />
          </dl>
        </div>
      </div>
    </article>
  );
}

/** Placeholder with the card's shape while results load. */
export function HackathonCardSkeleton({ variant = 'standard' }: { variant?: CardVariant }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-line bg-card p-3" aria-hidden="true">
        <div className="skeleton h-16 w-24 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-card" aria-hidden="true">
      <div className="skeleton aspect-[16/9] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <div className="skeleton h-5 w-14" />
          <div className="skeleton h-5 w-12" />
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
          <div className="skeleton h-8" />
          <div className="skeleton h-8" />
        </div>
      </div>
    </div>
  );
}
