'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Play, Save, Terminal } from 'lucide-react';
import { SOURCE_KIND_LABELS, type SourceKind } from '@hackathonfinder/shared';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { cronProblem, SCHEDULE_PRESETS } from './cron';
import { Ago, EmptyState, ErrorNote, HealthPill, Notice, Pill, RunStatusPill, Tabs, When } from './parts';

interface SourceRow {
  id: string;
  slug: string;
  name: string;
  kind: SourceKind;
  enabled: boolean;
  schedule: string;
  health: string;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string;
  lastItemCount: number | null;
  consecutiveFailures: number;
  queued: boolean;
}

interface RunRow {
  id: string;
  agent: string;
  source: string;
  sourceName: string;
  status: string;
  trigger: string;
  startedAt: string;
  finishedAt: string | null;
  counts: Record<string, number> | null;
  errorLog: string[];
  log: string[];
}

function SourceCard({ s, onChanged }: { s: SourceRow; onChanged: () => void }) {
  const [schedule, setSchedule] = useState(s.schedule);
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');
  const [queuedNow, setQueuedNow] = useState('');
  const scheduleProblem = schedule.trim() === s.schedule ? null : cronProblem(schedule);

  const call = async (what: string, path: string, method: 'PATCH' | 'POST', body?: unknown) => {
    setBusy(what);
    setProblem('');
    try {
      const res = await apiFetch<{ alreadyQueued?: boolean }>(path, { method, body: body ?? {} });
      if (what === 'run') setQueuedNow(res?.alreadyQueued ? 'Already queued.' : 'Queued. The scheduler picks it up on its next check.');
      onChanged();
    } catch (err) {
      const e = err instanceof ApiClientError ? err : null;
      setProblem(e?.fields?.schedule ?? e?.message ?? 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <li className={cn('card space-y-3 p-4', !s.enabled && 'opacity-75')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{s.name}</p>
            <HealthPill health={s.health} />
            {!s.enabled && <Pill>off</Pill>}
            {s.queued && <Pill tone="brand">run queued</Pill>}
          </div>
          <p className="break-all text-xs text-ink/60">
            {s.slug} · {SOURCE_KIND_LABELS[s.kind] ?? s.kind}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={s.enabled}
              disabled={busy === 'enabled'}
              onChange={(e) => call('enabled', `/api/admin/sources/${s.id}`, 'PATCH', { enabled: e.target.checked })}
              className="h-4 w-4 accent-brand-600"
            />
            On
          </label>
          <button type="button" className="btn-secondary px-3 py-1.5 text-sm" disabled={Boolean(busy) || s.queued} onClick={() => call('run', `/api/admin/sources/${s.id}/run`, 'POST')}>
            {busy === 'run' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {s.queued ? 'Queued' : 'Run now'}
          </button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <div>
          <dt className="text-ink/60">Last run</dt>
          <dd className="text-ink">
            <Ago at={s.lastRunAt} />
          </dd>
        </div>
        <div>
          <dt className="text-ink/60">Last success</dt>
          <dd className="text-ink">
            <Ago at={s.lastSuccessAt} />
          </dd>
        </div>
        <div>
          <dt className="text-ink/60">Items last run</dt>
          <dd className="text-ink">{s.lastItemCount ?? '–'}</dd>
        </div>
        <div>
          <dt className="text-ink/60">Failures in a row</dt>
          <dd className={cn('text-ink', s.consecutiveFailures > 0 && 'font-semibold text-red-700 dark:text-red-300')}>{s.consecutiveFailures}</dd>
        </div>
      </dl>
      {s.lastError && <p className="break-words rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-200">{s.lastError}</p>}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <label htmlFor={`sched-${s.id}`} className="sr-only">
            Schedule for {s.name}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select aria-label="Common schedules" className="input sm:w-48" value={SCHEDULE_PRESETS.some((p) => p.value === schedule.trim()) ? schedule.trim() : ''} onChange={(e) => e.target.value && setSchedule(e.target.value)}>
              <option value="">Custom</option>
              {SCHEDULE_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <input id={`sched-${s.id}`} className={cn('input font-mono', scheduleProblem && 'border-red-400')} value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="0 */6 * * *" />
          </div>
          {scheduleProblem && <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-400">{scheduleProblem}</p>}
        </div>
        <button
          type="button"
          className="btn-secondary px-3 py-2 text-sm"
          disabled={Boolean(busy) || Boolean(scheduleProblem) || schedule.trim() === s.schedule}
          onClick={() => call('schedule', `/api/admin/sources/${s.id}`, 'PATCH', { schedule })}
        >
          {busy === 'schedule' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save schedule
        </button>
      </div>
      {queuedNow && <p className="text-xs text-emerald-700 dark:text-emerald-300">{queuedNow}</p>}
      {problem && <ErrorNote>{problem}</ErrorNote>}
    </li>
  );
}

function RunItem({ r }: { r: RunRow }) {
  const c = r.counts ?? {};
  const counts = ['found', 'new', 'created', 'updated', 'merged', 'review', 'rejected', 'errors'].filter((k) => c[k]).map((k) => `${c[k]} ${k}`);
  return (
    <li className="card p-4">
      <details>
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2">
          <RunStatusPill status={r.status} />
          <span className="font-semibold text-ink">
            {r.agent}
            {r.sourceName ? ` · ${r.sourceName}` : ''}
          </span>
          <Pill>{r.trigger}</Pill>
          <span className="text-xs text-ink/60">
            <When at={r.startedAt} />
            {r.finishedAt ? ` · ${Math.max(0, Math.round((Date.parse(r.finishedAt) - Date.parse(r.startedAt)) / 1000))}s` : ''}
          </span>
          <span className="w-full text-xs text-ink/70 sm:w-auto">{counts.join(' · ') || 'No counts yet'}</span>
        </summary>
        <div className="mt-3 space-y-3">
          {r.errorLog.length > 0 && (
            <div>
              <p className="label">Errors</p>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-red-50 p-3 text-xs text-red-900 dark:bg-red-500/10 dark:text-red-100">{r.errorLog.join('\n')}</pre>
            </div>
          )}
          <div>
            <p className="label flex items-center gap-1.5">
              <Terminal className="h-3.5 w-3.5" />
              Log (last {r.log.length} lines)
            </p>
            {r.log.length ? (
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-ink/5 p-3 font-mono text-xs text-ink/80">{r.log.join('\n')}</pre>
            ) : (
              <p className="text-xs text-ink/60">Nothing logged yet.</p>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

/** Source health, schedules and "Run now", plus the latest agent runs with their logs. */
export default function SourcesPanel() {
  const sources = useSWR<{ sources: SourceRow[]; health: Record<string, number> }>('/api/admin/sources');
  const [runFilter, setRunFilter] = useState<'all' | 'failed' | 'queued'>('all');
  const runs = useSWR<{ items: RunRow[] }>(`/api/admin/runs?limit=30&status=${runFilter}`, { refreshInterval: 15_000 });
  const refresh = () => {
    sources.mutate();
    runs.mutate();
  };
  const h = sources.data?.health;

  return (
    <div className="space-y-10">
      <Notice>
        <strong>Run now</strong> queues a Scout run; it doesn’t run inside the website. The agents scheduler picks queued runs up, so keep it
        running with <code className="rounded bg-ink/10 px-1.5 py-0.5 font-mono text-xs">pnpm agents:schedule</code>. Schedules are cron expressions in
        India time.
      </Notice>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Sources</h2>
          {h && (
            <div className="flex flex-wrap gap-2">
              <HealthPill health="ok" /> <span className="text-sm text-ink/70">{h.ok}</span>
              <HealthPill health="degraded" /> <span className="text-sm text-ink/70">{h.degraded}</span>
              <HealthPill health="failing" /> <span className="text-sm text-ink/70">{h.failing + h.blocked}</span>
              <HealthPill health="unknown" /> <span className="text-sm text-ink/70">{h.unknown}</span>
            </div>
          )}
        </div>
        {sources.error && <ErrorNote>{sources.error.message}</ErrorNote>}
        {!sources.data && !sources.error && <p className="text-sm text-ink/60">Loading sources…</p>}
        {sources.data && sources.data.sources.length === 0 && (
          <EmptyState title="No sources set up yet">
            Add the built-in sources with <code className="font-mono">pnpm agents:sources</code>, then they show up here with their health and schedule.
          </EmptyState>
        )}
        <ul className="space-y-3">
          {sources.data?.sources.map((s) => (
            <SourceCard key={`${s.id}-${s.schedule}`} s={s} onChanged={refresh} />
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl">Recent runs</h2>
          <Tabs
            value={runFilter}
            onChange={(value) => setRunFilter(value)}
            options={[
              { value: 'all', label: 'All' },
              { value: 'failed', label: 'Failed' },
              { value: 'queued', label: 'Queued' },
            ]}
          />
        </div>
        {runs.error && <ErrorNote>{runs.error.message}</ErrorNote>}
        {runs.data && runs.data.items.length === 0 && <EmptyState title="No runs yet">Runs appear here as the scheduler works through the sources.</EmptyState>}
        <ul className="space-y-3">
          {runs.data?.items.map((r) => (
            <RunItem key={r.id} r={r} />
          ))}
        </ul>
      </section>
    </div>
  );
}
