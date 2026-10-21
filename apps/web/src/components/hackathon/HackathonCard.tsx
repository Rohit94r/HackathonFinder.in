import Link from 'next/link';
import { BadgeCheck, CalendarDays, Clock, MapPin, Sparkles, Trophy, Users } from 'lucide-react';
import { cityName, eventTypeLabel, modeLabel, sourceBySlug, themeName } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { deadlineLabel, formatDateRange, formatPrizeShort, formatTeamSize } from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';
import EventArt from './EventArt';
import SaveButton from './SaveButton';
import StatusBadge from './StatusBadge';

export default function HackathonCard({ h, className }: { h: HackathonView; className?: string }) {
  const location = h.mode === 'online' ? 'Online' : `${cityName(h.city)} · ${modeLabel(h.mode)}`;
  const open = h.status === 'open' || h.status === 'closing-soon';

  return (
    <Link
      href={`/hackathons/${h.slug}`}
      className={cn(
        'group card flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lift',
        className
      )}
    >
      <div className="relative">
        <EventArt theme={h.themes[0]} title={h.title} className="h-32" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <StatusBadge status={h.status} />
          {h.featured && (
            <span className="inline-flex items-center gap-1 rounded-full bg-lime px-2.5 py-1 text-xs font-bold text-ink">
              <Sparkles className="h-3 w-3" />
              Featured
            </span>
          )}
        </div>
        <SaveButton slug={h.slug} title={h.title} className="absolute right-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="mb-1 flex items-center gap-1 text-xs font-medium text-ink/60">
            <span className="font-semibold uppercase tracking-wider text-ink">{eventTypeLabel(h.type)}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{h.organizer}</span>
            {h.verified && <BadgeCheck className="h-3.5 w-3.5 text-ink" aria-label="Verified organizer" />}
          </p>
          <h3 className="text-lg font-bold leading-snug text-ink group-hover:underline">{h.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-ink/70">{h.tagline}</p>
        </div>

        <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-ink/70">
          <li className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-ink/45" />
            <span className="truncate">{location}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-ink/45" />
            {formatDateRange(h.startDate, h.endDate)}
          </li>
          <li className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 shrink-0 text-ink/45" />
            <span className="truncate">{formatPrizeShort(h.prizePool, h.prizeCurrency)}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-ink/45" />
            <span className="truncate">{formatTeamSize(h.teamMin, h.teamMax)}</span>
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
            <span className="rounded-md bg-lime-soft px-2 py-0.5 text-xs font-medium text-ink">
              Beginner-friendly
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-ink/10 pt-3 text-xs">
          <span
            className={cn(
              'inline-flex items-center gap-1 font-semibold',
              h.status === 'closing-soon' ? 'text-ink' : open ? 'text-ink/80' : 'text-ink/60'
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
