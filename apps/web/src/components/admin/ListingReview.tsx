'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AlertTriangle, ArrowLeft, Check, ExternalLink, GitMerge, Loader2, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import ListingEditor from './ListingEditor';
import MergePicker from './MergePicker';
import { formToPayload, type ListingFormValues } from './listingFields';
import { Ago, ConfidencePill, editorErrors, ErrorNote, Notice, Pill, StatePill } from './parts';
import { SubmissionCard, type ListingRow, type SubmissionRow } from './ReviewQueue';

interface Detail {
  listing: ListingRow & { tagline: string; summary: string; submittedBy: string | null };
  form: ListingFormValues;
  rawItems: {
    id: string;
    source: string;
    url: string;
    title: string;
    status: string;
    confidence: number | null;
    notes: string[];
    imageUrls: string[];
    error: string;
    fetchedAt: string;
  }[];
  submissions: SubmissionRow[];
  reports: { id: string; reason: string; details: string; status: string; createdAt: string }[];
}

type Action = 'save' | 'approve' | 'reject' | 'remove' | 'restore' | 'merge';

function Where({ d }: { d: Detail }) {
  const h = d.listing;
  return (
    <div className="card space-y-5 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatePill state={h.state} />
        <ConfidencePill value={h.confidence} />
        {h.verified && <Pill tone="good">Verified</Pill>}
        {h.featured && <Pill tone="brand">Featured</Pill>}
      </div>
      {h.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={h.imageUrl} alt="" className="max-h-60 w-full rounded-xl object-cover ring-1 ring-ink/10" />
      )}
      {h.flags.length > 0 && (
        <div>
          <p className="label">Flags</p>
          <ul className="space-y-1.5">
            {h.flags.map((f) => (
              <li key={f} className="flex items-start gap-1.5 text-sm text-amber-800 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="label">Where we found it</p>
        {h.sourceRefs.length === 0 && <p className="text-sm text-ink/60">No source links stored.</p>}
        <ul className="space-y-2">
          {h.sourceRefs.map((r) => (
            <li key={`${r.source}-${r.url}`} className="text-sm">
              <span className="font-semibold text-ink">{sourceBySlug(r.source)?.name ?? r.source}</span>{' '}
              <span className="text-xs text-ink/60">
                seen <Ago at={r.lastSeenAt} />
              </span>
              <a href={r.url.startsWith('http') ? r.url : undefined} target="_blank" rel="noopener noreferrer nofollow" className="mt-0.5 flex items-start gap-1 break-all text-xs text-accent hover:underline">
                <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                {r.url}
              </a>
            </li>
          ))}
        </ul>
      </div>
      {d.rawItems.length > 0 && (
        <div>
          <p className="label">What the Scout read</p>
          <ul className="space-y-2">
            {d.rawItems.map((r) => (
              <li key={r.id} className="rounded-xl bg-ink/5 p-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{sourceBySlug(r.source)?.name ?? r.source}</span>
                  <Pill>{r.status}</Pill>
                  <ConfidencePill value={r.confidence} />
                </div>
                {r.title && <p className="mt-1 break-words text-ink/80">{r.title}</p>}
                {r.notes.length > 0 && <p className="mt-1 text-ink/60">{r.notes.join(' · ')}</p>}
                {r.error && <p className="mt-1 text-red-700 dark:text-red-300">{r.error}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {d.reports.length > 0 && (
        <div>
          <p className="label">Reports</p>
          <ul className="space-y-1.5 text-sm">
            {d.reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2">
                <Pill tone={r.status === 'open' ? 'warn' : 'neutral'}>{r.status}</Pill>
                <span className="text-ink">{r.reason}</span>
                {r.details && <span className="break-words text-ink/60">“{r.details}”</span>}
              </li>
            ))}
          </ul>
          <Link href="/admin/reports" className="mt-2 inline-block text-xs font-semibold text-accent hover:underline">
            Handle reports
          </Link>
        </div>
      )}
      <p className="text-xs text-ink/60">
        {h.stats.views} views · {h.stats.saves} saves · {h.stats.registerClicks} register clicks · updated <Ago at={h.updatedAt} />
      </p>
    </div>
  );
}

/** Edit one listing, and approve, reject, remove, restore or merge it. */
export default function ListingReview({ id }: { id: string }) {
  const { data, error, mutate } = useSWR<Detail>(`/api/admin/listings/${id}`);
  const [form, setForm] = useState<ListingFormValues | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Action | ''>('');
  const [problem, setProblem] = useState('');
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    if (data && !form) setForm(data.form);
  }, [data, form]);

  if (error) return <ErrorNote>{error.message}</ErrorNote>;
  if (!data || !form) return <p className="text-sm text-ink/60">Loading the listing…</p>;
  const h = data.listing;

  const run = async (action: Action, request: () => Promise<unknown>, done: string) => {
    setBusy(action);
    setProblem('');
    setMessage('');
    setErrors({});
    try {
      await request();
      setMessage(done);
      await mutate();
      setForm(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const e = err instanceof ApiClientError ? err : null;
      setErrors(editorErrors(e?.fields));
      setProblem(e?.message ?? 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  const patch = (body: Record<string, unknown>) => apiFetch(`/api/admin/listings/${id}`, { method: 'PATCH', body });
  const fields = () => formToPayload(form);
  const spinner = (a: Action) => busy === a && <Loader2 className="h-4 w-4 animate-spin" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={h.state === 'pending' ? '/admin/review' : '/admin/listings'} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          {h.state === 'pending' ? 'Back to the queue' : 'All listings'}
        </Link>
        {h.state === 'live' && (
          <Link href={`/hackathons/${h.slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
            View on the site
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      {message && <Notice tone="good">{message}</Notice>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Where d={data} />
        </div>

        <div className="min-w-0 space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="mb-1 break-words text-2xl">{h.title}</h2>
            <p className="mb-5 break-all text-xs text-ink/60">/{h.slug}</p>
            <ListingEditor value={form} onChange={setForm} errors={errors} />
          </div>

          <div className="card space-y-4 p-5 sm:p-6">
            {problem && <ErrorNote>{problem}</ErrorNote>}
            <div>
              <label htmlFor="listing-note" className="label">
                Note (optional)
              </label>
              <input id="listing-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Kept in the listing’s flags when you reject or remove it" />
            </div>
            <div className="flex flex-wrap gap-3">
              {h.state === 'pending' && (
                <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => run('approve', () => patch({ fields: fields(), state: 'live', note }), 'Approved. It’s live now.')}>
                  {spinner('approve') || <Check className="h-4 w-4" />}
                  Approve and publish
                </button>
              )}
              {(h.state === 'removed' || h.state === 'rejected') && (
                <button type="button" className="btn-primary" disabled={Boolean(busy)} onClick={() => run('restore', () => patch({ fields: fields(), state: 'live', note }), 'Restored. It’s live again.')}>
                  {spinner('restore') || <RotateCcw className="h-4 w-4" />}
                  Restore
                </button>
              )}
              <button
                type="button"
                className={h.state === 'live' ? 'btn-primary' : 'btn-secondary'}
                disabled={Boolean(busy)}
                onClick={() => run('save', () => patch({ fields: fields() }), 'Saved.')}
              >
                {spinner('save') || <Save className="h-4 w-4" />}
                Save changes
              </button>
              {h.state !== 'removed' && h.state !== 'rejected' && (
                <button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => setMerging((m) => !m)}>
                  <GitMerge className="h-4 w-4" />
                  Merge into another
                </button>
              )}
              {h.state === 'pending' && (
                <button type="button" className="btn-secondary" disabled={Boolean(busy)} onClick={() => run('reject', () => patch({ state: 'rejected', note }), 'Rejected.')}>
                  {spinner('reject') || <X className="h-4 w-4" />}
                  Reject
                </button>
              )}
              {h.state === 'live' && (
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (window.confirm('Take this listing off the site? You can restore it later.')) run('remove', () => patch({ state: 'removed', note }), 'Removed from the site.');
                  }}
                >
                  {spinner('remove') || <Trash2 className="h-4 w-4" />}
                  Remove
                </button>
              )}
            </div>
            {merging && (
              <div className="rounded-xl border border-ink/10 p-4">
                <p className="mb-3 text-sm text-ink/70">
                  Use this when it’s the same event as another listing. Its sources move over, empty fields there are filled from this one, and this one is removed. Saves move too.
                </p>
                <MergePicker
                  initialQuery={h.title}
                  excludeId={h.id}
                  busy={busy === 'merge'}
                  onMerge={(target) => {
                    if (!window.confirm(`Merge “${h.title}” into “${target.title}”?`)) return;
                    run('merge', () => apiFetch(`/api/admin/listings/${id}/merge`, { body: { intoId: target.id } }), `Merged into “${target.title}”.`);
                    setMerging(false);
                  }}
                />
              </div>
            )}
          </div>

          {data.submissions.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl">Submissions for this listing</h2>
              <ul className="space-y-3">
                {data.submissions.map((s) => (
                  <SubmissionCard key={s.id} s={s} />
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
