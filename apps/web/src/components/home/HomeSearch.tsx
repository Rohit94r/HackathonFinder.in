'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MapPin, Search } from 'lucide-react';
import { MODES, type Mode } from '@hackathonfinder/shared';
import { parseSmartQuery } from '@/lib/smartSearch';
import { NEAR_ME_FILTERS, toQueryString } from '@/lib/filters';
import { cn } from '@/lib/cn';

export interface CityOption {
  slug: string;
  name: string;
  open: number;
}

const SHORTCUTS = [
  { label: 'AI / ML', theme: 'ai-ml' },
  { label: 'Web3', theme: 'web3' },
  { label: 'FinTech', theme: 'fintech' },
  { label: 'Web development', theme: 'web-dev' },
] as const;

/**
 * The homepage search. The keyword box understands plain English ("free AI hackathon in Pune
 * this month") through the same parser as before; Location and Mode, when picked, override
 * what the text said. Results open on the Explore page with the filters in the URL.
 */
export default function HomeSearch({ cities }: { cities: CityOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [mode, setMode] = useState<Mode | ''>('');
  const [pending, setPending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const { filters } = parseSmartQuery(query.trim());
    if (city) filters.city = city;
    if (mode) filters.modes = [mode];
    setPending(true);
    router.push(
      filters.sort === 'nearest' ? `/near-me${toQueryString(filters, NEAR_ME_FILTERS)}` : `/hackathons${toQueryString(filters)}`
    );
  };

  return (
    <div>
      <form
        role="search"
        aria-label="Search hackathons"
        onSubmit={submit}
        className="rounded-xl border border-line bg-card p-2 shadow-lift"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          <label className="relative flex min-w-0 flex-1 items-center">
            <span className="sr-only">Search hackathons or technologies</span>
            <Search className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hackathons, technologies or organizers"
              className="h-12 w-full rounded-lg bg-transparent pl-11 pr-3 text-[15px] text-ink placeholder:text-muted/80 focus:bg-surface focus:outline-none"
              autoComplete="off"
              enterKeyHint="search"
            />
          </label>

          <div className="hidden w-px self-stretch bg-line lg:block" aria-hidden="true" />

          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch lg:contents">
            <label className="relative col-span-2 flex items-center sm:col-span-1 sm:min-w-[180px] lg:w-48">
              <span className="sr-only">Location</span>
              <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-muted" aria-hidden="true" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 w-full appearance-none rounded-lg border border-line bg-card pl-10 pr-8 text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15 lg:border-transparent lg:hover:bg-surface"
              >
                <option value="">Anywhere</option>
                <option value="online">Online only</option>
                {cities.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                    {c.open ? ` (${c.open})` : ''}
                  </option>
                ))}
              </select>
              <svg className="pointer-events-none absolute right-3 h-4 w-4 text-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </label>

            <fieldset className="col-span-2 sm:col-span-1">
              <legend className="sr-only">Participation mode</legend>
              <div className="flex h-12 rounded-lg border border-line bg-surface p-1">
                {[{ value: '' as const, label: 'Any' }, ...MODES].map((m) => (
                  <label
                    key={m.value || 'any'}
                    className={cn(
                      'flex flex-1 cursor-pointer items-center justify-center rounded-md px-3 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                      mode === m.value ? 'bg-card text-ink shadow-card ring-1 ring-line' : 'text-muted hover:text-ink'
                    )}
                  >
                    <input
                      type="radio"
                      name="home-mode"
                      value={m.value}
                      checked={mode === m.value}
                      onChange={() => setMode(m.value)}
                      className="sr-only"
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <button type="submit" className="btn-primary h-12 px-6 text-[15px] lg:min-w-[120px]" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="h-4 w-4" aria-hidden="true" />}
            {pending ? 'Searching' : 'Search'}
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">Popular:</span>
        {SHORTCUTS.map((s) => (
          <Link key={s.theme} href={`/hackathons?theme=${s.theme}`} className="chip">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
