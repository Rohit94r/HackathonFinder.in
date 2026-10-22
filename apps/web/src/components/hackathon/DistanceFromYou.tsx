'use client';

import Link from 'next/link';
import { distanceKm, type LatLng } from '@hackathonfinder/shared';
import { formatKm } from '@/lib/format';
import { useMyLocation } from '@/lib/useMyLocation';

/** "12 km from you", or a button that asks for the student's location. */
export default function DistanceFromYou({ point }: { point: LatLng }) {
  const { location, ready, state, locate } = useMyLocation();

  // Location lives in the browser, so render nothing until we've read it.
  if (!ready) return null;

  if (location) {
    const from = location.via === 'gps' ? 'you' : `${location.label} centre`;
    return (
      <p className="mt-1 text-sm text-ink/70">
        <strong className="text-ink">{formatKm(distanceKm(location, point))}</strong> from {from}
      </p>
    );
  }

  if (state === 'denied' || state === 'unavailable') {
    return (
      <p className="mt-1 text-sm text-ink/60">
        <Link href="/near-me" className="font-semibold text-ink underline underline-offset-2">
          Pick your city
        </Link>{' '}
        to see how far it is.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={locate}
      disabled={state === 'locating'}
      className="mt-1 text-sm font-semibold text-ink underline underline-offset-2 hover:no-underline"
    >
      {state === 'locating' ? 'Finding you…' : 'How far is it from me?'}
    </button>
  );
}
