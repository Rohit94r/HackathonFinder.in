import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, CalendarDays, MapPin, Navigation, Users } from 'lucide-react';
import { eventTypeLabel, modeLabel, placeName, sourceBySlug, themeName } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { deadlineLabel, formatDateRange, formatDay, formatKm, formatPrizeShort, formatTeamSize } from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { ticketNo } from '@/lib/stations';
import { cn } from '@/lib/cn';
import { Barcode } from '@/components/junction/Signs';
import DistanceTag from './DistanceTag';
import EventArt from './EventArt';
import SaveButton from './SaveButton';
import StatusBadge from './StatusBadge';

export type CardVariant = 'standard' | 'featured' | 'compact';

interface HackathonCardProps {
  h: HackathonView;
  /** Km from the student, when we know where they are and the event is in person. */
  distanceKm?: number;
  /** standard: grid ticket. featured: wide boarding pass, image beside the details. compact: one slim ticket row for lists. */
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

function prizeText(h: HackathonView, short = false): string {
  if (h.prizePool > 0) return formatPrizeShort(h.prizePool, h.prizeCurrency);
  return short ? 'See page' : 'See official page';
}

/** Under the "Closes" label the verb is already said: "in 3 days", "tomorrow". */
function whenText(h: HackathonView): string {
  return deadlineText(h).replace(/^Closes /, '');
}

function whereText(h: HackathonView): string {
  return h.mode === 'online' ? 'Online' : placeName(h);
}

const tag = 'rounded-[4px] px-1.5 py-0.5 font-display text-[12.5px] font-semibold uppercase tracking-[0.05em]';

function Tags({ h, max = 2 }: { h: HackathonView; max?: number }) {
  const extra = h.themes.length - max;
  const quiet = cn(tag, 'border border-ink/15 text-ink/70');
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Themes">
      {h.themes.slice(0, max).map((t) => (
        <li key={t} className={cn(tag, themeStyle(t).soft)}>
          {themeName(t)}
        </li>
      ))}
      {extra > 0 && <li className={quiet}>+{extra}</li>}
      {h.fee === 0 && <li className={quiet}>Free</li>}
      {h.beginnerFriendly && <li className={quiet}>Beginner-friendly</li>}
    </ul>
  );
}

/** Organizer line with the verified tick. */
function Organizer({ h }: { h: HackathonView }) {
  return (
    <p className="flex min-w-0 items-center gap-1 text-xs text-muted">
      <span className="truncate">{h.organizer || `Listed on ${sourceBySlug(h.sources[0])?.name ?? 'HackathonFinder'}`}</span>
      {h.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent dark:text-board" aria-label="Verified organizer" />}
    </p>
  );
}

/** Title as a stretched link: the whole ticket is clickable, while the bookmark stays a separate button. */
function TitleLink({ h, className }: { h: HackathonView; className?: string }) {
  return (
    <Link
      href={`/hackathons/${h.slug}`}
      prefetch={false}
      className={cn(
        'text-ink outline-none transition-colors after:absolute after:inset-0 after:z-[1] after:rounded-lg group-hover:text-accent focus-visible:after:ring-[3px] focus-visible:after:ring-board dark:group-hover:text-board',
        className
      )}
    >
      {h.title}
    </Link>
  );
}

/** The ticket's top line: what kind of event and how you attend, then the ticket number. */
function TicketLine({ h, className }: { h: HackathonView; className?: string }) {
  return (
    <p className={cn('flex items-center justify-between gap-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted', className)}>
      <span className="truncate">
        {eventTypeLabel(h.type)} · {h.mode === 'online' ? 'Online' : modeLabel(h.mode)}
      </span>
      <span className="shrink-0" aria-hidden="true">
        No. {ticketNo(h.slug)}
      </span>
    </p>
  );
}

const stubLabel = 'font-mono text-[9.5px] font-medium uppercase tracking-[0.18em] text-muted';

function Deadline({ h, big = false }: { h: HackathonView; big?: boolean }) {
  const open = h.status === 'open' || h.status === 'closing-soon';
  return (
    <div className="min-w-0">
      <dt className={stubLabel}>Closes</dt>
      <dd className="mt-1">
        {open && (
          <span className={cn('block truncate font-display font-bold uppercase leading-none text-ink', big ? 'text-[26px]' : 'text-[21px]')}>
            {formatDay(h.registrationDeadline)}
          </span>
        )}
        <span
          className={cn(
            'mt-0.5 block truncate',
            open ? 'text-[11.5px]' : 'text-sm',
            h.status === 'closing-soon' ? 'font-semibold text-accent dark:text-board' : 'text-muted'
          )}
        >
          {whenText(h)}
        </span>
      </dd>
    </div>
  );
}

function Prize({ h, big = false }: { h: HackathonView; big?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className={stubLabel}>Prize pool</dt>
      <dd
        className={cn(
          'mt-1 truncate',
          h.prizePool > 0 ? cn('font-display font-bold leading-none text-ink', big ? 'text-[26px]' : 'text-[21px]') : 'text-sm text-muted'
        )}
      >
        {prizeText(h, true)}
      </dd>
    </div>
  );
}

function Where({ h, distanceKm }: { h: HackathonView; distanceKm?: number }) {
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-sm text-ink/75">
      {distanceKm !== undefined ? (
        <Navigation className="h-3.5 w-3.5 shrink-0 text-accent dark:text-board" aria-hidden="true" />
      ) : (
        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
      )}
      <span className="truncate">
        <span className="font-semibold text-ink">{whereText(h)}</span>
        {h.mode !== 'online' && <span className="text-muted"> · {modeLabel(h.mode)}</span>}
      </span>
      {/* Near me passes the distance in; everywhere else the ticket works it out from the saved location. */}
      {distanceKm !== undefined ? (
        <span className="shrink-0 whitespace-nowrap font-semibold text-accent dark:text-board">· {formatKm(distanceKm)} away</span>
      ) : (
        <DistanceTag h={h} className="shrink-0" />
      )}
    </p>
  );
}

/** A crooked "Featured" rubber stamp over the cover. */
function FeaturedStamp({ className }: { className?: string }) {
  return <span className={cn('stamp bg-navy/70 text-board backdrop-blur-sm', className)}>Featured</span>;
}

export default function HackathonCard({ h, distanceKm, variant = 'standard', eager = false, className }: HackathonCardProps) {
  if (variant === 'compact') {
    // A slim ticket: cover and details, with a stub on the right showing the deadline.
    return (
      <article data-hf-impression={h.slug} className={cn('ticket ticket-v group relative [--notch:7px] [--stub:92px] sm:[--stub:104px]', className)}>
        <div className="ticket-paper flex items-stretch">
          <div className="flex min-w-0 flex-1 items-center gap-3 p-2.5 sm:gap-4">
            <EventArt title={h.title} imageUrl={h.imageUrl} className="h-16 w-20 shrink-0 rounded-[5px] sm:h-[72px] sm:w-28" />
            <div className="min-w-0 flex-1">
              <Organizer h={h} />
              <h3 className="mt-0.5 line-clamp-1 text-[15px] font-semibold leading-snug">
                <TitleLink h={h} />
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold text-ink/80">{whereText(h)}</span>
                  <DistanceTag h={h} />
                </span>
                <span className={cn(h.prizePool > 0 && 'font-semibold text-ink')}>{prizeText(h)}</span>
              </p>
            </div>
            <SaveButton slug={h.slug} title={h.title} className="relative z-[2] shrink-0" />
          </div>
          <div className="ticket-stub flex shrink-0 flex-col justify-center px-3 sm:px-4">
            <p className={stubLabel}>Closes</p>
            {(h.status === 'open' || h.status === 'closing-soon') && (
              <p className="mt-1 font-display text-[19px] font-bold uppercase leading-none text-ink">{formatDay(h.registrationDeadline)}</p>
            )}
            <p className={cn('mt-0.5 line-clamp-2 text-[11px] leading-tight', h.status === 'closing-soon' ? 'font-semibold text-accent dark:text-board' : 'text-muted')}>
              {whenText(h)}
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'featured') {
    // A wide boarding pass: cover beside the details, the stub across the bottom.
    return (
      <article
        data-hf-impression={h.slug}
        className={cn('ticket ticket-h group relative [--stub:86px] hover:-translate-y-1 motion-reduce:hover:translate-y-0', className)}
      >
        <div className="ticket-paper flex h-full flex-col">
          <div className="grid flex-1 md:grid-cols-[1.1fr_1fr]">
            <div className="relative">
              <EventArt
                title={h.title}
                imageUrl={h.imageUrl}
                size="hero"
                eager={eager}
                className="aspect-[16/9] h-full w-full md:aspect-auto md:min-h-[300px]"
              />
              <div className="absolute left-3 top-3 z-[2] flex gap-1.5">
                <StatusBadge status={h.status} />
              </div>
              {h.featured && <FeaturedStamp className="absolute bottom-4 right-4 z-[2] text-[16px]" />}
            </div>
            <div className="flex min-w-0 flex-col p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <TicketLine h={h} />
                  <div className="mt-1.5">
                    <Organizer h={h} />
                  </div>
                </div>
                <SaveButton slug={h.slug} title={h.title} className="relative z-[2] shrink-0" />
              </div>
              <h3 className="mt-3 font-display text-[28px] font-bold uppercase leading-[0.95] tracking-[-0.005em] sm:text-[34px]">
                <TitleLink h={h} />
              </h3>
              {h.tagline && <p className="mt-2.5 line-clamp-2 text-[15px] leading-6 text-muted">{h.tagline}</p>}
              <div className="mt-4 space-y-2">
                <Where h={h} distanceKm={distanceKm} />
                <p className="flex items-center gap-1.5 text-sm text-ink/75">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
                  {formatDateRange(h.startDate, h.endDate)}
                </p>
              </div>
              <div className="mt-4 pb-4">
                <Tags h={h} max={3} />
              </div>
            </div>
          </div>
          <div className="ticket-stub flex items-center gap-6 px-5 sm:px-6">
            <dl className="grid flex-1 grid-cols-2 gap-6 sm:max-w-md">
              <Prize h={h} big />
              <Deadline h={h} big />
            </dl>
            <Barcode seed={h.slug} className="hidden h-10 text-ink/75 sm:flex" />
            <span className="hidden items-center gap-1 font-display text-[15px] font-bold uppercase tracking-[0.06em] text-ink lg:inline-flex">
              Details
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      data-hf-impression={h.slug}
      className={cn('ticket ticket-h group relative [--stub:72px] hover:-translate-y-1 motion-reduce:hover:translate-y-0', className)}
    >
      <div className="ticket-paper flex h-full flex-col">
        <div className="relative">
          <EventArt title={h.title} imageUrl={h.imageUrl} eager={eager} className="aspect-[16/9] w-full" />
          <div className="absolute left-3 top-3 z-[2] flex gap-1.5">
            <StatusBadge status={h.status} />
          </div>
          <SaveButton slug={h.slug} title={h.title} className="absolute right-3 top-3 z-[2]" />
          {h.featured && <FeaturedStamp className="absolute bottom-3 right-3 z-[2]" />}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
          <TicketLine h={h} />
          <div className="mt-2">
            <Organizer h={h} />
          </div>
          <h3 className="mt-1 line-clamp-2 text-[16px] font-semibold leading-snug">
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
        </div>

        <div className="ticket-stub flex items-center gap-3 px-4">
          <dl className="grid flex-1 grid-cols-2 gap-3">
            <Prize h={h} />
            <Deadline h={h} />
          </dl>
          <Barcode seed={h.slug} bars={14} className="h-9 shrink-0 text-ink/70" />
        </div>
      </div>
    </article>
  );
}

/** Placeholder with the ticket's shape while results load. */
export function HackathonCardSkeleton({ variant = 'standard' }: { variant?: CardVariant }) {
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-4 rounded-lg border border-line bg-card p-3" aria-hidden="true">
        <div className="skeleton h-16 w-24 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line bg-card" aria-hidden="true">
      <div className="skeleton aspect-[16/9] w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <div className="skeleton h-2.5 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton h-3 w-1/2" />
        <div className="flex gap-1.5 pt-1">
          <div className="skeleton h-5 w-14" />
          <div className="skeleton h-5 w-12" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t-2 border-dashed border-ink/10 p-4">
        <div className="skeleton h-9" />
        <div className="skeleton h-9" />
      </div>
    </div>
  );
}
