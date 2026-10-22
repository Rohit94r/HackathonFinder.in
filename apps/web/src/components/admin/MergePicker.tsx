'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { GitMerge, Loader2 } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import { formatDate } from '@/lib/format';
import { SearchBox, StatePill } from './parts';

interface Row {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  state: string;
  mode: string;
  city: string;
  startDate: string;
}

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
  const { data, isLoading } = useSWR<{ items: Row[] }>(key);
  const items = (data?.items ?? []).filter((r) => r.id !== excludeId && r.state !== 'removed' && r.state !== 'rejected');

  return (
    <div className="space-y-3">
      <SearchBox value={q} onChange={setQ} placeholder="Search listings by title or organizer" />
      {isLoading && <p className="text-sm text-ink/60">Searching…</p>}
      {key && !isLoading && items.length === 0 && <p className="text-sm text-ink/60">No listing matches “{q}”.</p>}
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 px-3 py-2">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-ink">{r.title}</p>
              <p className="text-xs text-ink/60">
                {[r.organizer, r.mode === 'online' ? 'Online' : cityName(r.city), formatDate(r.startDate)].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatePill state={r.state} />
              <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={busy} onClick={() => onMerge({ id: r.id, title: r.title })}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
                Merge into this
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
