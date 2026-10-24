'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ArrowLeft, Check, GitMerge, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch } from '@/lib/apiClient';
import ListingEditor from './ListingEditor';
import MergePicker from './MergePicker';
import { REMOVE_REASONS } from './hackathonFilters';
import { formToPayload, type ListingFormValues } from './listingFields';
import type { ListingRow, PersonRef, SubmissionRow } from './types';
import { ActionStatus, Ago, Badge, Button, ErrorBox, ExtLink, Loading, num, Panel, StateBadge, Thumb, useAction, useConfirm, When } from './ui';

interface Detail {
  listing: ListingRow & { tagline: string; summary: string; sourceImageUrl: string; submitter: PersonRef | null; removedBy: PersonRef | null };
  form: ListingFormValues;
  last30: { impressions: number; views: number; registerClicks: number };
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
    text: string;
    fetchedAt: string;
  }[];
  submissions: SubmissionRow[];
  reports: { id: string; reason: string; details: string; status: string; createdAt: string }[];
}

/** Turns API field keys ("fields.title") into the editor's keys ("title"). */
const editorErrors = (fields: Record<string, string>) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k.replace(/^(listing|fields)\./, ''), v]));

function Info({ d }: { d: Detail }) {
  const h = d.listing;
  return (
    <div className="space-y-4">
      <Panel>
        <div className="space-y-3">
          <Thumb src={h.imageUrl} className="aspect-[2/1] h-auto w-full" />
          <div className="flex flex-wrap gap-1.5">
            <StateBadge state={h.state} />
            {h.registrationVia === 'qr' && <Badge tone="solid">QR registration</Badge>}
            {h.featured && <Badge>Featured</Badge>}
            {h.verified && <Badge>Verified</Badge>}
            <Badge tone="muted">{Math.round(h.confidence * 100)}% sure</Badge>
          </div>
          {(h.state === 'removed' || h.state === 'rejected') && (
            <p className="text-sm">
              {h.state === 'removed' ? 'Removed' : 'Rejected'}
              {h.removedBy ? ` by @${h.removedBy.handle}` : ''} {h.removedAt && <Ago at={h.removedAt} />}
              {h.removedReason && <span className="block text-neutral-500">Reason: {h.removedReason}</span>}
            </p>
          )}
          <dl className="grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 text-sm">
            <dt className="text-neutral-500">Registration</dt>
            <dd className="min-w-0 break-all">
              <ExtLink href={h.registrationUrl}>{h.registrationUrl}</ExtLink>
              {h.registrationVia === 'qr' && <span className="block text-xs text-neutral-500">Registration by QR code on the poster — {h.title}</span>}
            </dd>
            <dt className="text-neutral-500">Added by</dt>
            <dd>
              {h.submitter ? (
                <Link href={`/admin/users/${h.submitter.id}`} className="underline underline-offset-2">
                  @{h.submitter.handle}
                </Link>
              ) : (
                h.sources.map((s) => sourceBySlug(s)?.name ?? s).join(', ') || 'Unknown'
              )}
            </dd>
            <dt className="text-neutral-500">Added</dt>
            <dd>
              <When at={h.createdAt} />
            </dd>
            <dt className="text-neutral-500">Changed</dt>
            <dd>
              <Ago at={h.updatedAt} />
            </dd>
            <dt className="text-neutral-500">All time</dt>
            <dd>
              {num(h.stats.views)} views · {num(h.stats.saves)} saves · {num(h.stats.registerClicks)} register clicks
            </dd>
            <dt className="text-neutral-500">Last 30 days</dt>
            <dd>
              {num(d.last30.impressions)} impressions · {num(d.last30.views)} views · {num(d.last30.registerClicks)} register clicks
            </dd>
          </dl>
          {h.state === 'live' && (
            <a href={`/hackathons/${h.slug}`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline underline-offset-2">
              View on the site ↗
            </a>
          )}
        </div>
      </Panel>

      {h.flags.length > 0 && (
        <Panel title="Flags and history">
          <ul className="space-y-1 text-sm">
            {h.flags.map((f, i) => (
              <li key={`${f}-${i}`} className="break-words">
                · {f}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Where we found it">
        {h.sourceRefs.length === 0 && <p className="text-sm text-neutral-500">No source links stored.</p>}
        <ul className="space-y-2">
          {h.sourceRefs.map((r) => (
            <li key={`${r.source}-${r.url}`} className="text-sm">
              <span className="font-medium">{sourceBySlug(r.source)?.name ?? r.source}</span>{' '}
              <span className="text-xs text-neutral-500">
                seen <Ago at={r.lastSeenAt} />
              </span>
              <span className="block break-all text-xs">
                <ExtLink href={r.url}>{r.url}</ExtLink>
              </span>
            </li>
          ))}
        </ul>
        {h.sourceImageUrl && (
          <p className="mt-2 break-all text-xs text-neutral-500">
            Original banner: <ExtLink href={h.sourceImageUrl}>{h.sourceImageUrl}</ExtLink>
          </p>
        )}
      </Panel>

      {d.rawItems.length > 0 && (
        <Panel title="What the scraper read">
          <ul className="space-y-3">
            {d.rawItems.map((r) => (
              <li key={r.id} className="border-l-2 border-black pl-3 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{sourceBySlug(r.source)?.name ?? r.source}</span>
                  <Badge tone="muted">{r.status}</Badge>
                  {typeof r.confidence === 'number' && <span className="text-neutral-500">{Math.round(r.confidence * 100)}% sure</span>}
                  <span className="text-neutral-500">
                    <Ago at={r.fetchedAt} />
                  </span>
                </div>
                {r.title && <p className="mt-1 break-words">{r.title}</p>}
                {r.text && <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-neutral-600">{r.text}</p>}
                {r.notes.length > 0 && <p className="mt-1 text-neutral-500">{r.notes.join(' · ')}</p>}
                {r.error && <p className="mt-1 font-semibold">! {r.error}</p>}
                {r.imageUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.imageUrls.slice(0, 4).map((src) => (
                      <a key={src} href={src} target="_blank" rel="noopener noreferrer nofollow">
                        <Thumb src={src} className="h-14 w-14" />
                      </a>
                    ))}
                  </div>
                )}
                <span className="mt-1 block break-all">
                  <ExtLink href={r.url}>{r.url}</ExtLink>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {d.reports.length > 0 && (
        <Panel title="Reports" action={<Link href="/admin/reports" className="text-xs underline underline-offset-2">Handle reports</Link>}>
          <ul className="space-y-2 text-sm">
            {d.reports.map((r) => (
              <li key={r.id}>
                <Badge tone={r.status === 'open' ? 'solid' : 'muted'}>{r.status}</Badge> <span className="font-medium">{r.reason}</span>
                {r.details && <span className="block break-words text-neutral-600">“{r.details}”</span>}
                <span className="text-xs text-neutral-500">
                  <Ago at={r.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {d.submissions.length > 0 && (
        <Panel title="Shared by people">
          <ul className="space-y-2 text-sm">
            {d.submissions.map((s) => (
              <li key={s.id}>
                <Link href={`/admin/review/${s.id}`} className="font-medium hover:underline">
                  {s.title}
                </Link>
                <span className="block text-xs text-neutral-500">
                  {s.user ? `@${s.user.handle}` : s.email || 'Signed out'} · {s.status} · <Ago at={s.createdAt} />
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/** Edit one listing, and keep, remove, restore, reject, merge or delete it. */
export default function HackathonEditor({ id }: { id: string }) {
  const router = useRouter();
  const { data, error, mutate } = useSWR<Detail>(`/api/admin/listings/${id}`);
  const [form, setForm] = useState<ListingFormValues | null>(null);
  const [merging, setMerging] = useState(false);
  const { busy, error: actionError, fields, done, run } = useAction();
  const [dialog, confirm] = useConfirm();

  useEffect(() => {
    if (data && !form) setForm(data.form);
  }, [data, form]);

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (!data || !form) return <Loading>Loading the listing…</Loading>;
  const h = data.listing;

  const patch = async (key: string, body: Record<string, unknown>, message: string) => {
    const ok = await run(key, () => apiFetch(`/api/admin/listings/${id}`, { method: 'PATCH', body }), message);
    if (ok) {
      await mutate();
      setForm(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  const fieldsPayload = () => formToPayload(form);

  const remove = async (state: 'removed' | 'rejected') => {
    const ok = await confirm({
      title: state === 'removed' ? `Remove “${h.title}”?` : `Reject “${h.title}”?`,
      body: state === 'removed' ? 'It disappears from the site straight away. You can restore it later.' : 'It stays off the site. You can restore it later.',
      reason: { label: 'Why', required: true, suggestions: REMOVE_REASONS },
      confirmLabel: state === 'removed' ? 'Remove' : 'Reject',
    });
    if (ok) await patch(state, { state, note: ok.reason }, state === 'removed' ? 'Removed from the site.' : 'Rejected.');
  };

  const destroy = async () => {
    const ok = await confirm({
      title: `Delete “${h.title}” permanently?`,
      body: 'This can’t be undone. Students’ saves of it are deleted too. Removing it instead keeps a copy you can restore.',
      typeToConfirm: 'DELETE',
      confirmLabel: 'Delete permanently',
    });
    if (!ok) return;
    const res = await run('delete', () => apiFetch(`/api/admin/listings/${id}`, { method: 'DELETE', body: { confirm: 'DELETE' } }));
    if (res) router.push('/admin/hackathons');
  };

  return (
    <div className="space-y-4">
      {dialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={h.state === 'pending' ? '/admin/review' : '/admin/hackathons'} className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {h.state === 'pending' ? 'Back to review' : 'All hackathons'}
        </Link>
        <span className="text-xs text-neutral-500">/{h.slug}</span>
      </div>
      <h1 className="break-words text-xl font-semibold">{h.title}</h1>
      <ActionStatus error={actionError} done={done} fields={fields} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <Info d={data} />
        </div>

        <div className="min-w-0 space-y-4">
          <Panel title="Details">
            <ListingEditor value={form} onChange={setForm} errors={editorErrors(fields)} />
          </Panel>

          <Panel title="Decide">
            <div className="flex flex-wrap gap-2">
              {h.state === 'pending' && (
                <Button variant="primary" icon={Check} busy={busy === 'approve'} disabled={Boolean(busy)} onClick={() => patch('approve', { fields: fieldsPayload(), state: 'live' }, 'Kept. It’s live now.')}>
                  Keep and publish
                </Button>
              )}
              {(h.state === 'removed' || h.state === 'rejected') && (
                <Button variant="primary" icon={RotateCcw} busy={busy === 'restore'} disabled={Boolean(busy)} onClick={() => patch('restore', { fields: fieldsPayload(), state: 'live' }, 'Restored. It’s live again.')}>
                  Save and restore
                </Button>
              )}
              <Button variant={h.state === 'live' ? 'primary' : 'secondary'} icon={Save} busy={busy === 'save'} disabled={Boolean(busy)} onClick={() => patch('save', { fields: fieldsPayload() }, 'Saved.')}>
                Save changes
              </Button>
              {h.state === 'live' && (
                <Button icon={X} busy={busy === 'removed'} disabled={Boolean(busy)} onClick={() => remove('removed')}>
                  Remove
                </Button>
              )}
              {h.state === 'pending' && (
                <Button icon={X} busy={busy === 'rejected'} disabled={Boolean(busy)} onClick={() => remove('rejected')}>
                  Reject
                </Button>
              )}
              {h.state !== 'removed' && h.state !== 'rejected' && (
                <Button icon={GitMerge} disabled={Boolean(busy)} onClick={() => setMerging((m) => !m)}>
                  Merge into another
                </Button>
              )}
              <Button icon={Trash2} busy={busy === 'delete'} disabled={Boolean(busy)} onClick={destroy}>
                Delete…
              </Button>
            </div>
            {merging && (
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <p className="mb-3 text-sm text-neutral-600">
                  Use this when it’s the same event as another listing. Its sources move over, empty fields there are filled from this one, and this one is removed. Saves move too.
                </p>
                <MergePicker
                  initialQuery={h.title}
                  excludeId={h.id}
                  busy={busy === 'merge'}
                  onMerge={async (target) => {
                    const ok = await confirm({ title: `Merge into “${target.title}”?`, body: `“${h.title}” will be removed and its sources added to “${target.title}”.`, confirmLabel: 'Merge' });
                    if (!ok) return;
                    const res = await run('merge', () => apiFetch<{ id: string }>(`/api/admin/listings/${id}/merge`, { body: { intoId: target.id } }), `Merged into “${target.title}”.`);
                    if (res) router.push(`/admin/hackathons/${res.id}`);
                  }}
                />
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
