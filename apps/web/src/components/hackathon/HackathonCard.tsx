import Link from 'next/link';
import { BadgeCheck, CalendarDays, Clock, MapPin, Navigation, QrCode, Sparkles, Trophy, Users } from 'lucide-react';
import { eventTypeLabel, modeLabel, placeName, sourceBySlug, themeName } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { deadlineLabel, formatDateRange, formatKm, formatPrizeShort, formatTeamSize } from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';
import EventArt from './EventArt';
import SaveButton from './SaveButton';
import StatusBadge from './StatusBadge';

interface HackathonCardProps {
  h: HackathonView;
  /** Km from the student, when we know where they are and the event is in person. */
  distanceKm?: number;
  className?: string;
}

export default function HackathonCard({ h, distanceKm, className }: HackathonCardProps) {
  const location = h.mode === 'online' ? 'Online' : `${placeName(h)} · ${modeLabel(h.mode)}`;
  const open = h.status === 'open' || h.status === 'closing-soon';

  return (
    <Link
      href={`/hackathons/${h.slug}`}
      prefetch={false}
      data-hf-impression={h.slug}
      className={cn(
        'group card flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/10',
        className
      )}
    >
      <div className="relative">
        <EventArt title={h.title} imageUrl={h.imageUrl} className="h-44 w-full" />
        <div className="absolute left-3 top-3 flex gap-1.5 z-10">
          <StatusBadge status={h.status} />
          {h.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>
        <SaveButton slug={h.slug} title={h.title} className="absolute right-3 top-3 z-10" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink/60">
            <span className="font-bold uppercase tracking-wider text-accent">{eventTypeLabel(h.type)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{h.organizer}</span>
            {h.verified && <BadgeCheck className="h-3.5 w-3.5 text-accent" aria-label="Verified organizer" />}
            {!h.verified && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold text-ink/60">Unverified</span>}
          </p>
          <h3 className="text-lg font-bold leading-snug text-ink transition-colors group-hover:text-accent">{h.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm text-ink/70 leading-relaxed">{h.tagline}</p>
        </div>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:text-sm text-ink/75 my-1">
          {distanceKm !== undefined ? (
            <li className="col-span-2 flex items-center gap-1.5">
              <Navigation className="h-4 w-4 shrink-0 text-accent" />
              <span className="truncate">
                {location} · <strong className="font-bold text-accent">{formatKm(distanceKm)} away</strong>
              </span>
            </li>
          ) : (
            <li className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate font-medium">{location}</span>
            </li>
          )}
          <li className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{formatDateRange(h.startDate, h.endDate)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate font-bold text-slate-900 dark:text-zinc-100">{formatPrizeShort(h.prizePool, h.prizeCurrency)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{formatTeamSize(h.teamMin, h.teamMax, h.teamSizeKnown !== false)}</span>
          </li>
        </ul>

        <div className="flex flex-wrap gap-1.5">
          {h.themes.slice(0, 2).map((t) => (
            <span key={t} className={cn('rounded-md px-2 py-0.5 text-xs font-medium', themeStyle(t).soft)}>
              {themeName(t)}
            </span>
          ))}
          <span className="rounded-md bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/70">
            {h.fee === 0 ? 'Free' : `₹${h.fee} fee`}
          </span>
          {h.beginnerFriendly && (
            <span className="rounded-md bg-red-50 text-accent border border-red-100 px-2 py-0.5 text-xs font-semibold">
              Beginner-friendly
            </span>
          )}
          {h.registrationVia === 'qr' && (
            <span className="inline-flex items-center gap-1 rounded-md bg-ink/5 px-2 py-0.5 text-xs font-medium text-ink/70">
              <QrCode className="h-3 w-3" />
              Register by QR
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-3 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              h.status === 'closing-soon' ? 'text-brand-600 dark:text-brand-300' : open ? 'text-ink/80' : 'text-ink/60'
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {open ? deadlineLabel(h.daysToDeadline) : h.status === 'in-progress' ? 'Happening now' : 'Closed'}
          </span>
          <span className="text-ink/45">via {sourceBySlug(h.sources[0])?.name ?? 'Submission'}</span>
        </div>
      </div>
    </Link>
  );
}
