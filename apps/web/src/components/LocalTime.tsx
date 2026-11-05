'use client';

import { useEffect, useState } from 'react';
import { localZone } from '@/lib/clock';

// The listings' home zone, used for the server render so the HTML and the first browser render match.
const HOME_ZONE = 'Asia/Kolkata';

/**
 * A date and time in the visitor's own time zone, with the zone named: "Fri, 6 Nov, 12:00 AM GMT+5:30"
 * in Pune, "Thu, 5 Nov, 1:30 PM EST" in New York. Renders in the listings' home zone until mounted.
 */
export default function LocalTime({ iso, year = false, className }: { iso: string; year?: boolean; className?: string }) {
  const [zone, setZone] = useState(HOME_ZONE);
  useEffect(() => setZone(localZone()), []);

  const text = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(year && { year: 'numeric' }),
    hour: 'numeric',
    minute: '2-digit',
    timeZone: zone,
    timeZoneName: 'short',
  }).format(new Date(iso));

  return (
    <time dateTime={iso} className={className}>
      {text}
    </time>
  );
}
