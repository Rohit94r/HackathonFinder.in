'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { MoreHorizontal } from 'lucide-react';
import { CITIES, sourceBySlug, SOURCES } from '@hackathonfinder/shared';
import { apiFetch } from '@/lib/apiClient';
import { formatDate, formatDateRange } from '@/lib/format';
import { DEFAULT_FILTERS, REMOVE_REASONS, type HackathonFilters } from './hackathonFilters';
import type { ListingRow, Paged } from './types';
import { ActionStatus, Badge, Button, Empty, ErrorBox, ExtLink, Loading, num, PageHeader, Pager, SearchInput, Segmented, Select, StateBadge, Table, Td, Th, Thumb, useAction, useConfirm } from './ui';

type Data = Paged<ListingRow> & { counts: Record<string, number> };
type Action = 'live' | 'remove' | 'restore' | 'feature' | 'unfeature' | 'verify' | 'unverify' | 'delete';

function host(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 30);
  }
}

/** Who added it: the student or organizer who shared it, else the source that found it. */
function Origin({ h }: { h: ListingRow }) {
  return (
    <div className="space-y-0.5 text-xs">
      {h.submitter ? (
        <Link href={`/admin/users/${h.submitter.id}`} className="block font-medium hover:underline">
          @{h.submitter.handle}
        </Link>
      ) : null}
      <span className="block text-neutral-500">{h.sources.map((s) => sourceBySlug(s)?.name ?? s).join(', ') || 'Unknown'}</span>
    </div>
  );
}

/** Every listing in every state, with filters, quick keep / remove, and bulk actions. */
export default function HackathonsTable({ initial }: { initial: HackathonFilters }) {
  const [f, setF] = useState<HackathonFilters>(initial);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { busy, error, fields, done, run } = useAction();
  const [dialog, confirm] = useConfirm();

  const query = useMemo(() => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v !== '' && v !== DEFAULT_FILTERS[k as keyof HackathonFilters]) p.set(k, String(v));
    return p;
  }, [f]);
  const { data, error: loadError, isLoading, mutate } = useSWR<Data>(`/api/admin/listings?limit=30&${query}`, { keepPreviousData: true });

  // Filters live in the address bar, so refresh and links keep them.
  useEffect(() => {
    const qs = query.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [query]);
  useEffect(() => setSelected(new Set()), [query]);

  const set = useCallback(<K extends keyof HackathonFilters>(key: K, value: HackathonFilters[K]) => setF((prev) => ({ ...prev, [key]: value, page: key === 'page' ? (value as number) : 1 })), []);
  const items = data?.items ?? [];
  const allOnPage = items.length > 0 && items.every((h) => selected.has(h.id));

  /** Asks what's needed (a reason, "DELETE"), then runs the action on one listing or many. */
  const act = async (action: Action, rows: ListingRow[]) => {
    if (!rows.length) return;
    const one = rows.length === 1 ? rows[0] : null;
    const what = one ? `“${one.title}”` : `${rows.length} listings`;
    let note = '';
    let typed = '';
    if (action === 'remove') {
      const ok = await confirm({
        title: `Remove ${what}?`,
        body: 'It disappears from the site straight away. You can restore it later.',
        reason: { label: 'Why', required: true, suggestions: REMOVE_REASONS },
        confirmLabel: 'Remove',
      });
      if (!ok) return;
      note = ok.reason;
    }
    if (action === 'delete') {
      const ok = await confirm({
        title: `Delete ${what} permanently?`,
        body: 'This can’t be undone. Saves are deleted too. Removing keeps a copy you can restore.',
        typeToConfirm: 'DELETE',
        confirmLabel: 'Delete permanently',
      });
      if (!ok) return;
      typed = 'DELETE';
    }
    const labels: Record<Action, string> = {
      live: 'Kept and live',
      remove: 'Removed',
      restore: 'Restored',
      feature: 'Featured',
      unfeature: 'Unfeatured',
      verify: 'Verified',
      unverify: 'Unverified',
      delete: 'Deleted',
    };
    await run(
      `${action}:${one?.id ?? 'bulk'}`,
      async () => {
        if (one) {
          if (action === 'delete') return apiFetch(`/api/admin/listings/${one.id}`, { method: 'DELETE', body: { confirm: typed } });
          const body =
            action === 'live' || action === 'restore'
              ? { state: 'live' }
              : action === 'remove'
                ? { state: 'removed', note }
                : action === 'feature' || action === 'unfeature'
                  ? { featured: action === 'feature' }
                  : { verified: action === 'verify' };
          return apiFetch(`/api/admin/listings/${one.id}`, { method: 'PATCH', body });
        }
        const res = await apiFetch<{ done: string[]; failed: { id: string; error: string }[] }>('/api/admin/listings/bulk', {
          body: { ids: rows.map((r) => r.id), action, note, confirm: typed || undefined },
        });
        if (res.failed.length) throw new Error(`${res.done.length} done, ${res.failed.length} failed: ${res.failed[0].error}`);
        return res;
      },
      `${labels[action]}: ${what}.`
    );
    setSelected(new Set());
    await mutate();
  };

  const selectedRows = items.filter((h) => selected.has(h.id));
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      {dialog}
      <PageHeader title="Hackathons" description="Every listing: live, waiting, rejected and removed. You decide what stays." />

      <Segmented
        label="State"
        value={f.state}
        onChange={(v) => set('state', v)}
        options={[
          { value: 'all', label: 'All', count: data?.counts.all },
          { value: 'live', label: 'Live', count: data?.counts.live },
          { value: 'pending', label: 'Pending', count: data?.counts.pending },
          { value: 'rejected', label: 'Rejected', count: data?.counts.rejected },
          { value: 'removed', label: 'Removed', count: data?.counts.removed },
        ]}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={f.q} onChange={(v) => set('q', v)} placeholder="Search title, organizer, link" />
        <Select label="Source" value={f.source} onChange={(v) => set('source', v)} className="w-40" options={[{ value: '', label: 'Any source' }, ...SOURCES.map((s) => ({ value: s.slug, label: s.name }))]} />
        <Select
          label="Mode"
          value={f.mode}
          onChange={(v) => set('mode', v)}
          className="w-32"
          options={[
            { value: '', label: 'Any mode' },
            { value: 'online', label: 'Online' },
            { value: 'offline', label: 'In person' },
            { value: 'hybrid', label: 'Hybrid' },
          ]}
        />
        <Select label="City" value={f.city} onChange={(v) => set('city', v)} className="w-36" options={[{ value: '', label: 'Any city' }, { value: 'online', label: 'Online only' }, ...CITIES.map((c) => ({ value: c.slug, label: c.name }))]} />
        <Select
          label="Banner"
          value={f.image}
          onChange={(v) => set('image', v)}
          className="w-36"
          options={[
            { value: '', label: 'With or without image' },
            { value: '1', label: 'Has an image' },
            { value: '0', label: 'No image' },
          ]}
        />
        <Select
          label="Registration"
          value={f.qr}
          onChange={(v) => set('qr', v)}
          className="w-36"
          options={[
            { value: '', label: 'Any registration' },
            { value: '1', label: 'QR code only' },
          ]}
        />
        <Select
          label="Sort"
          value={f.sort}
          onChange={(v) => set('sort', v)}
          className="w-40"
          options={[
            { value: 'updated', label: 'Recently changed' },
            { value: 'created', label: 'Newest first' },
            { value: 'deadline', label: 'Deadline soonest' },
            { value: 'start', label: 'Starts soonest' },
            { value: 'views', label: 'Most viewed' },
            { value: 'clicks', label: 'Most register clicks' },
            { value: 'title', label: 'Title A–Z' },
          ]}
        />
        {query.toString() && (
          <Button size="sm" variant="ghost" onClick={() => setF(DEFAULT_FILTERS)}>
            Clear filters
          </Button>
        )}
      </div>

      <ActionStatus error={error} done={done} fields={fields} />

      {selectedRows.length > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border border-black bg-white px-3 py-2">
          <span className="mr-2 text-sm font-medium">{selectedRows.length} selected</span>
          <Button size="sm" variant="primary" busy={busy === 'live:bulk'} disabled={Boolean(busy)} onClick={() => act('live', selectedRows)}>
            Keep (make live)
          </Button>
          <Button size="sm" busy={busy === 'remove:bulk'} disabled={Boolean(busy)} onClick={() => act('remove', selectedRows)}>
            Remove
          </Button>
          <Button size="sm" disabled={Boolean(busy)} onClick={() => act('restore', selectedRows)}>
            Restore
          </Button>
          <Button size="sm" disabled={Boolean(busy)} onClick={() => act('feature', selectedRows)}>
            Feature
          </Button>
          <Button size="sm" disabled={Boolean(busy)} onClick={() => act('unfeature', selectedRows)}>
            Unfeature
          </Button>
          <Button size="sm" disabled={Boolean(busy)} onClick={() => act('verify', selectedRows)}>
            Verify
          </Button>
          <Button size="sm" disabled={Boolean(busy)} onClick={() => act('delete', selectedRows)}>
            Delete…
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      {loadError && <ErrorBox>{loadError.message}</ErrorBox>}
      {isLoading && !data && <Loading>Loading listings…</Loading>}
      {data && !items.length && <Empty title="No listings match">Try another state or clear the filters.</Empty>}

      {items.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th className="w-8">
                <input
                  type="checkbox"
                  aria-label="Select every listing on this page"
                  checked={allOnPage}
                  onChange={() => setSelected(allOnPage ? new Set() : new Set(items.map((h) => h.id)))}
                  className="h-4 w-4"
                />
              </Th>
              <Th>Banner</Th>
              <Th>Hackathon</Th>
              <Th>Place</Th>
              <Th>Dates</Th>
              <Th>Status</Th>
              <Th>Added by</Th>
              <Th>Registration</Th>
              <Th right>Views / clicks</Th>
              <Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((h) => (
              <tr key={h.id} className={selected.has(h.id) ? 'bg-neutral-100' : undefined}>
                <Td>
                  <input type="checkbox" aria-label={`Select ${h.title}`} checked={selected.has(h.id)} onChange={() => toggle(h.id)} className="h-4 w-4" />
                </Td>
                <Td>
                  <Thumb src={h.imageUrl} className="h-12 w-20" />
                </Td>
                <Td className="min-w-[220px] max-w-[300px]">
                  <Link href={`/admin/hackathons/${h.id}`} className="font-medium hover:underline">
                    {h.title}
                  </Link>
                  {h.organizer && <span className="block text-xs text-neutral-500">{h.organizer}</span>}
                  <span className="mt-1 flex flex-wrap gap-1">
                    {h.registrationVia === 'qr' && <Badge tone="solid">QR</Badge>}
                    {h.featured && <Badge>Featured</Badge>}
                    {h.verified && <Badge>Verified</Badge>}
                    {h.flags.length > 0 && h.state === 'pending' && <Badge tone="muted" title={h.flags.join('\n')}>{h.flags.length} flag{h.flags.length === 1 ? '' : 's'}</Badge>}
                  </span>
                </Td>
                <Td className="whitespace-nowrap">
                  {h.place}
                  <span className="block text-xs text-neutral-500">{h.mode === 'offline' ? 'In person' : h.mode === 'hybrid' ? 'Hybrid' : 'Online'}</span>
                </Td>
                <Td className="whitespace-nowrap text-xs">
                  {formatDateRange(h.startDate, h.endDate)}
                  <span className="block text-neutral-500">Deadline {formatDate(h.registrationDeadline)}</span>
                </Td>
                <Td className="max-w-[180px]">
                  <StateBadge state={h.state} />
                  {h.removedReason && (h.state === 'removed' || h.state === 'rejected') && <span className="mt-1 block text-xs text-neutral-500">{h.removedReason}</span>}
                </Td>
                <Td>
                  <Origin h={h} />
                </Td>
                <Td className="max-w-[180px] text-xs">
                  <ExtLink href={h.registrationUrl}>{host(h.registrationUrl)}</ExtLink>
                  {h.registrationVia === 'qr' && <span className="mt-0.5 block text-neutral-500">QR code on the poster</span>}
                </Td>
                <Td right className="whitespace-nowrap text-xs">
                  {num(h.stats.views)} / {num(h.stats.registerClicks)}
                </Td>
                <Td right>
                  <div className="flex items-center justify-end gap-1.5">
                    {h.state === 'live' ? (
                      <Button size="sm" busy={busy === `remove:${h.id}`} disabled={Boolean(busy)} onClick={() => act('remove', [h])}>
                        Remove
                      </Button>
                    ) : h.state === 'pending' ? (
                      <Button size="sm" variant="primary" busy={busy === `live:${h.id}`} disabled={Boolean(busy)} onClick={() => act('live', [h])}>
                        Keep
                      </Button>
                    ) : (
                      <Button size="sm" busy={busy === `restore:${h.id}`} disabled={Boolean(busy)} onClick={() => act('restore', [h])}>
                        Restore
                      </Button>
                    )}
                    <details className="relative">
                      <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-[3px] border border-neutral-400 hover:border-black [&::-webkit-details-marker]:hidden" aria-label={`More actions for ${h.title}`}>
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </summary>
                      <div className="absolute right-0 z-20 mt-1 w-44 border border-black bg-white py-1 text-left text-sm" onClick={(e) => (e.currentTarget.parentElement as HTMLDetailsElement).removeAttribute('open')}>
                        <Link href={`/admin/hackathons/${h.id}`} className="block px-3 py-1.5 hover:bg-neutral-100">
                          Edit
                        </Link>
                        {h.state === 'live' && (
                          <a href={`/hackathons/${h.slug}`} target="_blank" rel="noopener noreferrer" className="block px-3 py-1.5 hover:bg-neutral-100">
                            View on the site
                          </a>
                        )}
                        {h.state === 'pending' && (
                          <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100" onClick={() => act('remove', [h])}>
                            Remove
                          </button>
                        )}
                        <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100" onClick={() => act(h.featured ? 'unfeature' : 'feature', [h])}>
                          {h.featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button type="button" className="block w-full px-3 py-1.5 text-left hover:bg-neutral-100" onClick={() => act(h.verified ? 'unverify' : 'verify', [h])}>
                          {h.verified ? 'Unverify' : 'Verify'}
                        </button>
                        <button type="button" className="block w-full border-t border-neutral-200 px-3 py-1.5 text-left hover:bg-neutral-100" onClick={() => act('delete', [h])}>
                          Delete permanently…
                        </button>
                      </div>
                    </details>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={(p) => set('page', p)} />}
    </div>
  );
}
