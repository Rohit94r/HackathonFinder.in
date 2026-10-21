'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CITIES, EVENT_TYPES, MODES, THEMES, cityName, eventTypeLabel, modeLabel, themeName } from '@hackathonfinder/shared';
import type { HackathonView } from '@/lib/hackathons';
import {
  DEFAULT_FILTERS,
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

interface ExplorerProps {
  items: HackathonView[];
  initial: Filters;
  /** Filters fixed by the page (e.g. a city page); they stay out of the URL. */
  base?: Filters;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-ink/10 py-5 first:pt-0 last:border-0">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn('chip text-xs', active && 'chip-active')}>
      {children}
    </button>
  );
}

export default function Explorer({ items, initial, base = DEFAULT_FILTERS }: ExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<Filters>(initial);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    router.replace(`${pathname}${toQueryString(filters, base)}`, { scroll: false });
  }, [filters, base, pathname, router]);

  const results = useMemo(() => applyFilters(items, filters), [items, filters]);
  const count = activeFilterCount(filters, base);
  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ ...base, q: '' });

  const activeChips: { label: string; clear: () => void }[] = [
    ...(filters.city !== base.city
      ? [{ label: filters.city === 'online' ? 'Online' : cityName(filters.city), clear: () => set({ city: base.city }) }]
      : []),
    ...filters.modes.map((m) => ({ label: modeLabel(m), clear: () => set({ modes: filters.modes.filter((x) => x !== m) }) })),
    ...filters.types.map((t) => ({ label: eventTypeLabel(t), clear: () => set({ types: filters.types.filter((x) => x !== t) }) })),
    ...filters.themes
      .filter((t) => !base.themes.includes(t))
      .map((t) => ({ label: themeName(t), clear: () => set({ themes: filters.themes.filter((x) => x !== t) }) })),
    ...(filters.fee !== base.fee ? [{ label: filters.fee === 'free' ? 'Free' : 'Paid', clear: () => set({ fee: base.fee }) }] : []),
    ...(filters.team !== base.team ? [{ label: filters.team === 'solo' ? 'Solo' : 'Teams', clear: () => set({ team: base.team }) }] : []),
    ...(filters.beginner !== base.beginner ? [{ label: 'Beginner-friendly', clear: () => set({ beginner: base.beginner }) }] : []),
    ...(filters.within !== base.within
      ? [{ label: filters.within === 'week' ? 'Deadline this week' : 'Deadline this month', clear: () => set({ within: base.within }) }]
      : []),
    ...(filters.minPrize !== base.minPrize
      ? [{ label: PRIZE_OPTIONS.find((p) => p.value === filters.minPrize)?.label ?? '', clear: () => set({ minPrize: base.minPrize }) }]
      : []),
    ...(filters.eligibility !== base.eligibility
      ? [{ label: filters.eligibility.replace('-', ' '), clear: () => set({ eligibility: base.eligibility }) }]
      : []),
  ];

  const panel = (
    <div>
      <FilterGroup title="Status">
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.status === o.value} onClick={() => set({ status: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Where">
        <label htmlFor="filter-city" className="sr-only">
          City
        </label>
        <select
          id="filter-city"
          value={filters.city}
          onChange={(e) => set({ city: e.target.value })}
          className="input mb-3 py-2.5"
        >
          <option value="">Anywhere</option>
          <option value="online">Online only</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Pill key={m.value} active={filters.modes.includes(m.value)} onClick={() => set({ modes: toggle(filters.modes, m.value) })}>
              {m.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Deadline">
        <div className="flex flex-wrap gap-2">
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

      <FilterGroup title="Theme">
        <div className="flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <Pill key={t.slug} active={filters.themes.includes(t.slug)} onClick={() => set({ themes: toggle(filters.themes, t.slug) })}>
              {t.name}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Event type">
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <Pill key={t.value} active={filters.types.includes(t.value)} onClick={() => set({ types: toggle(filters.types, t.value) })}>
              {t.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Team">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'any' as const, label: 'Any' },
            { value: 'solo' as const, label: 'Solo allowed' },
            { value: 'team' as const, label: 'Teams' },
          ].map((o) => (
            <Pill key={o.value} active={filters.team === o.value} onClick={() => set({ team: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Who can join">
        <div className="flex flex-wrap gap-2">
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
        <label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-ink/15 px-3 py-2.5 text-sm font-medium text-ink/80">
          Beginner-friendly only
          <input
            type="checkbox"
            checked={filters.beginner}
            onChange={(e) => set({ beginner: e.target.checked })}
            className="h-4 w-4 accent-black"
          />
        </label>
      </FilterGroup>

      <FilterGroup title="Fee & prize">
        <div className="mb-3 flex flex-wrap gap-2">
          {[
            { value: 'any' as const, label: 'Any fee' },
            { value: 'free' as const, label: 'Free' },
            { value: 'paid' as const, label: 'Paid' },
          ].map((o) => (
            <Pill key={o.value} active={filters.fee === o.value} onClick={() => set({ fee: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRIZE_OPTIONS.map((o) => (
            <Pill key={o.value} active={filters.minPrize === o.value} onClick={() => set({ minPrize: o.value })}>
              {o.label}
            </Pill>
          ))}
        </div>
      </FilterGroup>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Desktop filters */}
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-sans text-sm font-semibold text-ink">Filters</h2>
            {count > 0 && (
              <button type="button" onClick={reset} className="text-xs font-semibold text-ink hover:underline">
                Clear all
              </button>
            )}
          </div>
          {panel}
        </div>
      </aside>

      <div className="min-w-0">
        {/* Search + sort */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <label htmlFor="explore-search" className="sr-only">
              Search hackathons
            </label>
            <input
              id="explore-search"
              type="search"
              value={filters.q}
              onChange={(e) => set({ q: e.target.value })}
              placeholder="Search by name, organizer, theme or city"
              className="input pl-11"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="btn-secondary lg:hidden"
              aria-expanded={panelOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {count > 0 && (
                <span className="rounded-full bg-ink px-1.5 text-xs font-bold text-white">{count}</span>
              )}
            </button>
            <label htmlFor="explore-sort" className="sr-only">
              Sort by
            </label>
            <select
              id="explore-sort"
              value={filters.sort}
              onChange={(e) => set({ sort: e.target.value as Filters['sort'] })}
              className="input w-auto py-2.5"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Result count + active chips */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-ink/70" aria-live="polite">
            <strong className="text-ink">{results.length}</strong> {results.length === 1 ? 'event' : 'events'} found
          </p>
          {activeChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={chip.clear}
              className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold capitalize text-ink hover:bg-ink/10"
            >
              {chip.label}
              <X className="h-3 w-3" />
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
        </div>

        {results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((h) => (
              <HackathonCard key={h.slug} h={h} />
            ))}
          </div>
        ) : (
          <div className="card flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 rounded-2xl bg-ink/5 p-4 text-ink">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold">No hackathons match yet</h3>
            <p className="mt-2 max-w-md text-sm text-ink/70">
              Try removing a filter or two, or switch the status to &ldquo;All events&rdquo;. New
              hackathons are added all the time.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={reset} className="btn-primary">
                Clear filters
              </button>
              <button type="button" onClick={() => set({ status: 'all' })} className="btn-secondary">
                Show all events
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {panelOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50"
            onClick={() => setPanelOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-sans text-base font-semibold">Filters</h2>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters" className="rounded-lg p-1.5 hover:bg-ink/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{panel}</div>
            <div className="flex gap-3 border-t border-ink/10 p-4">
              <button type="button" onClick={reset} className="btn-secondary flex-1">
                Clear
              </button>
              <button type="button" onClick={() => setPanelOpen(false)} className="btn-primary flex-1">
                Show {results.length} {results.length === 1 ? 'event' : 'events'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
