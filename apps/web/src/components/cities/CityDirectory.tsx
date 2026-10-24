'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Globe2, MapPin, Search, Send, Star } from 'lucide-react';
import { CITIES, distanceKm, type City } from '@hackathonfinder/shared';
import LocationChooser from '@/components/hackathon/LocationChooser';
import { byDeadline, type HackathonView } from '@/lib/hackathons';
import { deadlineLabel } from '@/lib/format';
import { useFollowedCities } from '@/lib/useFollowedCities';
import { useMyLocation } from '@/lib/useMyLocation';
import { cn } from '@/lib/cn';
import { FollowCityButton, MiniEvent, byStart, cityDistanceLabel } from './CityParts';

type SortKey = 'events' | 'nearest' | 'az';

interface CityRow {
  city: City;
  /** Open events, soonest deadline first. */
  events: HackathonView[];
  km?: number;
}

interface CityDirectoryProps {
  /** Open listings. */
  items: HackathonView[];
}

function NextDeadline({ events }: { events: HackathonView[] }) {
  const next = events[0];
  if (!next) return null;
  return (
    <span className={cn('font-semibold', next.status === 'closing-soon' ? 'text-brand-600 dark:text-brand-300' : 'text-ink')}>
      {deadlineLabel(next.daysToDeadline)}
    </span>
  );
}

function CityCard({ row, following, onToggle }: { row: CityRow; following: boolean; onToggle: () => void }) {
  const { city, events, km } = row;
  const n = events.length;
  const upcoming = [...events].sort(byStart).slice(0, 2);
  const href = `/cities/${city.slug}`;

  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug">
            <Link href={href} className="hover:underline">
              {city.name}
            </Link>
          </h3>
          <p className="text-xs text-ink/60">
            {city.state}
            {km !== undefined && (
              <>
                {' · '}
                <strong className="font-semibold text-ink">{cityDistanceLabel(km)}</strong>
              </>
            )}
          </p>
        </div>
        <FollowCityButton name={city.name} following={following} onToggle={onToggle} />
      </div>

      <div className="mt-4 flex items-end gap-3">
        <p className="font-display text-4xl leading-none text-ink">{n}</p>
        <p className="pb-0.5 text-xs leading-5 text-ink/60">
          open {n === 1 ? 'event' : 'events'}
          {n > 0 && (
            <>
              <br />
              Next deadline: <NextDeadline events={events} />
            </>
          )}
        </p>
      </div>

      {upcoming.length > 0 ? (
        <ul className="-mx-1.5 mt-4 space-y-1">
          {upcoming.map((h) => (
            <li key={h.slug}>
              <MiniEvent h={h} showDeadline={false} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink/60">No open events right now. Follow {city.name} to see new ones first.</p>
      )}

      <div className="mt-auto pt-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1 border-t border-ink/10 pt-3 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          {n > 1 ? `See all ${n} in ${city.name}` : `Open the ${city.name} page`}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function OnlineCard({ events }: { events: HackathonView[] }) {
  const n = events.length;
  const upcoming = [...events].sort(byStart).slice(0, 2);
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white">
          <Globe2 className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug">
            <Link href="/hackathons?city=online" className="hover:underline">
              Online
            </Link>
          </h3>
          <p className="text-xs text-ink/60">Join from anywhere in India</p>
        </div>
      </div>
      <div className="mt-4 flex items-end gap-3">
        <p className="font-display text-4xl leading-none text-ink">{n}</p>
        <p className="pb-0.5 text-xs leading-5 text-ink/60">
          open {n === 1 ? 'event' : 'events'}
          {n > 0 && (
            <>
              <br />
              Next deadline: <NextDeadline events={events} />
            </>
          )}
        </p>
      </div>
      {upcoming.length > 0 && (
        <ul className="-mx-1.5 mt-4 space-y-1">
          {upcoming.map((h) => (
            <li key={h.slug}>
              <MiniEvent h={h} showDeadline={false} />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-auto pt-4">
        <Link
          href="/hackathons?city=online"
          className="inline-flex items-center gap-1 border-t border-ink/10 pt-3 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
        >
          See online events
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function ShortlistCard({ row, onToggle }: { row: CityRow; onToggle: () => void }) {
  const { city, events, km } = row;
  const n = events.length;
  return (
    <article className="card flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-snug">
            <Link href={`/cities/${city.slug}`} className="hover:underline">
              {city.name}
            </Link>
          </h3>
          <p className="text-xs text-ink/60">
            {n} open {n === 1 ? 'event' : 'events'}
            {km !== undefined && <> · {cityDistanceLabel(km)}</>}
          </p>
        </div>
        <FollowCityButton name={city.name} following onToggle={onToggle} />
      </div>
      {n > 0 ? (
        <ul className="-mx-1.5 mt-4 space-y-1">
          {events.slice(0, 4).map((h) => (
            <li key={h.slug}>
              <MiniEvent h={h} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink/60">Nothing open in {city.name} right now. New events show up here as soon as they’re listed.</p>
      )}
      {n > 4 && (
        <div className="mt-auto pt-4">
          <Link
            href={`/cities/${city.slug}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            See all {n}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}

export default function CityDirectory({ items }: CityDirectoryProps) {
  const { cities: followed, ready: followReady, toggle, isFollowing } = useFollowedCities();
  const { location, ready: locationReady, state: locateState, locate, pickCity, clear: clearLocation } = useMyLocation();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('events');
  const [grouped, setGrouped] = useState(false);

  const rows = useMemo<CityRow[]>(
    () =>
      CITIES.map((city) => ({
        city,
        events: items.filter((h) => h.city === city.slug).sort(byDeadline),
        km: location ? distanceKm(location, city) : undefined,
      })),
    [items, location]
  );
  const online = useMemo(() => items.filter((h) => h.mode === 'online').sort(byDeadline), [items]);

  // "Nearest" needs a location; without one it quietly falls back to most events.
  const activeSort: SortKey = sort === 'nearest' && !location ? 'events' : sort;
  const query = q.trim().toLowerCase();
  const shown = rows
    .filter(({ city }) => !query || `${city.name} ${city.state}`.toLowerCase().includes(query))
    .sort((a, b) => {
      if (activeSort === 'nearest') return (a.km ?? Infinity) - (b.km ?? Infinity);
      if (activeSort === 'az') return a.city.name.localeCompare(b.city.name);
      return b.events.length - a.events.length || a.city.name.localeCompare(b.city.name);
    });
  const showOnline = !query || 'online anywhere'.includes(query);

  // States follow the city order, so "most events" and "nearest" carry over to the groups.
  const states: string[] = [];
  for (const row of shown) if (!states.includes(row.city.state)) states.push(row.city.state);
  if (activeSort === 'az') states.sort();
  const groups = states.map((state) => ({ state, rows: shown.filter((r) => r.city.state === state) }));

  const shortlist = followed
    .map((slug) => rows.find((r) => r.city.slug === slug))
    .filter((r): r is CityRow => Boolean(r));

  const card = (row: CityRow) => (
    <CityCard key={row.city.slug} row={row} following={followReady && isFollowing(row.city.slug)} onToggle={() => toggle(row.city.slug)} />
  );

  return (
    <div>
      <section aria-labelledby="shortlist-title" className="mb-16">
        <div className="mb-6 max-w-2xl">
          <h2 id="shortlist-title" className="text-4xl sm:text-5xl">
            Your shortlist
          </h2>
          <p className="mt-3 text-base text-ink/70">
            Star the cities you care about. Their open hackathons collect here, soonest deadline first.
          </p>
        </div>

        {!followReady ? (
          <div className="card h-44 animate-pulse" aria-hidden="true" />
        ) : shortlist.length === 0 ? (
          <div className="card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-white">
              <Star className="h-6 w-6 fill-current" />
            </span>
            <div className="flex-1">
              <h3 className="text-base font-bold">No cities yet</h3>
              <p className="mt-1 text-sm text-ink/70">
                Tap the star on any city below, like your college city or home town. We’ll keep their events here for you.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" data-reveal-stagger>
            {shortlist.map((row) => (
              <ShortlistCard key={row.city.slug} row={row} onToggle={() => toggle(row.city.slug)} />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="all-cities-title">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id="all-cities-title" className="text-4xl sm:text-5xl">
            All cities
          </h2>
          <p className="text-sm text-ink/60">
            {CITIES.length} cities · {items.length} open events
          </p>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <label htmlFor="city-search" className="sr-only">
              Search cities
            </label>
            <input
              id="city-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search a city or state"
              className="input pl-11"
            />
          </div>
          <div className="flex gap-3">
            <label htmlFor="city-sort" className="sr-only">
              Sort cities
            </label>
            <select id="city-sort" value={activeSort} onChange={(e) => setSort(e.target.value as SortKey)} className="input flex-1 py-2.5 md:w-auto md:flex-none">
              <option value="events">Most events</option>
              <option value="nearest" disabled={!location}>
                {location ? 'Nearest' : 'Nearest (share location)'}
              </option>
              <option value="az">A–Z</option>
            </select>
            <button
              type="button"
              onClick={() => setGrouped((g) => !g)}
              aria-pressed={grouped}
              className={cn('chip shrink-0 whitespace-nowrap', grouped && 'chip-active')}
            >
              Group by state
            </button>
          </div>
        </div>

        {locationReady && (
          <div className="mb-8">
            {location ? (
              <p className="flex flex-wrap items-center gap-2 text-sm text-ink/70">
                <MapPin className="h-4 w-4 text-ink" />
                Distances from <strong className="text-ink">{location.label}</strong>
                <button type="button" onClick={clearLocation} className="text-xs font-semibold text-ink/70 underline underline-offset-2 hover:text-ink">
                  Change
                </button>
              </p>
            ) : (
              <div className="card flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-bold">
                    <MapPin className="h-5 w-5" />
                    How far is each city?
                  </h3>
                  <p className="mt-1 text-sm text-ink/70">Share your location or pick your city. It stays in this browser, rounded to about 1 km.</p>
                </div>
                <LocationChooser
                  row
                  state={locateState}
                  onLocate={() => {
                    setSort('nearest');
                    locate();
                  }}
                  onPickCity={(slug) => {
                    setSort('nearest');
                    pickCity(slug);
                  }}
                  className="shrink-0"
                />
              </div>
            )}
          </div>
        )}

        {shown.length === 0 && !showOnline ? (
          <div className="card px-6 py-12 text-center">
            <h3 className="text-lg font-bold">No city called “{q.trim()}” yet</h3>
            <p className="mt-2 text-sm text-ink/70">We add cities as their hackathons show up. Share one and we’ll put it on the map.</p>
          </div>
        ) : grouped ? (
          <div className="space-y-10">
            {groups.map((g) => (
              <div key={g.state}>
                <h3 className="mb-4 flex items-baseline gap-2 text-lg font-bold">
                  {g.state}
                  <span className="text-sm font-medium text-ink/50">
                    {g.rows.reduce((sum, r) => sum + r.events.length, 0)} open
                  </span>
                </h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{g.rows.map(card)}</div>
              </div>
            ))}
            {showOnline && (
              <div>
                <h3 className="mb-4 text-lg font-bold">Online</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  <OnlineCard events={online} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" data-reveal-stagger>
            {showOnline && <OnlineCard events={online} />}
            {shown.map(card)}
          </div>
        )}

        <div className="card mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h3 className="text-xl font-bold">Don’t see your city?</h3>
            <p className="mt-1 max-w-xl text-sm text-ink/70">
              We add a city as soon as its hackathons show up. Share one you saw on Instagram, WhatsApp or your college site,
              and we’ll put it on the map.
            </p>
          </div>
          <Link href="/submit" className="btn-primary shrink-0">
            <Send className="h-4 w-4" />
            Share a hackathon
          </Link>
        </div>
      </section>
    </div>
  );
}
