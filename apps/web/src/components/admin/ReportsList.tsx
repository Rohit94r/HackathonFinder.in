'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { apiFetch } from '@/lib/apiClient';
import { ActionStatus, Ago, Badge, Button, Empty, ErrorBox, ExtLink, inputClass, Loading, PageHeader, Segmented, StateBadge, useAction, useConfirm } from './ui';

type Status = 'open' | 'resolved' | 'dismissed' | 'all';

interface ReportItem {
  id: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  reporter: { handle: string; name: string } | null;
  resolvedBy: { handle: string; name: string } | null;
  resolvedAt: string | null;
  resolutionNote: string;
  hackathonSlug: string;
  listing: { id: string; slug: string; title: string; state: string; registrationUrl: string } | null;
  openOnListing: number;
}

const REASONS: Record<string, string> = {
  'wrong-details': 'Wrong details',
  scam: 'Scam or suspicious',
  expired: 'Expired',
  duplicate: 'Duplicate',
  'broken-link': 'Broken link',
  other: 'Other',
};

function ReportCard({ r, onDone }: { r: ReportItem; onDone: () => void }) {
  const [note, setNote] = useState('');
  const { busy, error, run } = useAction();
  const [dialog, confirm] = useConfirm();

  const act = async (status: 'open' | 'resolved' | 'dismissed', removeListing = false) => {
    if (removeListing) {
      const ok = await confirm({ title: `Remove “${r.listing?.title}” from the site?`, body: 'Its other open reports are resolved too. You can restore the listing later.', confirmLabel: 'Resolve and remove' });
      if (!ok) return;
    }
    const res = await run(`${status}${removeListing ? '-remove' : ''}`, () => apiFetch(`/api/admin/reports/${r.id}`, { method: 'PATCH', body: { status, note, removeListing } }));
    if (res) onDone();
  };

  return (
    <li className="space-y-2 border border-neutral-300 p-4">
      {dialog}
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={r.reason === 'scam' ? 'solid' : 'outline'}>{REASONS[r.reason] ?? r.reason}</Badge>
        {r.status !== 'open' && <Badge tone="muted">{r.status}</Badge>}
        {r.openOnListing > 1 && r.status === 'open' && <Badge tone="solid">{r.openOnListing} open reports on this listing</Badge>}
        <span className="text-xs text-neutral-500">
          {r.reporter ? `@${r.reporter.handle}` : 'Signed out'} · <Ago at={r.createdAt} />
        </span>
      </div>
      {r.listing ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/admin/hackathons/${r.listing.id}`} className="break-words font-medium hover:underline">
            {r.listing.title}
          </Link>
          <StateBadge state={r.listing.state} />
          <ExtLink href={r.listing.registrationUrl} className="text-xs">
            Registration link
          </ExtLink>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">The listing “{r.hackathonSlug}” no longer exists.</p>
      )}
      {r.details ? <p className="whitespace-pre-wrap break-words border-l-2 border-black pl-3 text-sm">{r.details}</p> : <p className="text-sm text-neutral-500">No details given.</p>}

      {r.status === 'open' ? (
        <div className="space-y-2">
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="What you did about it (optional)" aria-label="Resolution note" />
          {error && <ActionStatus error={error} done="" />}
          <div className="flex flex-wrap gap-2">
            {r.listing && (
              <Link href={`/admin/hackathons/${r.listing.id}`} className="inline-flex h-7 items-center rounded-[3px] border border-neutral-400 px-2.5 text-xs hover:border-black">
                Fix the listing
              </Link>
            )}
            <Button size="sm" variant="primary" busy={busy === 'resolved'} disabled={Boolean(busy)} onClick={() => act('resolved')}>
              Resolved
            </Button>
            {r.listing && r.listing.state !== 'removed' && (
              <Button size="sm" busy={busy === 'resolved-remove'} disabled={Boolean(busy)} onClick={() => act('resolved', true)}>
                Resolve and remove listing
              </Button>
            )}
            <Button size="sm" busy={busy === 'dismissed'} disabled={Boolean(busy)} onClick={() => act('dismissed')}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
          <span>
            {r.status === 'resolved' ? 'Resolved' : 'Dismissed'}
            {r.resolvedBy ? ` by @${r.resolvedBy.handle}` : ''} <Ago at={r.resolvedAt} fallback="" />
            {r.resolutionNote ? `: ${r.resolutionNote}` : ''}
          </span>
          <Button size="sm" variant="ghost" busy={busy === 'open'} disabled={Boolean(busy)} onClick={() => act('open')}>
            Reopen
          </Button>
        </div>
      )}
    </li>
  );
}

/** "Report this listing" reports: fix the listing, resolve, remove it, or dismiss. */
export default function ReportsList() {
  const [status, setStatus] = useState<Status>('open');
  const { data, error, mutate } = useSWR<{ items: ReportItem[]; counts: Record<string, number> }>(`/api/admin/reports?status=${status}`);
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" description="Students report wrong details, scams, expired events and broken links from event pages." />
      <Segmented
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'open', label: 'Open', count: data?.counts.open },
          { value: 'resolved', label: 'Resolved', count: data?.counts.resolved },
          { value: 'dismissed', label: 'Dismissed', count: data?.counts.dismissed },
          { value: 'all', label: 'All' },
        ]}
      />
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {!data && !error && <Loading>Loading reports…</Loading>}
      {data && data.items.length === 0 && <Empty title={status === 'open' ? 'No open reports' : 'Nothing here'} />}
      <ul className="space-y-3">
        {data?.items.map((r) => (
          <ReportCard key={r.id} r={r} onDone={() => void mutate()} />
        ))}
      </ul>
    </div>
  );
}
