'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { RefreshCw } from 'lucide-react';
import { sourceBySlug } from '@hackathonfinder/shared';
import { apiFetch } from '@/lib/apiClient';
import { Progress } from './charts';
import { REMOVE_REASONS } from './hackathonFilters';
import type { ScrapeItem, ScrapeItemAction, ScrapeRunDetail, ScrapeStatus } from './types';
import { ActionStatus, Ago, Badge, Button, duration, Empty, ErrorBox, ExtLink, Loading, num, Panel, Segmented, StateBadge, Thumb, useAction, useConfirm } from './ui';

export const isActive = (s: ScrapeStatus | undefined) => s === 'queued' || s === 'running';

const ACTION_LABEL: Record<ScrapeItemAction, string> = {
  created: 'Added',
  updated: 'Updated',
  merged: 'Merged',
  review: 'To review',
  rejected: 'Rejected',
  error: 'Error',
};

/** The latest lines of the run log, shown under the progress bar while a scan is running. */
function LiveActivity({ run }: { run: ScrapeRunDetail }) {
  const ref = useRef<HTMLPreElement>(null);
  const lines = run.log.slice(-20);
  const latest = run.log[run.log.length - 1];
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [latest]);
  const latestError = run.errorLog[run.errorLog.length - 1];
  const total = run.progress.total;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="min-w-0 break-words font-medium">{run.progress.current || 'Starting…'}</span>
        <span className="shrink-0 text-xs tabular-nums text-neutral-500">
          {total > 0 ? `${num(run.progress.done)} of ${num(total)} candidates` : 'Finding candidates…'}
        </span>
      </div>
      <pre
        ref={ref}
        aria-live="polite"
        className="max-h-64 overflow-auto whitespace-pre-wrap break-words border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] leading-relaxed"
      >
        {lines.length ? lines.join('\n') : 'Waiting for the first step…'}
      </pre>
      {latestError && <p className="break-words border-l-2 border-black pl-2 text-xs">Latest warning: {latestError}</p>}
      {lines.length > 0 && <p className="text-[11px] text-neutral-500">Showing the latest {lines.length} log lines. Open Details for the full log.</p>}
    </div>
  );
}

type Filter = 'all' | 'created' | 'updated' | 'review' | 'rejected' | 'error';

/** Who started a run: the schedule, the API, or the admin's handle ("unknown admin" once that account is gone). */
export function startedByLabel(by: string | null | undefined, trigger: string): string {
  if (trigger === 'schedule') return 'schedule';
  if (trigger === 'api') return 'API';
  if (!by || typeof by !== 'string' || /^[a-f0-9]{24}$/i.test(by)) return 'unknown admin';
  return `@${by.replace(/^@/, '')}`;
}

function ItemRow({ item, onChanged }: { item: ScrapeItem; onChanged: () => void }) {
  const { busy, error, run } = useAction();
  const [dialog, confirm] = useConfirm();
  const l = item.listing;
  const title = l?.title || item.title || 'Untitled';
  const qr = l?.registrationVia === 'qr';
  const set = async (state: 'live' | 'removed') => {
    if (!l) return;
    let note = '';
    if (state === 'removed') {
      const ok = await confirm({ title: `Remove “${title}”?`, body: 'It disappears from the site straight away. You can restore it later.', reason: { label: 'Why', required: true, suggestions: REMOVE_REASONS }, confirmLabel: 'Remove' });
      if (!ok) return;
      note = ok.reason;
    }
    const res = await run(state, () => apiFetch(`/api/admin/listings/${l.id}`, { method: 'PATCH', body: { state, note } }));
    if (res) onChanged();
  };

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-start">
      {dialog}
      <Thumb src={l?.imageUrl || item.imageUrl} className="h-16 w-28" />
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={item.action === 'created' ? 'solid' : item.action === 'error' || item.action === 'rejected' ? 'muted' : 'outline'}>{ACTION_LABEL[item.action]}</Badge>
          {l && <StateBadge state={l.state} />}
          {qr && <Badge tone="solid">QR</Badge>}
          <span className="text-xs text-neutral-500">{sourceBySlug(item.source)?.name ?? item.source}</span>
        </div>
        <p className="break-words font-medium">
          {l ? (
            <Link href={`/admin/hackathons/${l.id}`} className="hover:underline">
              {title}
            </Link>
          ) : (
            title
          )}
        </p>
        <p className="text-xs text-neutral-600">{l?.place || item.place || (item.mode === 'online' ? 'Online' : '')}</p>
        {l?.registrationUrl ? (
          <p className="break-all text-xs">
            Register: <ExtLink href={l.registrationUrl}>{l.registrationUrl}</ExtLink>
          </p>
        ) : null}
        {qr && <p className="text-xs font-medium">Registration by QR code on the poster — {title}</p>}
        {item.reason && <p className="text-xs text-neutral-500">{item.reason}</p>}
        {item.url && (
          <p className="break-all text-xs text-neutral-500">
            Found at <ExtLink href={item.url}>{item.url}</ExtLink>
          </p>
        )}
        {error && <ActionStatus error={error} done="" />}
      </div>
      {l && (
        <div className="flex shrink-0 gap-1.5">
          {l.state !== 'live' && (
            <Button size="sm" variant="primary" busy={busy === 'live'} disabled={Boolean(busy)} onClick={() => set('live')}>
              Keep
            </Button>
          )}
          {l.state !== 'removed' && (
            <Button size="sm" busy={busy === 'removed'} disabled={Boolean(busy)} onClick={() => set('removed')}>
              Remove
            </Button>
          )}
          <Link href={`/admin/hackathons/${l.id}`} className="inline-flex h-7 items-center rounded-[3px] border border-neutral-400 px-2.5 text-xs hover:border-black">
            Edit
          </Link>
        </div>
      )}
    </li>
  );
}

/** One scrape run: live progress while it runs (polled every 2 seconds), then everything it found. */
export default function ScrapeRun({ id, showLogs = false }: { id: string; showLogs?: boolean }) {
  const [filter, setFilter] = useState<Filter>('all');
  const { data, error, mutate, isValidating } = useSWR<{ run: ScrapeRunDetail }>(`/api/admin/scrape/${id}`, {
    refreshInterval: (latest) => (latest && isActive(latest.run.status) ? 2000 : 0),
  });
  const run = data?.run;
  const deep = Boolean(run && run.sources.length === 1 && run.sources[0] === 'web');
  const items = useMemo(() => run?.items ?? [], [run]);
  const count = (f: Filter) => (f === 'all' ? items.length : f === 'updated' ? items.filter((i) => i.action === 'updated' || i.action === 'merged').length : items.filter((i) => i.action === f).length);
  const shown = filter === 'all' ? items : items.filter((i) => (filter === 'updated' ? i.action === 'updated' || i.action === 'merged' : i.action === filter));
  // Newest additions first: what the admin most wants to check.
  const ordered = [...shown].reverse();

  if (error && !run) {
    return (
      <div className="space-y-2">
        <ErrorBox>{error.message}</ErrorBox>
        <Button size="sm" icon={RefreshCw} busy={isValidating} onClick={() => void mutate()}>
          Check again
        </Button>
      </div>
    );
  }
  if (!run) return <Loading>Loading the run…</Loading>;
  const active = isActive(run.status);
  const started = new Date(run.startedAt).getTime();
  const took = run.finishedAt ? new Date(run.finishedAt).getTime() - started : Date.now() - started;
  const current = run.progress.current || '';
  const currentLabel = !current || current === 'Starting…' ? 'Starting…' : current.includes(':') ? current : `Checking ${sourceBySlug(current)?.name ?? current}…`;
  const c = run.counts;

  return (
    <div className="space-y-4">
      <Panel
        title={
          <span className="flex flex-wrap items-center gap-2">
            {active ? (deep ? 'Deep scan running' : 'Scraping now') : deep ? 'Deep scan' : 'Scrape run'}{' '}
            <Badge tone={active ? 'solid' : 'outline'}>{run.status}</Badge>
          </span>
        }
        action={
          <span className="text-xs text-neutral-500">
            Started <Ago at={run.startedAt} /> by {startedByLabel(run.startedBy, run.trigger)}
            {active ? ` · running ${duration(took)}` : ` · took ${duration(took)}`}
          </span>
        }
      >
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span>{active ? currentLabel : 'Finished'}</span>
              <span className="tabular-nums text-neutral-500">
                {run.progress.total > 0 ? `${num(run.progress.done)} of ${num(run.progress.total)} candidates` : active ? 'Finding candidates…' : '0 candidates'}
              </span>
            </div>
            <Progress done={active ? run.progress.done : Math.max(run.progress.done, run.progress.total)} total={run.progress.total || 1} label="Candidates processed" />
          </div>
          <dl className="grid grid-cols-4 gap-2 text-center sm:grid-cols-8">
            {(
              [
                ['Found', c.found],
                ['New', c.new],
                ['Added', c.created],
                ['Updated', c.updated],
                ['Merged', c.merged],
                ['To review', c.review],
                ['Rejected', c.rejected],
                ['Errors', c.errors],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="border border-neutral-300 px-1 py-1.5">
                <dt className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</dt>
                <dd className="text-lg font-semibold tabular-nums">{num(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Panel>

      {active && !showLogs && (
        <Panel
          title="Live activity"
          action={
            <span className="text-xs text-neutral-500">
              Updates every 2s ·{' '}
              <Link href={`/admin/scraper/${run.id}`} className="underline underline-offset-2">
                full log
              </Link>
            </span>
          }
        >
          <LiveActivity run={run} />
        </Panel>
      )}

      <Panel
        title="What it found"
        action={
          <Segmented
            label="Show"
            value={filter}
            onChange={setFilter}
            options={(['all', 'created', 'updated', 'review', 'rejected', 'error'] as Filter[]).map((f) => ({
              value: f,
              label: f === 'all' ? 'All' : f === 'updated' ? 'Updated' : ACTION_LABEL[f as ScrapeItemAction],
              count: count(f),
            }))}
          />
        }
      >
        {ordered.length ? (
          <ul className="-my-3 divide-y divide-neutral-200">
            {ordered.map((item, i) => (
              <ItemRow key={`${item.source}-${item.url}-${i}`} item={item} onChanged={() => void mutate()} />
            ))}
          </ul>
        ) : (
          <Empty title={active ? 'Nothing yet' : 'Nothing here'}>{active ? 'New and updated hackathons show up here as each source is checked.' : 'This run didn’t produce anything in this group.'}</Empty>
        )}
      </Panel>

      {(showLogs || run.errorLog.length > 0) && (
        <Panel title={`Errors (${run.errorLog.length})`}>
          {run.errorLog.length ? (
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs">{run.errorLog.join('\n')}</pre>
          ) : (
            <p className="text-sm text-neutral-500">No errors.</p>
          )}
        </Panel>
      )}
      {showLogs && (
        <Panel title="Log">
          {run.log.length ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words font-mono text-xs">{run.log.join('\n')}</pre> : <p className="text-sm text-neutral-500">No log lines.</p>}
        </Panel>
      )}
    </div>
  );
}
