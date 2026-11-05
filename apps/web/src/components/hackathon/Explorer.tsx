'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe2, MapPin, Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import {
  CITIES,
  EVENT_TYPES,
  MODES,
  THEMES,
  cityName,
  distanceFrom,
  eligibilityLabel,
  eventTypeLabel,
  modeLabel,
  themeName,
} from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import { useMyLocation } from '@/lib/useMyLocation';
import {
  DEFAULT_FILTERS,
  DISTANCE_OPTIONS,
  PRIZE_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  activeFilterCount,
  applyFilters,
  toQueryString,
  type Filters,
} from '@/lib/filters';
import { cn } from '@/lib/cn';
import HackathonCard from './HackathonCard';
import LocationChooser from './LocationChooser';

interface ExplorerProps {
  items: HackathonView[];
  initial: Filters;
  /** Filters fixed by the page (e.g. a city page); they stay out of the URL. */
  base?: Filters;
  /** Ask for the student's location on arrival if we don't have it yet. */
  autoLocate?: boolean;
}

/** Cards per group before "Show more". */
const PAGE = 24;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border-b border-line py-4 first:pt-0 last:border-0 last:pb-0">
      <legend className="float-left mb-2.5 w-full text-[13px] font-semibold text-ink">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('chip min-h-[30px] px-2.5 py-1 text-[13px]', active && 'chip-active')}
    >
      {children}
    </button>
  );
}

export default function Explorer({ items, initial, base = DEFAULT_FILTERS, autoLocate = false }: ExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(initial);
  const [panelOpen, setPanelOpen] = useState(false);
  const { location, ready, state: locateState, locate, pickCity, clear: clearLocation } = useMyLocation();
  const asked = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    router.replace(`${pathname}${toQueryString(filters, base)}`, { scroll: false });
  }, [filters, base, pathname, router]);

  useEffect(() => {
    if (!autoLocate || !ready || location || asked.current) return;
    asked.current = true;
    locate();
  }, [autoLocate, ready, location, locate]);

  // "/" jumps to the search box, as on most search-first sites.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Mobile drawer: lock the page behind it, close on Escape, and return focus to the button.
  useEffect(() => {
    if (!panelOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    drawerCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanelOpen(false);
    window.addEventListener('keydown', onKey);
    const opener = filtersButtonRef.current;
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
      opener?.focus();
    };
  }, [panelOpen]);

  const results = useMemo(() => applyFilters(items, filters, location), [items, filters, location]);
  const distances = useMemo(
    () => new Map<string, number | undefined>(location ? items.map((h) => [h.slug, distanceFrom(h, location)]) : []),
    [items, location]
  );
  // Our catalog cities, plus any other city a listed event is in (Bhopal, Ludhiana, …), A to Z.
  const cityOptions = useMemo(() => {
    const options = new Map(CITIES.map((c) => [c.slug, c.name]));
    for (const h of items) if (h.city && !options.has(h.city)) options.set(h.city, cityName(h.city, h.cityName));
    return [...options].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  const count = activeFilterCount(filters, base);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ ...base, q: '' });
  // Sharing a location means "show me what's close", so sort by distance too.
  const locateNearest = () => {
    set({ sort: 'nearest' });
    locate();
  };
  const pickCityNearest = (slug: string) => {
    set({ sort: 'nearest' });
    pickCity(slug);
  };

  const needsLocation = ready && !location && (filters.sort === 'nearest' || filters.km > 0);
  const byDistance = Boolean(location) && filters.sort === 'nearest';
  // Nearest first: in-person and hybrid events by distance (any without a known place last), then online ones.
  const inPerson = byDistance ? results.filter((h) => h.mode !== 'online') : results;
  const online = byDistance ? results.filter((h) => h.mode === 'online') : [];

  // A page of cards per group, so a long list doesn't load hundreds of banners at once.
  const [shown, setShown] = useState({ inPerson: PAGE, online: PAGE });
  useEffect(() => setShown({ inPerson: PAGE, online: PAGE }), [filters, location]);

  const grid = (list: HackathonView[], group: keyof typeof shown) => {
    const visible = Math.min(shown[group], list.length);
    return (
      <>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.slice(0, visible).map((h, i) => (
            <HackathonCard key={h.slug} h={h} distanceKm={distances.get(h.slug)} eager={i < 3} />
          ))}
        </div>
        {list.length > PAGE && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-sm text-muted">
              Showing <span className="font-medium tabular-nums text-ink">{visible}</span> of{' '}
              <span className="tabular-nums">{list.length}</span>
            </p>
            <div className="h-1 w-48 overflow-hidden rounded-full bg-ink/[0.06]" aria-hidden="true">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(visible / list.length) * 100}%` }} />
            </div>
            {list.length > visible && (
              <button type="button" onClick={() => setShown((s) => ({ ...s, [group]: s[group] + PAGE }))} className="btn-secondary mt-1">
                Show {Math.min(PAGE, list.length - visible)} more
              </button>
            )}
          </div>
        )}
      </>
    );
  };

  const activeChips: { label: string; clear: () => void }[] = [
    ...(filters.km !== base.km ? [{ label: `Within ${filters.km} km`, clear: () => set({ km: base.km }) }] : []),
    ...(filters.status !== base.status
      ? [{ label: STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? '', clear: () => set({ status: base.status }) }]
      : []),
    ...(filters.city !== base.city
      ? [
          {
            label: filters.city === 'online' ? 'Online' : (cityOptions.find((c) => c.slug === filters.city)?.name ?? cityName(filters.city)),
            clear: () => set({ city: base.city }),
          },
        ]
      : []),
    ...filters.modes.map((m) => ({ label: modeLabel(m), clear: () => set({ modes: filters.modes.filter((x) => x !== m) }) })),
    ...filters.types.map((t) => ({ label: eventTypeLabel(t), clear: () => set({ types: filters.types.filter((x) => x !== t) }) })),
    ...filters.themes
      .filter((t) => !base.themes.includes(t))
      .map((t) => ({ label: themeName(t), clear: () => set({ themes: filters.themes.filter((x) => x !== t) }) })),
    ...(filters.fee !== base.fee ? [{ label: filters.fee === 'free' ? 'Free' : 'Paid', clear: () => set({ fee: base.fee }) }] : []),
    ...(filters.team !== base.team ? [{ label: filters.team === 'solo' ? 'Solo allowed' : 'Teams', clear: () => set({ team: base.team }) }] : []),
    ...(filters.beginner !== base.beginner ? [{ label: 'Beginner-friendly', clear: () => set({ beginner: base.beginner }) }] : []),
    ...(filters.within !== base.within
      ? [{ label: filters.within === 'week' ? 'Deadline this week' : 'Deadline this month', clear: () => set({ within: base.within }) }]
      : []),
    ...(filters.minPrize !== base.minPrize
      ? [{ label: PRIZE_OPTIONS.find((p) => p.value === filters.minPrize)?.label ?? '', clear: () => set({ minPrize: base.minPrize }) }]
      : []),
    ...(filters.eligibility !== base.eligibility
      ? [
          {
            label: filters.eligibility ? eligibilityLabel(filters.eligibility) : 'Anyone',
            clear: () => set({ eligibility: base.eligibility }),
          },
        ]
      : []),
  ];

  const panel = (
    <div>
      <FilterGroup title="Near you">
        {location ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 font-medium leading-snug text-ink">
                <MapPin className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
                <span className="truncate">{location.label}</span>
              </span>
              <button type="button" onClick={clearLocation} className="shrink-0 text-xs font-medium text-accent hover:underline">
                Change
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DISTANCE_OPTIONS.map((o) => (
                <Pill key={o.value} active={filters.km === o.value} onClick={() => set({ km: o.value })}>
                  {o.value ? `Within ${o.label}` : o.label}
                </Pill>
              ))}
            </div>
          </>
        ) : (
          <LocationChooser state={locateState} onLocate={locateNearest} onPickCity={pickCityNearest} />
        )}
      </FilterGroup>

      <FilterGroup title="Registration status">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.status === o.value} onClick={() => set({ status: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Location & mode">
        <label htmlFor="filter-city" className="sr-only">
          City
        </label>
        <select id="filter-city" value={filters.city} onChange={(e) => set({ city: e.target.value })} className="input mb-2.5">
          <option value="">Anywhere</option>
          <option value="online">Online only</option>
          {cityOptions.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <Pill key={m.value} active={filters.modes.includes(m.value)} onClick={() => set({ modes: toggle(filters.modes, m.value) })}>
              {m.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Registration deadline">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '' as const, label: 'Any time' },
            { value: 'week' as const, label: 'This week' },
            { value: 'month' as const, label: 'This month' },
          ].map((o) => (
            <Pill key={o.value || 'any'} active={filters.within === o.value} onClick={() => set({ within: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Technology & theme">
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => (
            <Pill key={t.slug} active={filters.themes.includes(t.slug)} onClick={() => set({ themes: toggle(filters.themes, t.slug) })}>
              {t.name}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Prize pool">
        <div className="flex flex-wrap gap-1.5">
          {PRIZE_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.minPrize === o.value} onClick={() => set({ minPrize: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Team size">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'any' as const, label: 'Any' },
            { value: 'solo' as const, label: 'Individual (solo allowed)' },
            { value: 'team' as const, label: 'Team' },
          ].map((o) => (
            <Pill key={o.value} active={filters.team === o.value} onClick={() => set({ team: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Eligibility">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '' as const, label: 'Anyone' },
            { value: 'students' as const, label: 'Students' },
            { value: 'professionals' as const, label: 'Professionals' },
            { value: 'women-only' as const, label: 'Women-only' },
          ].map((o) => (
            <Pill key={o.value || 'any'} active={filters.eligibility === o.value} onClick={() => set({ eligibility: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
        <label className="mt-3 flex min-h-[40px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm text-ink/85 hover:border-ink/20">
          Beginner-friendly only
          <input
            type="checkbox"
            checked={filters.beginner}
            onChange={(e) => set({ beginner: e.target.checked })}
            className="h-4 w-4 rounded accent-brand-600"
          />
        </label>
      </FilterGroup>

      <FilterGroup title="Event type">
        <div className="flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => (
            <Pill key={t.value} active={filters.types.includes(t.value)} onClick={() => set({ types: toggle(filters.types, t.value) })}>
              {t.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Entry fee">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: 'any' as const, label: 'Any' },
            { value: 'free' as const, label: 'Free' },
            { value: 'paid' as const, label: 'Paid' },
          ].map((o) => (
            <Pill key={o.value} active={filters.fee === o.value} onClick={() => set({ fee: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[272px_minmax(0,1fr)]">
      {/* Desktop filters */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-card p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Filters</h2>
            {count > 0 && (
              <button type="button" onClick={reset} className="text-xs font-medium text-accent hover:underline">
                Clear all ({count})
              </button>
            )}
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        {/* Search + sort */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <label htmlFor="explore-search" className="sr-only">
              Search hackathons
            </label>
            <input
              ref={searchRef}
              id="explore-search"
              type="search"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search by name, technology, organizer or city"
              className="input h-11 pl-10 pr-16 [&::-webkit-search-cancel-button]:hidden"
              autoComplete="off"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() => {
                  set({ q: '' });
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px] text-muted sm:block">
                /
              </kbd>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              ref={filtersButtonRef}
              type="button"
              onClick={() => setPanelOpen(true)}
              className="btn-secondary h-11 flex-1 lg:hidden"
              aria-expanded={panelOpen}
              aria-controls="filter-drawer"
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
              {count > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-xs font-semibold tabular-nums text-white">{count}</span>
              )}
            </button>
            <label htmlFor="explore-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="explore-sort"
              value={filters.sort}
              onChange={(e) => set({ sort: e.target.value as Filters['sort'] })}
              className="input h-11 w-auto flex-1 sm:flex-none"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  Sort: {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result count + active chips */}
        <div className="mt-4 flex min-h-[32px] flex-wrap items-center gap-2">
          <p className="mr-1 text-sm text-muted" aria-live="polite">
            <strong className="font-semibold tabular-nums text-ink">{results.length}</strong> {results.length === 1 ? 'hackathon' : 'hackathons'}
            {byDistance && location && <> · nearest to {location.via === 'gps' ? 'you' : location.label} first</>}
          </p>
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-card py-1 pl-2.5 pr-1.5 text-xs font-medium text-ink transition-colors hover:border-ink/25"
            >
              {chip.label}
              <X className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
          {activeChips.length > 1 && (
            <button type="button" onClick={reset} className="text-xs font-medium text-accent hover:underline">
              Clear all
            </button>
          )}
        </div>

        {needsLocation && (
          <div className="mt-4 flex flex-col gap-4 rounded-xl border border-line bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base">
                <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
                See the hackathons closest to you
              </h2>
              <p className="mt-1 text-sm text-muted">Share your location or pick your city. It stays in this browser, rounded to about 1 km.</p>
            </div>
            <LocationChooser row state={locateState} onLocate={locate} onPickCity={pickCity} className="shrink-0" />
          </div>
        )}

        <div className="mt-5">
          {results.length > 0 ? (
            <>
              {inPerson.length > 0 && grid(inPerson, 'inPerson')}
              {online.length > 0 && (
                <>
                  <h2 className={cn('mb-4 flex items-center gap-2 text-lg', inPerson.length > 0 && 'mt-12')}>
                    <Globe2 className="h-5 w-5 text-muted" aria-hidden="true" />
                    Online: join from anywhere
                  </h2>
                  {grid(online, 'online')}
                </>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-line bg-card px-6 py-16 text-center">
              <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink/[0.05] text-muted">
                <SearchX className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="text-lg">No hackathons match these filters</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                {filters.q ? <>Nothing matches &ldquo;{filters.q}&rdquo; with the current filters. </> : null}
                Try removing a filter, or include events that have already closed. New hackathons are added twice a day.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <button type="button" onClick={reset} className="btn-primary">
                  Clear all filters
                </button>
                {filters.status !== 'all' && (
                  <button type="button" onClick={() => set({ status: 'all' })} className="btn-secondary">
                    Include closed events
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {panelOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="filter-drawer-title">
          <button
            type="button"
            tabIndex={-1}
            className="hf-fade-in absolute inset-0 bg-navy/40"
            onClick={() => setPanelOpen(false)}
            aria-label="Close filters"
          />
          <div id="filter-drawer" className="hf-drawer-in absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-card shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 id="filter-drawer-title" className="text-base">
                Filters{count > 0 && <span className="ml-1.5 text-muted">({count})</span>}
              </h2>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setPanelOpen(false)}
                aria-label="Close filters"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-ink/5 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain p-5">{panel}</div>
            <div className="flex gap-2.5 border-t border-line p-4">
              <button type="button" onClick={reset} className="btn-secondary flex-1" disabled={count === 0}>
                Clear all
              </button>
              <button type="button" onClick={() => setPanelOpen(false)} className="btn-primary flex-[2]">
                Show {results.length} {results.length === 1 ? 'result' : 'results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
