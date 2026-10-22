'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AlertTriangle, ArrowRight, Bot, ClipboardList, ImageOff, Puzzle, Share2 } from 'lucide-react';
import { cityName, sourceBySlug } from '@hackathonfinder/shared';
import { formatDate } from '@/lib/format';
import { Ago, ConfidencePill, EmptyState, ErrorNote, Pager, Pill, SearchBox, StatePill, SubmissionStatusPill, Tabs } from './parts';

export interface SubmissionRow {
  id: string;
  kind: 'quick' | 'organizer' | 'extension';
  status: string;
  title: string;
  url: string;
  seenOn: string;
  source: string;
  posterUrl: string;
  imageUrl: string;
  email: string;
  user: { handle: string; name: string } | null;
  method: 'ai' | 'rules' | 'form' | null;
  confidence: number | null;
  isEvent: boolean | null;
  missing: string[];
  duplicateOf: { id: string; slug: string; title: string; state: string } | null;
  hackathonId: string | null;
  reviewNote: string;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ListingRow {
  id: string;
  slug: string;
  title: string;
  organizer: string;
  state: string;
  mode: string;
  city: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  sources: string[];
  sourceRefs: { source: string; url: string; lastSeenAt: string }[];
  confidence: number;
  flags: string[];
  featured: boolean;
  verified: boolean;
  imageUrl: string;
  registrationUrl: string;
  stats: { views: number; saves: number; registerClicks: number };
  createdAt: string;
  updatedAt: string;
}

const KIND = {
  quick: { label: 'Quick share', icon: Share2 },
  organizer: { label: 'Organizer form', icon: ClipboardList },
  extension: { label: 'Extension', icon: Puzzle },
};

function Thumb({ src }: { src: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover ring-1 ring-ink/10" loading="lazy" />
  ) : (
    <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-ink/40">
      <ImageOff className="h-6 w-6" />
    </span>
  );
}

export function SubmissionCard({ s }: { s: SubmissionRow }) {
  const kind = KIND[s.kind];
  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
      <Thumb src={s.imageUrl} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Pill>
            <kind.icon className="h-3 w-3" />
            {kind.label}
          </Pill>
          {s.status !== 'pending' && <SubmissionStatusPill status={s.status} />}
          {s.method && (
            <Pill tone={s.method === 'ai' ? 'brand' : 'neutral'}>
              <Bot className="h-3 w-3" />
              {s.method === 'ai' ? 'AI read' : s.method === 'form' ? 'Typed in' : 'Rule guess'}
            </Pill>
          )}
          <ConfidencePill value={s.confidence} />
          {s.isEvent === false && <Pill tone="bad">Doesn’t look like an event</Pill>}
        </div>
        <p className="break-words font-semibold text-ink">{s.title}</p>
        <p className="break-all text-xs text-ink/60">
          {sourceBySlug(s.source)?.name ?? s.source}
          {s.seenOn && s.seenOn !== s.source ? ` · seen on ${s.seenOn}` : ''}
          {s.url ? ` · ${s.url}` : ''}
        </p>
        {s.duplicateOf && (
          <p className="flex items-start gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Already listed as “{s.duplicateOf.title}” ({s.duplicateOf.state}). Merge to add these details.
          </p>
        )}
        {s.missing.length > 0 && <p className="text-xs text-ink/60">Missing: {s.missing.slice(0, 6).join(', ')}</p>}
        <p className="text-xs text-ink/60">
          {s.user ? `@${s.user.handle}` : s.email || 'Signed out'} · <Ago at={s.createdAt} />
        </p>
      </div>
      <Link href={`/admin/review/${s.id}`} className="btn-primary shrink-0 px-4 py-2 text-sm">
        {s.status === 'pending' || s.status === 'processing' ? 'Review' : 'Open'}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </li>
  );
}

export function PendingListingCard({ h }: { h: ListingRow }) {
  return (
    <li className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start">
      <Thumb src={h.imageUrl} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <StatePill state={h.state} />
          <ConfidencePill value={h.confidence} />
          {h.sources.map((s) => (
            <Pill key={s}>{sourceBySlug(s)?.name ?? s}</Pill>
          ))}
        </div>
        <p className="break-words font-semibold text-ink">{h.title}</p>
        <p className="text-xs text-ink/60">
          {[h.organizer, h.mode === 'online' ? 'Online' : cityName(h.city), `${formatDate(h.startDate)} · deadline ${formatDate(h.registrationDeadline)}`]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {h.flags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {h.flags.map((f) => (
              <li key={f}>
                <Pill tone="warn">
                  <AlertTriangle className="h-3 w-3" />
                  {f}
                </Pill>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-ink/60">
          Found <Ago at={h.createdAt} />
        </p>
      </div>
      <Link href={`/admin/listings/${h.id}`} className="btn-primary shrink-0 px-4 py-2 text-sm">
        Review
        <ArrowRight className="h-4 w-4" />
      </Link>
    </li>
  );
}

type Tab = 'submissions' | 'pipeline' | 'history';

function History() {
  const [status, setStatus] = useState<'reviewed' | 'approved' | 'merged' | 'rejected'>('reviewed');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, error } = useSWR<{ items: SubmissionRow[]; page: number; pages: number; total: number }>(
    `/api/admin/submissions?status=${status}&page=${page}&q=${encodeURIComponent(q)}`
  );
  const items = data?.items ?? [];
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: 'reviewed', label: 'All reviewed' },
            { value: 'approved', label: 'Approved' },
            { value: 'merged', label: 'Merged' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <SearchBox
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Search title, link or email"
        />
      </div>
      {error && <ErrorNote>{error.message}</ErrorNote>}
      {data && items.length === 0 && <EmptyState title="Nothing here yet" />}
      <ul className="space-y-3">
        {items.map((s) => (
          <SubmissionCard key={s.id} s={s} />
        ))}
      </ul>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}

/** Everything waiting for a person: submissions from students and organizers, and low-confidence listings from the pipeline. */
export default function ReviewQueue() {
  const [tab, setTab] = useState<Tab>('submissions');
  const { data, error, isLoading } = useSWR<{ listings: ListingRow[]; submissions: SubmissionRow[] }>('/api/admin/queue', { refreshInterval: 60_000 });

  return (
    <div className="space-y-6">
      <Tabs
        value={tab}
        onChange={(value) => setTab(value)}
        options={[
          { value: 'submissions', label: 'Submissions', count: data?.submissions.length },
          { value: 'pipeline', label: 'From the pipeline', count: data?.listings.length },
          { value: 'history', label: 'Reviewed' },
        ]}
      />
      {error && <ErrorNote>{error.message}</ErrorNote>}
      {isLoading && <p className="text-sm text-ink/60">Loading the queue…</p>}

      {tab === 'submissions' && data && (
        data.submissions.length ? (
          <ul className="space-y-3">
            {data.submissions.map((s) => (
              <SubmissionCard key={s.id} s={s} />
            ))}
          </ul>
        ) : (
          <EmptyState title="No submissions waiting">New quick shares, organizer forms and extension adds land here, oldest first.</EmptyState>
        )
      )}

      {tab === 'pipeline' && data && (
        data.listings.length ? (
          <ul className="space-y-3">
            {data.listings.map((h) => (
              <PendingListingCard key={h.id} h={h} />
            ))}
          </ul>
        ) : (
          <EmptyState title="No pending listings">
            When the agents aren’t sure about a listing (low confidence or a flag from the Verifier), it waits here before going live.
          </EmptyState>
        )
      )}

      {tab === 'history' && <History />}
    </div>
  );
}
