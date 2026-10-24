'use client';

import type { TrafficSummary } from './types';
import { Delta, duration, num, pct, Stat } from './ui';

type Key = keyof TrafficSummary;

const TILES: { key: Key; label: string; hint: string; format?: (v: number | null) => string; lowerIsBetter?: boolean }[] = [
  { key: 'visitors', label: 'Visitors', hint: 'Different people (browsers) who opened a page' },
  { key: 'sessions', label: 'Sessions', hint: 'Visits; a visit ends after 30 minutes without a page view' },
  { key: 'pageViews', label: 'Page views', hint: 'Pages opened on the public site' },
  { key: 'avgTimeMs', label: 'Avg. time on page', hint: 'Time a page was on screen, averaged', format: duration },
  { key: 'bounceRate', label: 'Bounce rate', hint: 'Visits that saw only one page', format: (v) => pct(v), lowerIsBetter: true },
  { key: 'impressions', label: 'Hackathon impressions', hint: 'Hackathon cards seen on screen for at least a second' },
  { key: 'hackathonViews', label: 'Hackathon page views', hint: 'Opens of a hackathon’s own page' },
  { key: 'registerClicks', label: 'Register clicks', hint: 'Clicks on “Register on official site”' },
  { key: 'signups', label: 'Sign-ups', hint: 'New accounts (not sample students)' },
  { key: 'activeUsers', label: 'Active users', hint: 'Signed-in students who opened at least one page' },
];

/** The headline numbers for a period, each compared with the period before it. */
export default function TrafficTiles({ current, previous, compare, extra = false }: { current: TrafficSummary; previous: TrafficSummary; compare: string; extra?: boolean }) {
  const tiles = extra
    ? [...TILES, { key: 'logins' as Key, label: 'Sign-ins', hint: 'Times anyone signed in' }, { key: 'clicks' as Key, label: 'Tracked clicks', hint: 'Clicks on elements marked data-hf-click' }]
    : TILES;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => {
        const value = current[t.key];
        const before = previous[t.key];
        return (
          <Stat
            key={t.key}
            label={t.label}
            hint={t.hint}
            value={t.format ? t.format(value) : num(value)}
            sub={typeof value === 'number' && typeof before === 'number' && t.key !== 'bounceRate' && t.key !== 'avgTimeMs' ? <Delta current={value} previous={before} label={compare} /> : <span className="text-xs text-neutral-500">{t.format && before !== null ? `was ${t.format(before)} ${compare}` : ''}</span>}
          />
        );
      })}
    </div>
  );
}
