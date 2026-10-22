'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWRInfinite from 'swr/infinite';
import { Flame, LayoutList, Loader2, LogIn, MapPin, MessageSquare, PenLine, Search, Sparkles, Ticket, TrendingUp, X } from 'lucide-react';
import { CITIES, cityName } from '@hackathonfinder/shared';
import { CATEGORIES, categoryById, excerpt, type CategoryId } from '@/data/discussions';
import { goToLogin } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { CATEGORY_ICONS } from './categories';
import NewThreadForm, { type EventOption } from './NewThreadForm';
import { AuthorLink, CategoryChip, PinnedChip, TagChip, VoteButton } from './parts';
import { SORTS, ago, type SortKey, type ThreadItem, type ThreadList } from './model';
import { useViewer, useVotes } from './useCommunity';

export interface BoardFilters {
  category: CategoryId | '';
  city: string;
  hackathon: string;
  sort: SortKey;
  q: string;
}

const SORT_ICONS = { hot: Flame, new: Sparkles, top: TrendingUp };
const PAGE_SIZE = 20;

/** The address-bar query for these filters; also what the API reads. */
export function boardQuery(f: BoardFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (f.category) params.set('category', f.category);
  if (f.city) params.set('city', f.city);
  if (f.hackathon) params.set('hackathon', f.hackathon);
  if (f.sort !== 'hot') params.set('sort', f.sort);
  if (f.q.trim()) params.set('q', f.q.trim());
  return params;
}

export default function DiscussionBoard({
  events,
  titles,
  initial,
  initialData,
  compose = false,
}: {
  /** Open listings, offered when starting a discussion. */
  events: EventOption[];
  /** Titles for listing slugs, for the "About:" filter chip. */
  titles: Record<string, string>;
  initial: BoardFilters;
  /** The first page for `initial`, rendered on the server. */
  initialData: ThreadList;
  /** Open the "Start a discussion" form on arrival. */
  compose?: boolean;
}) {
  const router = useRouter();
  const { viewer, ready: viewerReady } = useViewer();
  const votes = useVotes();
  const [filters, setFilters] = useState<BoardFilters>(initial);
  const [q, setQ] = useState(initial.q);
  const [formOpen, setFormOpen] = useState(false);
  const set = (patch: Partial<BoardFilters>) => setFilters((f) => ({ ...f, ...patch }));

  // Search as the student types, without a request per key.
  useEffect(() => {
    const id = window.setTimeout(() => setFilters((f) => (f.q === q ? f : { ...f, q })), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  // Keep the filters in the address bar so a view can be shared.
  useEffect(() => {
    const qs = boardQuery(filters).toString();
    window.history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`);
  }, [filters]);

  // ?new=1 opens the form once we know the student is signed in.
  useEffect(() => {
    if (compose && viewerReady && viewer) setFormOpen(true);
  }, [compose, viewerReady, viewer]);

  const query = boardQuery(filters).toString();
  const isInitial = query === boardQuery(initial).toString();
  const { data, error, size, setSize, isValidating, mutate } = useSWRInfinite<ThreadList>(
    (index, previous) => (previous && !previous.hasMore ? null : `/api/threads?${query}${query ? '&' : ''}page=${index + 1}&limit=${PAGE_SIZE}`),
    // Votes and posts show up on the next visit, so the server's first page is fresh enough.
    { fallbackData: isInitial ? [initialData] : undefined, revalidateFirstPage: false, revalidateOnMount: !isInitial }
  );

  const pages = data ?? [];
  const first = pages[0];
  const items = useMemo(() => {
    const seen = new Set<string>();
    return pages.flatMap((p) => p.items).filter((t) => !seen.has(t.id) && seen.add(t.id));
  }, [pages]);
  const loading = !data && !error;
  const loadingMore = isValidating && size > pages.length;
  const hasMore = Boolean(pages[pages.length - 1]?.hasMore);
  const counts = first?.counts ?? {};
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const total = first?.total ?? 0;
  const now = first?.now ?? initialData.now;

  const category = filters.category ? categoryById(filters.category) : undefined;
  const filtered = Boolean(filters.category || filters.city || filters.hackathon || filters.q.trim());

  const openForm = () => {
    if (!viewerReady) return;
    if (!viewer) {
      const back = new URLSearchParams(boardQuery(filters));
      back.set('new', '1');
      goToLogin(`/community?${back.toString()}#discussions`);
      return;
    }
    if (formOpen) document.getElementById('new-discussion')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else setFormOpen(true);
  };
  const reset = () => {
    setFilters((f) => ({ ...f, category: '', city: '', hackathon: '', q: '' }));
    setQ('');
  };

  const categoryButtons = (
    <>
      {[{ id: '' as const, label: 'All discussions' }, ...CATEGORIES].map((c) => {
        const Icon = c.id ? CATEGORY_ICONS[c.id] : LayoutList;
        const active = filters.category === c.id;
        const count = c.id ? counts[c.id] ?? 0 : allCount;
        return (
          <button
            key={c.id || 'all'}
            type="button"
            aria-pressed={active}
            onClick={() => set({ category: c.id })}
            className={cn(
              'flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition lg:w-full lg:py-2.5',
              active ? 'border border-brand-600 bg-brand-600 text-white' : 'border border-ink/15 text-ink/80 hover:bg-ink/5 lg:border-transparent'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap lg:flex-1">{c.label}</span>
            <span className={cn('text-xs tabular-nums', active ? 'text-white/80' : 'text-ink/45')}>{first ? count : '·'}</span>
          </button>
        );
      })}
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <aside aria-label="Discussion topics" className="min-w-0">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:hidden">{categoryButtons}</div>
        <div className="card sticky top-24 hidden p-3 lg:block">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-ink/60">Topics</p>
          <div className="space-y-0.5">{categoryButtons}</div>
        </div>
      </aside>

      <div className="min-w-0">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-sans text-2xl font-bold normal-case leading-tight tracking-normal">
              {category ? category.label : 'All discussions'}
            </h2>
            <p className="mt-1 text-sm text-ink/70">
              {category ? category.description : 'Questions, tips and team-ups from students across India.'}
            </p>
          </div>
          <button type="button" onClick={openForm} className="btn-primary py-2.5">
            {viewerReady && !viewer ? <LogIn className="h-4 w-4" /> : <PenLine className="h-4 w-4" />}
            {viewerReady && !viewer ? 'Sign in to start a discussion' : 'Start a discussion'}
          </button>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
            <label htmlFor="discuss-search" className="sr-only">
              Search discussions
            </label>
            <input
              id="discuss-search"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={100}
              placeholder="Search questions, hackathons or tips"
              className="input pl-11"
            />
          </div>
          <label htmlFor="discuss-city" className="sr-only">
            City
          </label>
          <select id="discuss-city" value={filters.city} onChange={(e) => set({ city: e.target.value })} className="input py-2.5 sm:w-48">
            <option value="">All cities</option>
            {CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Sort discussions" className="flex gap-2">
            {SORTS.map((s) => {
              const Icon = SORT_ICONS[s.value];
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={filters.sort === s.value}
                  onClick={() => set({ sort: s.value })}
                  className={cn('chip text-xs', filters.sort === s.value && 'chip-active')}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {filters.hackathon && (
              <button
                type="button"
                onClick={() => set({ hackathon: '' })}
                className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-ink/10"
              >
                About: {titles[filters.hackathon] ?? items[0]?.hackathonTitle ?? filters.hackathon}
                <X className="h-3 w-3" />
                <span className="sr-only">Remove filter</span>
              </button>
            )}
            <p className="text-sm text-ink/70" aria-live="polite">
              {loading ? (
                'Loading…'
              ) : (
                <>
                  <strong className="text-ink">{total}</strong> {total === 1 ? 'discussion' : 'discussions'}
                  {filters.city && <> in {cityName(filters.city)}</>}
                </>
              )}
            </p>
          </div>
        </div>

        {formOpen && viewer && (
          <NewThreadForm
            events={events}
            defaults={{ category: filters.category, city: filters.city, hackathonSlug: filters.hackathon }}
            onCancel={() => setFormOpen(false)}
            onPosted={(thread) => {
              mutate();
              router.push(`/community/${thread.slug}`);
            }}
          />
        )}

        {votes.error && (
          <p role="alert" className="mb-4 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 dark:bg-brand-400/10 dark:text-brand-200">
            {votes.error}
          </p>
        )}

        {loading ? (
          <div className="card divide-y divide-ink/10" aria-busy="true" aria-label="Loading discussions">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-5">
                <div className="h-14 w-12 animate-pulse rounded-xl bg-ink/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-ink/10" />
                  <div className="h-5 w-3/4 animate-pulse rounded bg-ink/10" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-ink/10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-sm text-ink/70">
            We couldn’t load the discussions.{' '}
            <button type="button" onClick={() => mutate()} className="font-semibold text-ink underline underline-offset-2">
              Try again
            </button>
          </div>
        ) : items.length > 0 ? (
          <>
            <ul className="card divide-y divide-ink/10 overflow-hidden">
              {items.map((t) => {
                const v = votes.view('thread', t);
                return (
                  <ThreadRow
                    key={t.id}
                    t={{ ...t, ...v }}
                    now={now}
                    hackathonTitle={t.hackathonTitle ?? (t.hackathonSlug ? titles[t.hackathonSlug] : undefined)}
                    onVote={() => votes.toggle('thread', { id: t.id, ...v })}
                  />
                );
              })}
            </ul>
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button type="button" onClick={() => setSize(size + 1)} disabled={loadingMore} className="btn-secondary py-2.5">
                  {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                  {loadingMore ? 'Loading…' : 'Show more discussions'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="card flex flex-col items-center px-6 py-14 text-center">
            <span className="mb-4 rounded-2xl bg-ink/5 p-4 text-ink">
              <MessageSquare className="h-7 w-7" />
            </span>
            <h3 className="text-xl font-bold">No discussions here yet</h3>
            <p className="mt-2 max-w-md text-sm text-ink/70">
              {filtered ? 'Try another topic or city, or clear the search. Or be the first to ask.' : 'Be the first to start one.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {filtered && (
                <button type="button" onClick={reset} className="btn-secondary py-2.5">
                  Clear filters
                </button>
              )}
              <button type="button" onClick={openForm} className="btn-primary py-2.5">
                <PenLine className="h-4 w-4" />
                Start a discussion
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadRow({ t, now, hackathonTitle, onVote }: { t: ThreadItem; now: string; hackathonTitle?: string; onVote: () => void }) {
  const replies = t.replyCount;
  return (
    <li className="flex gap-3 p-4 transition hover:bg-ink/[0.02] sm:gap-4 sm:p-5">
      <VoteButton count={t.votes} voted={t.voted} onToggle={onVote} label={`“${t.title}”`} />
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          {t.pinned && <PinnedChip />}
          <CategoryChip id={t.category} />
          {t.mine && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">Your post</span>}
        </div>
        <h3 className="break-words text-base font-semibold leading-snug sm:text-lg">
          <Link href={`/community/${t.slug}`} className="hover:underline">
            {t.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 break-words text-sm text-ink/60">{excerpt(t.body, 220)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-ink/60">
          <AuthorLink author={t.author} mine={t.mine} className="text-xs" />
          <span>{ago(t.createdAt, now)}</span>
          {t.city && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {cityName(t.city)}
            </span>
          )}
          {hackathonTitle && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <Ticket className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{hackathonTitle}</span>
            </span>
          )}
          <Link href={`/community/${t.slug}#replies`} className="inline-flex items-center gap-1 font-semibold text-ink/70 hover:underline sm:hidden">
            <MessageSquare className="h-3.5 w-3.5" />
            {replies} {replies === 1 ? 'reply' : 'replies'}
          </Link>
          {t.tags.slice(0, 3).map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      </div>
      <Link
        href={`/community/${t.slug}#replies`}
        className="hidden h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl text-ink/70 hover:bg-ink/5 hover:text-ink sm:flex"
      >
        <MessageSquare className="h-5 w-5" />
        <span className="text-sm font-semibold">{replies}</span>
        <span className="sr-only">{replies === 1 ? 'reply' : 'replies'}</span>
      </Link>
    </li>
  );
}
