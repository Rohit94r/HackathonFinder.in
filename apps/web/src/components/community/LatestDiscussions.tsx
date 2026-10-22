'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, MessagesSquare, PenLine } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CompactThreadList } from './parts';
import type { ThreadList } from './model';

const listKey = (params: Record<string, string | number>) =>
  `/api/threads?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}`;

/**
 * A few hot discussions to drop into other pages. With `hackathonSlug`, threads about
 * that event come first; with `city`, threads from that city fill the rest.
 */
export default function LatestDiscussions({
  limit = 4,
  city,
  hackathonSlug,
  title = 'From the community',
  className,
}: {
  limit?: number;
  /** City slug from CITIES. */
  city?: string;
  /** Listing slug. */
  hackathonSlug?: string;
  title?: string;
  className?: string;
}) {
  const base = { sort: 'hot', pinned: 0, limit };
  const about = useSWR<ThreadList>(hackathonSlug ? listKey({ ...base, hackathon: hackathonSlug }) : null);
  const near = useSWR<ThreadList>(city ? listKey({ ...base, city }) : null);
  const all = useSWR<ThreadList>(!city && !hackathonSlug ? listKey(base) : null);

  const loading = (hackathonSlug && !about.data && !about.error) || (city && !near.data && !near.error) || (!city && !hackathonSlug && !all.data && !all.error);
  const now = about.data?.now ?? near.data?.now ?? all.data?.now ?? '';
  const picked = useMemo(() => {
    const seen = new Set<string>();
    return [...(about.data?.items ?? []), ...(near.data?.items ?? []), ...(all.data?.items ?? [])]
      .filter((t) => !seen.has(t.id) && seen.add(t.id))
      .slice(0, limit);
  }, [about.data, near.data, all.data, limit]);

  const seeAll = hackathonSlug ? `?hackathon=${hackathonSlug}` : city ? `?city=${city}` : '';
  const start = new URLSearchParams({ new: '1' });
  if (city) start.set('city', city);
  if (hackathonSlug) start.set('hackathon', hackathonSlug);

  return (
    <div className={cn('card p-5 sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex min-w-0 items-center gap-2 font-sans text-lg font-bold normal-case leading-tight tracking-normal">
          <MessagesSquare className="h-5 w-5 shrink-0" />
          {title}
        </h2>
        <Link href={`/community${seeAll}#discussions`} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-ink hover:underline">
          See all
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {loading ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading discussions">
          {Array.from({ length: Math.min(limit, 3) }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-4/5 animate-pulse rounded bg-ink/10" />
              <div className="h-3 w-1/3 animate-pulse rounded bg-ink/10" />
            </div>
          ))}
        </div>
      ) : picked.length > 0 ? (
        <CompactThreadList threads={picked} now={now} showCategory />
      ) : (
        <p className="text-sm text-ink/70">No discussions here yet. Ask the first question.</p>
      )}
      <Link href={`/community?${start.toString()}#discussions`} className="btn-secondary mt-5 w-full py-2 text-sm">
        <PenLine className="h-4 w-4" />
        Start a discussion
      </Link>
    </div>
  );
}
