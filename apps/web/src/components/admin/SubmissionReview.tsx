'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowLeft, Check, ExternalLink, GitMerge, Loader2, X } from 'lucide-react';
import { sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import ListingEditor from './ListingEditor';
import MergePicker from './MergePicker';
import { formToPayload, type Draft, type ListingFormValues } from './listingFields';
import { Ago, ConfidencePill, editorErrors, ErrorNote, Notice, Pill, StatePill, SubmissionStatusPill } from './parts';
import type { ListingRow, SubmissionRow } from './ReviewQueue';

interface Detail {
  submission: SubmissionRow & {
    message: string;
    imageUrls: string[];
    fields: Record<string, unknown>;
    draft: Draft | null;
    reviewedBy: { handle: string; name: string } | null;
    ip: string;
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
  return v === null || v === undefined || v === '' ? '–' : String(v);
}

function Sent({ s }: { s: Detail['submission'] }) {
  const fieldEntries = Object.entries(s.fields ?? {}).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  const images = [s.posterUrl, ...s.imageUrls].filter(Boolean);
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <SubmissionStatusPill status={s.status} />
        <Pill>{s.kind === 'quick' ? 'Quick share' : s.kind === 'organizer' ? 'Organizer form' : 'Browser extension'}</Pill>
        <Pill>{sourceBySlug(s.source)?.name ?? s.source}</Pill>
        {s.seenOn && <Pill>Seen on {s.seenOn}</Pill>}
      </div>
      <dl className="space-y-1 text-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink/60">From</dt>
          <dd className="font-medium text-ink">{s.user ? `${s.user.name} (@${s.user.handle})` : 'Signed out'}</dd>
        </div>
        {s.email && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-ink/60">Email</dt>
            <dd className="break-all font-medium text-ink">{s.email}</dd>
          </div>
        )}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-ink/60">Sent</dt>
          <dd className="text-ink">
            <Ago at={s.createdAt} />
          </dd>
        </div>
      </dl>
      {s.url && (
        <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="flex items-start gap-1.5 break-all text-sm font-medium text-accent hover:underline">
          <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
          {s.url}
        </a>
      )}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images.map((src) => (
            <a key={src} href={src} target="_blank" rel="noopener noreferrer nofollow" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Poster or post image" className="max-h-72 w-full rounded-xl object-contain ring-1 ring-ink/10" loading="lazy" />
            </a>
          ))}
        </div>
      )}
      {s.message && (
        <div>
          <p className="label">{s.kind === 'extension' ? 'Text from the page' : 'Pasted message'}</p>
          <p className="max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-xl bg-ink/5 p-3 text-sm text-ink/80">{s.message}</p>
        </div>
      )}
      {fieldEntries.length > 0 && (
        <div>
          <p className="label">{s.kind === 'organizer' ? 'What the organizer typed' : 'Extra'}</p>
          <dl className="divide-y divide-ink/10 rounded-xl bg-ink/5 px-3 text-sm">
            {fieldEntries.map(([k, v]) => (
              <div key={k} className="grid grid-cols-[120px_1fr] gap-2 py-1.5">
                <dt className="text-ink/60">{FIELD_LABELS[k] ?? k}</dt>
                <dd className="whitespace-pre-wrap break-words text-ink">{show(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {s.draft && (
        <div className="space-y-2">
          <p className="label">What we read</p>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={s.draft.method === 'ai' ? 'brand' : 'neutral'}>
              {s.draft.method === 'ai' ? `AI (${s.draft.model ?? 'model'})` : s.draft.method === 'form' ? 'From the form' : 'Rule-based guess'}
            </Pill>
            <ConfidencePill value={s.draft.confidence} />
            {s.draft.isEvent === false && <Pill tone="bad">Doesn’t look like an event</Pill>}
          </div>
          {s.draft.note && <p className="text-xs text-ink/60">{s.draft.note}</p>}
          {!!s.draft.missing?.length && <p className="text-xs text-ink/70">Missing: {s.draft.missing.join(', ')}</p>}
        </div>
      )}
      {s.ip && <p className="text-xs text-ink/40">IP {s.ip}</p>}
    </div>
  );
}

/** One submission: what was sent on the left, the listing draft to fix up on the right, and approve / merge / reject. */
export default function SubmissionReview({ id }: { id: string }) {
  const { data, error, mutate } = useSWR<Detail>(`/api/admin/submissions/${id}`);
  const [form, setForm] = useState<ListingFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<'' | 'approve' | 'merge' | 'reject'>('');
  const [problem, setProblem] = useState('');
  const [note, setNote] = useState('');
  const [panel, setPanel] = useState<'' | 'merge' | 'reject'>('');
  const [done, setDone] = useState<{ kind: 'approved' | 'merged' | 'rejected'; slug?: string; id?: string } | null>(null);

  useEffect(() => {
    if (data && !form) setForm(data.form);
  }, [data, form]);

  if (error) return <ErrorNote>{error.message}</ErrorNote>;
  if (!data || !form) return <p className="text-sm text-ink/60">Loading the submission…</p>;
  const s = data.submission;
  const open = s.status === 'pending' || s.status === 'processing';

  const act = async (kind: 'approve' | 'merge' | 'reject', body: unknown) => {
    setBusy(kind);
    setProblem('');
    setErrors({});
    try {
      const res = await apiFetch<{ slug?: string; id?: string }>(`/api/admin/submissions/${id}/${kind}`, { body });
      setDone({ kind: kind === 'approve' ? 'approved' : kind === 'merge' ? 'merged' : 'rejected', slug: res?.slug, id: res?.id });
      mutate();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const e = err instanceof ApiClientError ? err : null;
      setErrors(editorErrors(e?.fields));
      setProblem(e?.message ?? 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/review" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to the queue
      </Link>

      {done && (
        <Notice tone="good">
          {done.kind === 'approved' && 'Approved and live. The student has been told.'}
          {done.kind === 'merged' && 'Merged into the existing listing.'}
          {done.kind === 'rejected' && 'Rejected.'}{' '}
          {done.slug && (
            <Link href={`/hackathons/${done.slug}`} className="font-semibold underline">
              See the listing
            </Link>
          )}{' '}
          <Link href="/admin/review" className="font-semibold underline">
            Next in the queue
          </Link>
        </Notice>
      )}

      {!open && !done && (
        <Notice>
          This submission was {s.status}
          {s.reviewedBy ? ` by @${s.reviewedBy.handle}` : ''} <Ago at={s.reviewedAt} fallback="" />.{s.reviewNote ? ` Note: ${s.reviewNote}` : ''}
          {data.hackathon && (
            <>
              {' '}
              <Link href={`/admin/listings/${data.hackathon.id}`} className="font-semibold underline">
                Open “{data.hackathon.title}”
              </Link>{' '}
              <StatePill state={data.hackathon.state} />
            </>
          )}
        </Notice>
      )}

      {s.duplicateOf && open && (
        <Notice tone="warn">
          This link is already listed as “{s.duplicateOf.title}” ({s.duplicateOf.state}). You probably want to merge it so the organizer’s details fill any gaps.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <Sent s={s} />
        </div>

        <div className="min-w-0 space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="mb-5 text-2xl">The listing</h2>
            <ListingEditor value={form} onChange={setForm} errors={errors} />
          </div>

          {open && !done && (
            <div className="card space-y-4 p-5 sm:p-6">
              {problem && <ErrorNote>{problem}</ErrorNote>}
              <div>
                <label htmlFor="review-note" className="label">
                  Note (optional)
                </label>
                <input
                  id="review-note"
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="For the record. On a rejection, the student sees it."
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => act('approve', { listing: formToPayload(form), note })}>
                  {busy === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve and publish
                </button>
                <button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => setPanel(panel === 'merge' ? '' : 'merge')}>
                  <GitMerge className="h-4 w-4" />
                  Merge into a listing
                </button>
                <button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => setPanel(panel === 'reject' ? '' : 'reject')}>
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
              {panel === 'merge' && (
                <div className="rounded-xl border border-ink/10 p-4">
                  <p className="mb-3 text-sm text-ink/70">The shared link becomes one of the listing’s sources, and empty fields there are filled from this submission.</p>
                  <MergePicker
                    initialQuery={s.duplicateOf?.title ?? form.title}
                    busy={busy === 'merge'}
                    onMerge={(target) => {
                      if (window.confirm(`Merge into “${target.title}”?`)) act('merge', { hackathonId: target.id, note });
                    }}
                  />
                </div>
              )}
              {panel === 'reject' && (
                <div className="flex flex-col gap-3 rounded-xl border border-ink/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-ink/70">Not a real event, spam or a duplicate? Add a note above if the student should know why.</p>
                  <button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => act('reject', { note })}>
                    {busy === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
                    Reject this submission
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
