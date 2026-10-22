'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { BadgeCheck, ExternalLink, Loader2, Pencil, RotateCcw, Star, Trash2 } from 'lucide-react';
import { CITIES, cityName, SOURCES, sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Ago, EmptyState, ErrorNote, Pager, Pill, SearchBox, StatePill, Tabs } from './parts';
import type { ListingRow } from './ReviewQueue';

type State = 'all' | 'live' | 'pending' | 'rejected' | 'removed';

interface Page {
  items: ListingRow[];
  total: number;
  page: number;
  pages: number;
}

function Toggle({ on, label, icon: Icon, busy, onClick }: { on: boolean; label: string; icon: typeof Star; busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={busy}
      onClick={onClick}
      title={on ? `Turn off ${label.toLowerCase()}` : `Mark as ${label.toLowerCase()}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition disabled:opacity-60',
        on ? 'border-accent bg-accent text-white' : 'border-ink/15 text-ink/70 hover:border-ink/40 hover:text-ink'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/** Every listing in any state: search, filter, quick toggles, remove and restore. */
export default function ListingsTable({ initialState = 'all', initialQuery = '' }: { initialState?: State; initialQuery?: string }) {
  const [state, setState] = useState<State>(initialState);
  const [q, setQ] = useState(initialQuery);
  const [source, setSource] = useState('');
  const [city, setCity] = useState('');
  const [featured, setFeatured] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');

  const params = new URLSearchParams({ state, q, source, city, page: String(page), ...(featured ? { featured: '1' } : {}) });
  const { data, error, mutate } = useSWR<Page>(`/api/admin/listings?${params}`, { keepPreviousData: true });
  const reset = <T,>(set: Dispatch<SetStateAction<T>>) => (v: T) => {
    set(v);
    setPage(1);
  };

  const patch = async (row: ListingRow, body: Record<string, unknown>, what: string) => {
    setBusy(`${row.id}:${what}`);
    setProblem('');
    try {
      const res = await apiFetch<{ listing: ListingRow }>(`/api/admin/listings/${row.id}`, { method: 'PATCH', body });
      mutate((d) => (d ? { ...d, items: d.items.map((i) => (i.id === row.id ? res.listing : i)) } : d), { revalidate: false });
    } catch (err) {
      setProblem(err instanceof ApiClientError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <Tabs
          value={state}
          onChange={reset(setState)}
          options={[
            { value: 'all', label: 'All' },
            { value: 'live', label: 'Live' },
            { value: 'pending', label: 'Pending' },
            { value: 'removed', label: 'Removed' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchBox value={q} onChange={reset(setQ)} placeholder="Search title, organizer, slug or link" />
          <select aria-label="Source" className="input sm:w-48" value={source} onChange={(e) => reset(setSource)(e.target.value)}>
            <option value="">Every source</option>
            {SOURCES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
          <select aria-label="City" className="input sm:w-44" value={city} onChange={(e) => reset(setCity)(e.target.value)}>
            <option value="">Every city</option>
            <option value="online">Online</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input type="checkbox" checked={featured} onChange={(e) => reset(setFeatured)(e.target.checked)} className="h-4 w-4 accent-brand-600" />
            Featured only
          </label>
        </div>
      </div>

      {problem && <ErrorNote>{problem}</ErrorNote>}
      {error && <ErrorNote>{error.message}</ErrorNote>}
      {data && <p className="text-sm text-ink/60">{data.total.toLocaleString('en-IN')} listings</p>}
      {data && data.items.length === 0 && <EmptyState title="No listings match">Try another state, source or search.</EmptyState>}

      <ul className="space-y-3">
        {data?.items.map((h) => (
          <li key={h.id} className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <StatePill state={h.state} />
                {h.flags.length > 0 && <Pill tone="warn">{h.flags.length} flag{h.flags.length === 1 ? '' : 's'}</Pill>}
                {h.sources.slice(0, 3).map((s) => (
                  <Pill key={s}>{sourceBySlug(s)?.name ?? s}</Pill>
                ))}
              </div>
              <Link href={`/admin/listings/${h.id}`} className="block break-words font-semibold text-ink hover:underline">
                {h.title}
              </Link>
              <p className="text-xs text-ink/60">
                {[h.organizer, h.mode === 'online' ? 'Online' : cityName(h.city), `${formatDate(h.startDate)} · deadline ${formatDate(h.registrationDeadline)}`]
                  .filter(Boolean)
                  .join(' · ')}
                {' · updated '}
                <Ago at={h.updatedAt} />
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Toggle on={h.verified} label="Verified" icon={BadgeCheck} busy={busy === `${h.id}:verified`} onClick={() => patch(h, { verified: !h.verified }, 'verified')} />
              <Toggle on={h.featured} label="Featured" icon={Star} busy={busy === `${h.id}:featured`} onClick={() => patch(h, { featured: !h.featured }, 'featured')} />
              <Link href={`/admin/listings/${h.id}`} className="btn-secondary px-3 py-1.5 text-sm">
                <Pencil className="h-4 w-4" />
                Edit
              </Link>
              {h.state === 'live' && (
                <>
                  <Link href={`/hackathons/${h.slug}`} className="btn-secondary px-3 py-1.5 text-sm" aria-label={`View ${h.title} on the site`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-sm"
                    disabled={busy === `${h.id}:state`}
                    onClick={() => {
                      if (window.confirm(`Take “${h.title}” off the site?`)) patch(h, { state: 'removed' }, 'state');
                    }}
                  >
                    {busy === `${h.id}:state` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Remove
                  </button>
                </>
              )}
              {(h.state === 'removed' || h.state === 'rejected') && (
                <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={busy === `${h.id}:state`} onClick={() => patch(h, { state: 'live' }, 'state')}>
                  {busy === `${h.id}:state` ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Restore
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}
