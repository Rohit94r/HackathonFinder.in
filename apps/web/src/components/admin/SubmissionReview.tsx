'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, Check, GitMerge, X } from 'lucide-react';
import { sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch } from '@/lib/apiClient';
import ListingEditor from './ListingEditor';
import MergePicker from './MergePicker';
import { formToPayload, type Draft, type ListingFormValues } from './listingFields';
import type { ListingRow, SubmissionRow } from './types';
import { ActionStatus, Ago, Badge, Button, ErrorBox, ExtLink, inputClass, labelClass, Loading, Notice, Panel, StateBadge, Thumb, useAction, useConfirm } from './ui';

interface Detail {
  submission: SubmissionRow & {
    message: string;
    imageUrls: string[];
    fields: Record<string, unknown>;
    draft: Draft | null;
    reviewedBy: { handle: string; name: string } | null;
  };
  form: ListingFormValues;
  hackathon: ListingRow | null;
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Event name',
  organizer: 'Organizer',
  type: 'Type',
  mode: 'Mode',
  city: 'City',
  cityName: 'City name',
  venue: 'Venue',
  start: 'Start',
  end: 'End',
  deadline: 'Deadline',
  teamMin: 'Min team',
  teamMax: 'Max team',
  fee: 'Fee (₹)',
  prize: 'Prize',
  eligibility: 'Eligibility',
  themes: 'Themes',
  url: 'Registration link',
  description: 'Description',
  isOrganizer: 'Organizer themselves',
  note: 'Note from the student',
};

function show(v: unknown): string {
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v && typeof v === 'object') return JSON.stringify(v);
  return v === null || v === undefined || v === '' ? '–' : String(v);
}

const editorErrors = (fields: Record<string, string>) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k.replace(/^(listing|fields)\./, ''), v]));

function Sent({ s }: { s: Detail['submission'] }) {
  const fieldEntries = Object.entries(s.fields ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  const images = [...new Set([s.posterUrl, ...s.imageUrls].filter(Boolean))];
  return (
    <Panel title="What was sent">
      <div className="space-y-3 text-sm">
        <div className="flex flex-wrap gap-1.5">
          <Badge>{s.status}</Badge>
          <Badge tone="muted">{s.kind === 'quick' ? 'Quick share' : s.kind === 'organizer' ? 'Organizer form' : 'Browser extension'}</Badge>
          <Badge tone="muted">{sourceBySlug(s.source)?.name ?? s.source}</Badge>
          {s.seenOn && <Badge tone="muted">Seen on {s.seenOn}</Badge>}
        </div>
        <dl className="grid grid-cols-[70px_1fr] gap-x-2 gap-y-1">
          <dt className="text-neutral-500">From</dt>
          <dd>
            {s.user && s.userId ? (
              <Link href={`/admin/users/${s.userId}`} className="underline underline-offset-2">
                {s.user.name} (@{s.user.handle})
              </Link>
            ) : (
              'Signed out'
            )}
          </dd>
          {s.email && (
            <>
              <dt className="text-neutral-500">Email</dt>
              <dd className="break-all">{s.email}</dd>
            </>
          )}
          <dt className="text-neutral-500">Sent</dt>
          <dd>
            <Ago at={s.createdAt} />
          </dd>
        </dl>
        {s.url && (
          <p className="break-all">
            <ExtLink href={s.url}>{s.url}</ExtLink>
          </p>
        )}
        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer nofollow" className="block">
                <Thumb src={src} className="h-40 w-full object-contain" alt="Poster or post image" />
              </a>
            ))}
          </div>
        )}
        {s.message && (
          <div>
            <p className={labelClass}>{s.kind === 'extension' ? 'Text from the page' : 'Pasted message'}</p>
            <p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words border border-neutral-300 p-2 text-sm">{s.message}</p>
          </div>
        )}
        {fieldEntries.length > 0 && (
          <div>
            <p className={labelClass}>{s.kind === 'organizer' ? 'What the organizer typed' : 'Extra'}</p>
            <dl className="divide-y divide-neutral-200 border border-neutral-300 px-2">
              {fieldEntries.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-2 py-1">
                  <dt className="text-neutral-500">{FIELD_LABELS[k] ?? k}</dt>
                  <dd className="whitespace-pre-wrap break-words">{show(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {s.draft && (
          <div className="space-y-1">
            <p className={labelClass}>What we read</p>
            <p>
              {s.draft.method === 'ai' ? `AI (${s.draft.model ?? 'model'})` : s.draft.method === 'form' ? 'From the form' : 'Rule-based guess'}
              {typeof s.draft.confidence === 'number' && ` · ${Math.round(s.draft.confidence * 100)}% sure`}
              {s.draft.isEvent === false && ' · doesn’t look like an event'}
            </p>
            {s.draft.note && <p className="text-xs text-neutral-500">{s.draft.note}</p>}
            {!!s.draft.missing?.length && <p className="text-xs text-neutral-500">Missing: {s.draft.missing.join(', ')}</p>}
          </div>
        )}
      </div>
    </Panel>
  );
}

/** One submission: what was sent on the left, the listing draft to fix up on the right, then approve / merge / reject. */
export default function SubmissionReview({ id }: { id: string }) {
  const { data, error, mutate } = useSWR<Detail>(`/api/admin/submissions/${id}`);
  const [form, setForm] = useState<ListingFormValues | null>(null);
  const [note, setNote] = useState('');
  const [merging, setMerging] = useState(false);
  const [result, setResult] = useState<{ kind: 'approved' | 'merged' | 'rejected'; slug?: string; id?: string } | null>(null);
  const { busy, error: actionError, fields, run } = useAction();
  const [dialog, confirm] = useConfirm();

  useEffect(() => {
    if (data && !form) setForm(data.form);
  }, [data, form]);

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (!data || !form) return <Loading>Loading the submission…</Loading>;
  const s = data.submission;
  const open = s.status === 'pending' || s.status === 'processing';

  const act = async (kind: 'approve' | 'merge' | 'reject', body: unknown) => {
    const res = await run(kind, () => apiFetch<{ slug?: string; id?: string }>(`/api/admin/submissions/${id}/${kind}`, { body }));
    if (res !== undefined) {
      setResult({ kind: kind === 'approve' ? 'approved' : kind === 'merge' ? 'merged' : 'rejected', slug: res?.slug, id: res?.id });
      void mutate();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-4">
      {dialog}
      <Link href="/admin/review" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to review
      </Link>
      <h1 className="break-words text-xl font-semibold">{s.title}</h1>

      {result && (
        <Notice done>
          {result.kind === 'approved' && 'Approved and live. The student has been told. '}
          {result.kind === 'merged' && 'Merged into the existing listing. '}
          {result.kind === 'rejected' && 'Rejected. '}
          {result.id && (
            <Link href={`/admin/hackathons/${result.id}`} className="font-medium underline">
              Open the listing
            </Link>
          )}{' '}
          <Link href="/admin/review" className="font-medium underline">
            Next in the queue
          </Link>
        </Notice>
      )}
      {!open && !result && (
        <Notice>
          This submission was {s.status}
          {s.reviewedBy ? ` by @${s.reviewedBy.handle}` : ''} <Ago at={s.reviewedAt} fallback="" />.{s.reviewNote ? ` Note: ${s.reviewNote}` : ''}
          {data.hackathon && (
            <>
              {' '}
              <Link href={`/admin/hackathons/${data.hackathon.id}`} className="font-medium underline">
                Open “{data.hackathon.title}”
              </Link>{' '}
              <StateBadge state={data.hackathon.state} />
            </>
          )}
        </Notice>
      )}
      {s.duplicateOf && open && <Notice>This link is already listed as “{s.duplicateOf.title}” ({s.duplicateOf.state}). You probably want to merge it so these details fill any gaps.</Notice>}
      <ActionStatus error={actionError} done="" fields={fields} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <Sent s={s} />
        </div>
        <div className="min-w-0 space-y-4">
          <Panel title="The listing">
            <ListingEditor value={form} onChange={setForm} errors={editorErrors(fields)} />
          </Panel>
          {open && !result && (
            <Panel title="Decide">
              <div className="space-y-3">
                <div>
                  <label htmlFor="review-note" className={labelClass}>
                    Note (optional)
                  </label>
                  <input id="review-note" className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="For the record. On a rejection, the student sees it." />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary" icon={Check} busy={busy === 'approve'} disabled={Boolean(busy)} onClick={() => act('approve', { listing: formToPayload(form), note })}>
                    Approve and publish
                  </Button>
                  <Button icon={GitMerge} disabled={Boolean(busy)} onClick={() => setMerging((m) => !m)}>
                    Merge into a listing
                  </Button>
                  <Button
                    icon={X}
                    busy={busy === 'reject'}
                    disabled={Boolean(busy)}
                    onClick={async () => {
                      const ok = await confirm({ title: 'Reject this submission?', body: note ? `The student sees: “${note}”.` : 'Add a note above if the student should know why.', confirmLabel: 'Reject' });
                      if (ok) await act('reject', { note });
                    }}
                  >
                    Reject
                  </Button>
                </div>
                {merging && (
                  <div className="border-t border-neutral-200 pt-3">
                    <p className="mb-3 text-sm text-neutral-600">The shared link becomes one of the listing’s sources, and empty fields there are filled from this submission.</p>
                    <MergePicker
                      initialQuery={s.duplicateOf?.title ?? form.title}
                      busy={busy === 'merge'}
                      onMerge={async (target) => {
                        const ok = await confirm({ title: `Merge into “${target.title}”?`, confirmLabel: 'Merge' });
                        if (ok) await act('merge', { hackathonId: target.id, note });
                      }}
                    />
                  </div>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
