'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { GitMerge } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { ListingRow, Paged } from './types';
import { Button, Loading, SearchInput, StateBadge, Thumb } from './ui';

/** Finds the listing to merge into, by title, organizer or slug. */
export default function MergePicker({
  initialQuery,
  excludeId,
  busy,
  onMerge,
}: {
  initialQuery: string;
  excludeId?: string;
  busy: boolean;
  onMerge: (target: { id: string; title: string }) => void;
}) {
  const [q, setQ] = useState(initialQuery.slice(0, 60));
  const key = q.trim().length >= 2 ? `/api/admin/listings?limit=8&q=${encodeURIComponent(q.trim())}` : null;
  const { data, isLoading } = useSWR<Paged<ListingRow>>(key);
  const items = (data?.items ?? []).filter((r) => r.id !== excludeId && r.state !== 'removed' && r.state !== 'rejected');

  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Search listings by title or organizer" className="sm:w-full" />
      {isLoading && <Loading>Searching…</Loading>}
      {key && !isLoading && items.length === 0 && <p className="text-sm text-neutral-500">No listing matches “{q}”.</p>}
      <ul className={items.length ? 'divide-y divide-neutral-200 border border-neutral-300' : 'hidden'}>
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 px-3 py-2">
            <Thumb src={r.imageUrl} className="h-10 w-16" />
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium">{r.title}</p>
              <p className="text-xs text-neutral-500">{[r.organizer, r.place, formatDate(r.startDate)].filter(Boolean).join(' · ')}</p>
            </div>
            <StateBadge state={r.state} />
            <Button size="sm" icon={GitMerge} disabled={busy} onClick={() => onMerge({ id: r.id, title: r.title })}>
              Merge into this
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
