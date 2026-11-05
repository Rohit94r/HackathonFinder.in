'use client';

import { Navigation } from 'lucide-react';
import { distanceKm, eventPoint, type Hackathon } from '@hackathonfinder/shared';
import { formatKm } from '@/lib/format';
import { useMyLocation } from '@/lib/useMyLocation';
import { cn } from '@/lib/cn';

interface DistanceTagProps {
  h: Pick<Hackathon, 'mode' | 'city' | 'lat' | 'lng'>;
  /** inline: "· 12 km away" after the city on a ticket. stub: "12 km from you" on the boarding pass. */
  variant?: 'inline' | 'stub';
  /** Shown when there's nothing to measure (online, unknown place, location refused). */
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * How far an in-person event is from the student, using the location saved in this browser.
 * Without one, a one-tap "How far?" asks for it, and every ticket on the page updates at once.
 */
export default function DistanceTag({ h, variant = 'inline', fallback = null, className }: DistanceTagProps) {
  const { location, ready, state, locate } = useMyLocation();
  const point = eventPoint(h);

  // Location lives in the browser, so nothing renders until it has been read.
  if (!point || !ready) return <>{fallback}</>;

  if (location) {
    const km = formatKm(distanceKm(location, point));
    return (
      <span className={cn('whitespace-nowrap font-semibold text-accent dark:text-board', className)}>
        {variant === 'inline' ? `· ${km} away` : `${km} from ${location.via === 'gps' ? 'you' : location.label}`}
      </span>
    );
  }

  if (state === 'denied' || state === 'unavailable') return <>{fallback}</>;

  return (
    <button
      type="button"
      onClick={(e) => {
        // Tickets are links; keep the tap on the button.
        e.preventDefault();
        e.stopPropagation();
        locate();
      }}
      disabled={state === 'locating'}
      className={cn(
        'relative z-[2] -my-2 inline-flex items-center gap-1 whitespace-nowrap py-2 font-semibold text-ink underline decoration-board decoration-2 underline-offset-2 hover:text-accent disabled:no-underline disabled:opacity-70',
        className
      )}
    >
      <Navigation className="h-3 w-3" aria-hidden="true" />
      {state === 'locating' ? 'Locating…' : variant === 'inline' ? 'How far?' : 'How far from me?'}
    </button>
  );
}
