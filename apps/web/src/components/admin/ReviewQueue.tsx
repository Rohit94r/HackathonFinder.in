'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch } from '@/lib/apiClient';
import { formatDate, formatDateRange } from '@/lib/format';
import { REMOVE_REASONS } from './hackathonFilters';
import type { ListingRow, Paged, SubmissionRow } from './types';
import { ActionStatus, Ago, Badge, Button, Empty, ErrorBox, ExtLink, Loading, PageHeader, Pager, SearchInput, Segmented, Table, Td, Th, Thumb, useAction, useConfirm } from './ui';

type Tab = 'listings' | 'submissions' | 'history';

const KIND: Record<SubmissionRow['kind'], string> = { quick: 'Quick share', organizer: 'Organizer form', extension: 'Extension' };

function PendingListings({ rows, onChanged }: { rows: ListingRow[]; onChanged: () => void }) {
  const { busy, error, done, run } = useAction();
  const [dialog, confirm] = useConfirm();
  if (!rows.length) {
    return <Empty title="No pending listings">When the scraper isn’t sure about a hackathon (low confidence, a flag, a lead from Instagram, LinkedIn or web search), it waits here before going live.</Empty>;
  }
  const keep = (h: ListingRow) => run(`live:${h.id}`, () => apiFetch(`/api/admin/listings/${h.id}`, { method: 'PATCH', body: { state: 'live' } }), `Kept “${h.title}”. It’s live now.`).then((r) => r && onChanged());
  const reject = async (h: ListingRow) => {
    const ok = await confirm({ title: `Reject “${h.title}”?`, body: 'It stays off the site. You can restore it later.', reason: { label: 'Why', required: true, suggestions: REMOVE_REASONS }, confirmLabel: 'Reject' });
    if (!ok) return;
    const res = await run(`reject:${h.id}`, () => apiFetch(`/api/admin/listings/${h.id}`, { method: 'PATCH', body: { state: 'rejected', note: ok.reason } }), `Rejected “${h.title}”.`);
    if (res) onChanged();
  };
  return (
    <div className="space-y-3">
      {dialog}
      <ActionStatus error={error} done={done} />
      <Table>
        <thead>
          <tr>
            <Th>Banner</Th>
            <Th>Hackathon</Th>
            <Th>Place and dates</Th>
            <Th>Why it’s waiting</Th>
            <Th>Registration</Th>
            <Th right>Decide</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((h) => (
            <tr key={h.id}>
              <Td>
                <Thumb src={h.imageUrl} className="h-12 w-20" />
              </Td>
              <Td className="min-w-[200px] max-w-[280px]">
                <Link href={`/admin/hackathons/${h.id}`} className="font-medium hover:underline">
                  {h.title}
                </Link>
                {h.organizer && <span className="block text-xs text-neutral-500">{h.organizer}</span>}
                <span className="block text-xs text-neutral-500">
                  {h.sources.map((s) => sourceBySlug(s)?.name ?? s).join(', ')} · found <Ago at={h.createdAt} />
                </span>
              </Td>
              <Td className="whitespace-nowrap text-xs">
                {h.place}
                <span className="block text-neutral-500">{formatDateRange(h.startDate, h.endDate)}</span>
                <span className="block text-neutral-500">Deadline {formatDate(h.registrationDeadline)}</span>
              </Td>
              <Td className="max-w-[260px] text-xs">
                <Badge tone="muted">{Math.round(h.confidence * 100)}% sure</Badge>
                {h.flags.length ? (
                  <ul className="mt-1 space-y-0.5">
                    {h.flags.slice(0, 4).map((f, i) => (
                      <li key={`${f}-${i}`} className="break-words">
                        · {f}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Td>
              <Td className="max-w-[180px] break-all text-xs">
                <ExtLink href={h.registrationUrl}>{h.registrationUrl.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40)}</ExtLink>
                {h.registrationVia === 'qr' && <span className="mt-0.5 block font-medium">Registration by QR code on the poster — {h.title}</span>}
              </Td>
              <Td right>
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="primary" busy={busy === `live:${h.id}`} disabled={Boolean(busy)} onClick={() => keep(h)}>
                    Keep
                  </Button>
                  <Link href={`/admin/hackathons/${h.id}`} className="inline-flex h-7 items-center rounded-[3px] border border-neutral-400 px-2.5 text-xs hover:border-black">
                    Edit
                  </Link>
                  <Button size="sm" busy={busy === `reject:${h.id}`} disabled={Boolean(busy)} onClick={() => reject(h)}>
                    Reject
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function SubmissionTable({ rows, onChanged, quickReject = true }: { rows: SubmissionRow[]; onChanged: () => void; quickReject?: boolean }) {
  const { busy, error, done, run } = useAction();
  const [dialog, confirm] = useConfirm();
  const reject = async (s: SubmissionRow) => {
    const ok = await confirm({ title: `Reject “${s.title}”?`, body: 'The student sees your note in their notifications.', reason: { label: 'Note for them', suggestions: ['Not a hackathon', 'Already listed', 'Registration closed', 'Couldn’t confirm the details'] }, confirmLabel: 'Reject' });
    if (!ok) return;
    const res = await run(`reject:${s.id}`, () => apiFetch(`/api/admin/submissions/${s.id}/reject`, { body: { note: ok.reason } }), `Rejected “${s.title}”.`);
    if (res) onChanged();
  };
  return (
    <div className="space-y-3">
      {dialog}
      <ActionStatus error={error} done={done} />
      <Table>
        <thead>
          <tr>
            <Th>Image</Th>
            <Th>What was shared</Th>
            <Th>From</Th>
            <Th>What we read</Th>
            <Th right>Decide</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const open = s.status === 'pending' || s.status === 'processing';
            return (
              <tr key={s.id}>
                <Td>
                  <Thumb src={s.imageUrl} className="h-12 w-12" />
                </Td>
                <Td className="min-w-[220px] max-w-[320px]">
                  <Link href={`/admin/review/${s.id}`} className="font-medium hover:underline">
                    {s.title}
                  </Link>
                  <span className="mt-0.5 flex flex-wrap gap-1">
                    <Badge tone="muted">{KIND[s.kind]}</Badge>
                    {!open && <Badge>{s.status}</Badge>}
                  </span>
                  {s.url && (
                    <span className="mt-0.5 block break-all text-xs">
                      <ExtLink href={s.url}>{s.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 50)}</ExtLink>
                    </span>
                  )}
                  {s.duplicateOf && <span className="mt-0.5 block text-xs font-medium">Already listed as “{s.duplicateOf.title}” ({s.duplicateOf.state}). Merge it.</span>}
                </Td>
                <Td className="text-xs">
                  {s.user && s.userId ? (
                    <Link href={`/admin/users/${s.userId}`} className="font-medium hover:underline">
                      @{s.user.handle}
                    </Link>
                  ) : (
                    <span>{s.email || 'Signed out'}</span>
                  )}
                  <span className="block text-neutral-500">
                    {sourceBySlug(s.source)?.name ?? s.source}
                    {s.seenOn && s.seenOn !== s.source ? ` · seen on ${s.seenOn}` : ''}
                  </span>
                  <span className="block text-neutral-500">
                    <Ago at={s.createdAt} />
                  </span>
                </Td>
                <Td className="max-w-[220px] text-xs">
                  {s.method ? (s.method === 'ai' ? 'AI read it' : s.method === 'form' ? 'Typed in' : 'Rule-based guess') : 'Not read yet'}
                  {typeof s.confidence === 'number' && ` · ${Math.round(s.confidence * 100)}% sure`}
                  {s.isEvent === false && <span className="block font-medium">Doesn’t look like an event</span>}
                  {s.missing.length > 0 && <span className="block text-neutral-500">Missing: {s.missing.slice(0, 5).join(', ')}</span>}
                  {s.reviewNote && <span className="block text-neutral-500">Note: {s.reviewNote}</span>}
                </Td>
                <Td right>
                  <div className="flex justify-end gap-1.5">
                    <Link href={`/admin/review/${s.id}`} className="inline-flex h-7 items-center rounded-[3px] border border-black bg-black px-2.5 text-xs text-white hover:bg-neutral-800">
                      {open ? 'Review' : 'Open'}
                    </Link>
                    {open && quickReject && (
                      <Button size="sm" busy={busy === `reject:${s.id}`} disabled={Boolean(busy)} onClick={() => reject(s)}>
                        Reject
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

function History() {
  const [status, setStatus] = useState<'reviewed' | 'approved' | 'merged' | 'rejected'>('reviewed');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, mutate } = useSWR<Paged<SubmissionRow>>(`/api/admin/submissions?status=${status}&page=${page}&q=${encodeURIComponent(q)}`, { keepPreviousData: true });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="Decision"
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
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Search title, link or email"
        />
      </div>
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && !data.items.length && <Empty title="Nothing here yet" />}
      {data && data.items.length > 0 && <SubmissionTable rows={data.items} onChanged={() => void mutate()} quickReject={false} />}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}

/** Everything waiting for a person: scraped leads and flagged listings, and what students and organizers shared. */
export default function ReviewQueue() {
  const [tab, setTab] = useState<Tab>('listings');
  const { data, error, isLoading, mutate } = useSWR<{ listings: ListingRow[]; submissions: SubmissionRow[] }>('/api/admin/queue', { refreshInterval: 60_000 });
  return (
    <div className="space-y-4">
      <PageHeader title="Review" description="Approve what’s real, fix what’s wrong, merge duplicates, reject the rest. Oldest first." />
      <Segmented
        label="Queue"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'listings', label: 'Pending listings', count: data?.listings.length },
          { value: 'submissions', label: 'Shared by people', count: data?.submissions.length },
          { value: 'history', label: 'Reviewed' },
        ]}
      />
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && <Loading>Loading the queue…</Loading>}
      {tab === 'listings' && data && <PendingListings rows={data.listings} onChanged={() => void mutate()} />}
      {tab === 'submissions' &&
        data &&
        (data.submissions.length ? (
          <SubmissionTable rows={data.submissions} onChanged={() => void mutate()} />
        ) : (
          <Empty title="Nothing shared is waiting">Quick shares, organizer forms and browser-extension adds land here.</Empty>
        ))}
      {tab === 'history' && <History />}
    </div>
  );
}
