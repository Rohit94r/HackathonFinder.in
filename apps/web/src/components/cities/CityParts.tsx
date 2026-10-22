import Link from 'next/link';
import { Star } from 'lucide-react';
import { modeLabel } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { deadlineLabel, formatDateRange, formatKm } from '@/lib/format';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

/** City centres are the only points we have, so anything close is "your city". */
export function cityDistanceLabel(km: number): string {
  return km < 20 ? 'Your city' : `${formatKm(km)} away`;
}

export function byStart(a: HackathonView, b: HackathonView): number {
  return Date.parse(a.startDate) - Date.parse(b.startDate);
}

interface FollowButtonProps {
  name: string;
  following: boolean;
  onToggle: () => void;
  /** `icon` for cards, `full` for the city page. */
  variant?: 'icon' | 'full';
  className?: string;
}

export function FollowCityButton({ name, following, onToggle, variant = 'icon', className }: FollowButtonProps) {
  if (variant === 'full') {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={following}
        className={cn(
          following ? 'btn-lime' : 'btn-secondary',
          'px-4 py-2 text-sm',
          className
        )}
      >
        <Star className={cn('h-4 w-4', following && 'fill-current')} />
        {following ? `Following ${name}` : `Follow ${name}`}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={following}
      aria-label={`Follow ${name}`}
      title={following ? `Unfollow ${name}` : `Follow ${name}`}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition',
        following
          ? 'border-pop bg-pop text-navy hover:bg-[#ff9d52]'
          : 'border-ink/20 text-ink/60 hover:border-pop hover:text-pop',
        className
      )}
    >
      <Star className={cn('h-4 w-4', following && 'fill-current')} />
    </button>
  );
}

/** A small cover tile in the event's theme colours, matching the card art. */
export function MiniCover({ h, className }: { h: HackathonView; className?: string }) {
  const { icon: Icon, gradient } = themeStyle(h.themes[0]);
  return (
    <span
      className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white', gradient, className)}
      aria-hidden="true"
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

/** One line per event: cover, title, dates and deadline. */
export function MiniEvent({ h, showDeadline = true }: { h: HackathonView; showDeadline?: boolean }) {
  return (
    <Link href={`/hackathons/${h.slug}`} className="group flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-ink/5">
      <MiniCover h={h} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink group-hover:underline">{h.title}</span>
        <span className="block truncate text-xs text-ink/60">
          {formatDateRange(h.startDate, h.endDate)} · {modeLabel(h.mode)}
        </span>
      </span>
      {showDeadline && (
        <span
          className={cn(
            'shrink-0 text-right text-[11px] font-semibold',
            h.status === 'closing-soon' ? 'text-orange-600 dark:text-orange-300' : 'text-ink/60'
          )}
        >
          {deadlineLabel(h.daysToDeadline)}
        </span>
      )}
    </Link>
  );
}
