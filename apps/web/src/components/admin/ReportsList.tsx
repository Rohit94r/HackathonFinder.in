'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Check, ExternalLink, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { Ago, EmptyState, ErrorNote, Pill, StatePill, Tabs } from './parts';

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
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');

  const act = async (status: 'open' | 'resolved' | 'dismissed', removeListing = false) => {
    setBusy(`${status}${removeListing ? '-remove' : ''}`);
    setProblem('');
    try {
      await apiFetch(`/api/admin/reports/${r.id}`, { method: 'PATCH', body: { status, note, removeListing } });
      onDone();
    } catch (err) {
      setProblem(err instanceof ApiClientError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };
  const spin = (key: string, Icon: typeof Check) => (busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />);

  return (
    <li className="card space-y-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={r.reason === 'scam' ? 'bad' : 'warn'}>{REASONS[r.reason] ?? r.reason}</Pill>
        {r.status !== 'open' && <Pill>{r.status}</Pill>}
        {r.openOnListing > 1 && r.status === 'open' && <Pill tone="bad">{r.openOnListing} open reports on this listing</Pill>}
        <span className="text-xs text-ink/60">
          {r.reporter ? `@${r.reporter.handle}` : 'Signed out'} · <Ago at={r.createdAt} />
        </span>
      </div>
      {r.listing ? (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/admin/listings/${r.listing.id}`} className="break-words font-semibold text-ink hover:underline">
            {r.listing.title}
          </Link>
          <StatePill state={r.listing.state} />
          {r.listing.state === 'live' && (
            <Link href={`/hackathons/${r.listing.slug}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
              On the site
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          <a href={r.listing.registrationUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-xs font-semibold text-ink/70 hover:underline">
            Registration link
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      ) : (
        <p className="text-sm text-ink/60">The listing “{r.hackathonSlug}” no longer exists.</p>
      )}
      {r.details ? <p className="whitespace-pre-wrap break-words rounded-xl bg-ink/5 p-3 text-sm text-ink/80">{r.details}</p> : <p className="text-sm text-ink/60">No details given.</p>}

      {r.status === 'open' ? (
        <div className="space-y-3">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="What you did about it (optional)" aria-label="Resolution note" />
          {problem && <ErrorNote>{problem}</ErrorNote>}
          <div className="flex flex-wrap gap-2">
            {r.listing && (
              <Link href={`/admin/listings/${r.listing.id}`} className="btn-secondary px-3 py-1.5 text-sm">
                Fix the listing
              </Link>
            )}
            <button type="button" className="btn-primary px-3 py-1.5 text-sm" disabled={Boolean(busy)} onClick={() => act('resolved')}>
              {spin('resolved', Check)}
              Resolved
            </button>
            {r.listing && r.listing.state !== 'removed' && (
              <button
                type="button"
                className="btn-secondary px-3 py-1.5 text-sm"
                disabled={Boolean(busy)}
                onClick={() => {
                  if (window.confirm(`Remove “${r.listing!.title}” from the site and resolve its reports?`)) act('resolved', true);
                }}
              >
                {spin('resolved-remove', Trash2)}
                Resolve and remove listing
              </button>
            )}
            <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={Boolean(busy)} onClick={() => act('dismissed')}>
              {spin('dismissed', X)}
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/60">
          <span>
            {r.status === 'resolved' ? 'Resolved' : 'Dismissed'}
            {r.resolvedBy ? ` by @${r.resolvedBy.handle}` : ''} <Ago at={r.resolvedAt} fallback="" />
            {r.resolutionNote ? `: ${r.resolutionNote}` : ''}
          </span>
          <button type="button" className="inline-flex items-center gap-1 font-semibold text-ink/70 hover:text-ink" disabled={Boolean(busy)} onClick={() => act('open')}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reopen
          </button>
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
    <div className="space-y-5">
      <Tabs
        value={status}
        onChange={(value) => setStatus(value)}
        options={[
          { value: 'open', label: 'Open', count: data?.counts.open },
          { value: 'resolved', label: 'Resolved', count: data?.counts.resolved },
          { value: 'dismissed', label: 'Dismissed', count: data?.counts.dismissed },
          { value: 'all', label: 'All' },
        ]}
      />
      {error && <ErrorNote>{error.message}</ErrorNote>}
      {!data && !error && <p className="text-sm text-ink/60">Loading reports…</p>}
      {data && data.items.length === 0 && (
        <EmptyState title={status === 'open' ? 'No open reports' : 'Nothing here'}>
          Students report wrong details, scams, expired events and broken links from event pages.
        </EmptyState>
      )}
      <ul className="space-y-3">
        {data?.items.map((r) => (
          <ReportCard key={r.id} r={r} onDone={() => mutate()} />
        ))}
      </ul>
    </div>
  );
}
