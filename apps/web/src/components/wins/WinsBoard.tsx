'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { Loader2, LogIn, Plus, Search, Trophy } from 'lucide-react';
import { CITIES, THEMES } from '@hackathonfinder/shared';
import { useViewer } from '@/components/community/useCommunity';
import { RESULT_LABELS } from '@/data/people';
import { WIN_RESULTS, type WinResult } from '@/data/wins';
import { goToLogin } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import WinCard from './WinCard';
import WinForm, { type WinEventOption } from './WinForm';
import type { WinList, WinSort } from './model';

export interface WinFilters {
  result: WinResult | '';
  theme: string;
  /** A city slug, "online", or "" for all. */
  city: string;
  q: string;
  sort: WinSort;
}

const PAGE_SIZE = 12;

export function winsQuery(f: WinFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.result) params.set('result', f.result);
  if (f.theme) params.set('theme', f.theme);
  if (f.city) params.set('city', f.city);
  if (f.q.trim()) params.set('q', f.q.trim());
  if (f.sort !== 'newest') params.set('sort', f.sort);
  return params;
}

/** `openForm` comes from /wins?share=1, which profile pages link to. */
export default function WinsBoard({
  events,
  initial,
  initialData,
  openForm = false,
}: {
  events: WinEventOption[];
  initial: WinFilters;
  /** The first page for `initial`, rendered on the server. */
  initialData: WinList;
  openForm?: boolean;
}) {
  const { viewer, ready: viewerReady } = useViewer();
  const [filters, setFilters] = useState<WinFilters>(initial);
  const [q, setQ] = useState(initial.q);
  const [formOpen, setFormOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const set = (patch: Partial<WinFilters>) => setFilters((f) => ({ ...f, ...patch }));

  useEffect(() => {
    const id = window.setTimeout(() => setFilters((f) => (f.q === q ? f : { ...f, q })), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const params = winsQuery(filters);
    if (formOpen) params.set('share', '1');
    const qs = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [filters, formOpen]);

  useEffect(() => {
    if (openForm && viewerReady && viewer) setFormOpen(true);
  }, [openForm, viewerReady, viewer]);

  useEffect(() => {
    if (formOpen) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [formOpen]);

  const query = winsQuery(filters).toString();
  const isInitial = query === winsQuery(initial).toString();
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<WinList>(
    (index, previous) => (previous && !previous.hasMore ? null : `/api/wins?${query}${query ? '&' : ''}page=${index + 1}&limit=${PAGE_SIZE}`),
    { fallbackData: isInitial ? [initialData] : undefined, revalidateFirstPage: false, revalidateOnMount: !isInitial }
  );

  const pages = data ?? [];
  const list = useMemo(() => {
    const seen = new Set<string>();
    return pages.flatMap((p) => p.items).filter((w) => !seen.has(w.id) && seen.add(w.id));
  }, [pages]);
  const loading = !data && !error;
  const loadingMore = isValidating && size > pages.length;
  const hasMore = Boolean(pages[pages.length - 1]?.hasMore);
  const total = pages[0]?.total ?? 0;
  const now = pages[0]?.now ?? initialData.now;

  const filtered = Boolean(filters.result || filters.theme || filters.city || filters.q.trim());
  const reset = () => {
    setFilters((f) => ({ ...f, result: '', theme: '', city: '', q: '' }));
    setQ('');
  };
  const share = () => {
    if (!viewerReady) return;
    if (!viewer) {
      goToLogin('/wins?share=1');
      return;
    }
    if (formOpen) formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else setFormOpen(true);
  };
  const signedOut = viewerReady && !viewer;

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" aria-hidden="true" />
          <label htmlFor="wins-search" className="sr-only">
            Search winning stories
          </label>
          <input
            id="wins-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={100}
            placeholder="Search by project, hackathon or tech…"
            className="input pl-11"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="wins-sort" className="sr-only">
            Sort by
          </label>
          <select id="wins-sort" value={filters.sort} onChange={(e) => set({ sort: e.target.value as WinSort })} className="input py-2.5 sm:w-auto">
            <option value="newest">Newest first</option>
            <option value="cheers">Most cheered</option>
          </select>
          <button type="button" onClick={share} aria-expanded={formOpen} aria-controls="win-form" className="btn-primary shrink-0">
            {signedOut ? <LogIn className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {signedOut ? 'Sign in to share your win' : 'Share your win'}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Result">
          {[{ value: '' as const, label: 'All results' }, ...WIN_RESULTS.map((r) => ({ value: r, label: RESULT_LABELS[r] }))].map((o) => (
            <button
              key={o.value || 'all'}
              type="button"
              aria-pressed={filters.result === o.value}
              onClick={() => set({ result: o.value })}
              className={cn('chip text-xs', filters.result === o.value && 'chip-active')}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:ml-auto">
          <label htmlFor="wins-theme" className="sr-only">
            Theme
          </label>
          <select id="wins-theme" value={filters.theme} onChange={(e) => set({ theme: e.target.value })} className="input py-2.5 sm:w-52">
            <option value="">All themes</option>
            {THEMES.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
          <label htmlFor="wins-city" className="sr-only">
            City
          </label>
          <select id="wins-city" value={filters.city} onChange={(e) => set({ city: e.target.value })} className="input py-2.5 sm:w-48">
            <option value="">All cities</option>
            <option value="online">Online</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={formRef} id="win-form" className="scroll-mt-24">
        {formOpen && viewer && <WinForm events={events} onCancel={() => setFormOpen(false)} />}
      </div>

      <p className="mb-5 text-sm text-ink/70" aria-live="polite">
        {loading ? (
          'Loading…'
        ) : (
          <>
            <strong className="text-ink">{total}</strong> {total === 1 ? 'story' : 'stories'}
          </>
        )}
        {filtered && (
          <>
            {' · '}
            <button type="button" onClick={reset} className="font-semibold text-ink hover:underline">
              Clear filters
            </button>
          </>
        )}
      </p>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading stories">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card h-80 animate-pulse bg-ink/5" />
          ))}
        </div>
      ) : error ? (
        <div className="card p-6 text-sm text-ink/70">
          We couldn’t load the stories.{' '}
          <button type="button" onClick={() => mutate()} className="font-semibold text-ink underline underline-offset-2">
            Try again
          </button>
        </div>
      ) : list.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((s) => (
              <WinCard key={s.id} story={s} now={now} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button type="button" onClick={() => setSize(size + 1)} disabled={loadingMore} className="btn-secondary">
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {loadingMore ? 'Loading…' : 'Show more stories'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card flex flex-col items-center px-6 py-16 text-center">
          <span className="mb-4 rounded-lg bg-ink/5 p-4 text-ink">
            <Trophy className="h-7 w-7" aria-hidden="true" />
          </span>
          <h3 className="text-xl font-bold">No stories match yet</h3>
          <p className="mt-2 max-w-md text-sm text-ink/70">Try another filter, or be the first to share a win like this one.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {filtered && (
              <button type="button" onClick={reset} className="btn-secondary">
                Clear filters
              </button>
            )}
            <button type="button" onClick={share} className="btn-primary">
              Share your win
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
