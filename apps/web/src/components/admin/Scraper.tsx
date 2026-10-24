'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Radar } from 'lucide-react';
import { apiFetch } from '@/lib/apiClient';
import ScrapeRun, { isActive, startedByLabel } from './ScrapeRun';
import type { ScrapeRunSummary, ScrapeSource } from './types';
import { ActionStatus, Ago, Badge, Button, duration, Empty, ErrorBox, Loading, num, PageHeader, Panel, Table, Td, Th, useAction, When } from './ui';

interface Overview {
  schedule: { times: string[]; timezone: string; label: string; nextRunAt: string };
  runs: ScrapeRunSummary[];
  error: string;
}

function Sources() {
  const { data, error, mutate } = useSWR<{ sources: ScrapeSource[]; error: string }>('/api/admin/scrape/sources');
  const { busy, error: actionError, run } = useAction();
  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (!data) return <Loading>Loading sources…</Loading>;
  if (data.error) return <ErrorBox>{data.error}</ErrorBox>;
  if (!data.sources.length) return <Empty title="No sources yet">The scraper hasn’t registered any sources.</Empty>;

  const toggle = async (s: ScrapeSource) => {
    const ok = await run(s.slug, () => apiFetch(`/api/admin/scrape/sources/${encodeURIComponent(s.slug)}`, { method: 'PATCH', body: { enabled: !s.enabled } }));
    if (ok) await mutate();
  };

  return (
    <div className="space-y-3">
      <ActionStatus error={actionError} done="" />
      <Table className="border-0">
        <thead>
          <tr>
            <Th>Source</Th>
            <Th>On</Th>
            <Th>Health</Th>
            <Th>Last run</Th>
            <Th right>Items</Th>
            <Th>Needs</Th>
          </tr>
        </thead>
        <tbody>
          {data.sources.map((s) => (
            <tr key={s.slug}>
              <Td className="min-w-[200px] max-w-[320px]">
                <span className="font-medium">{s.name}</span> <span className="text-xs text-neutral-500">{s.kind}</span>
                {s.description && <span className="block text-xs text-neutral-500">{s.description}</span>}
                {s.lastError && <span className="mt-1 block break-words text-xs">! {s.lastError}</span>}
              </Td>
              <Td>
                <Button size="sm" variant={s.enabled ? 'primary' : 'secondary'} busy={busy === s.slug} disabled={Boolean(busy)} onClick={() => toggle(s)} aria-pressed={s.enabled} aria-label={`${s.enabled ? 'Turn off' : 'Turn on'} ${s.name}`}>
                  {s.enabled ? 'On' : 'Off'}
                </Button>
              </Td>
              <Td>
                <Badge tone={s.health === 'ok' ? 'solid' : s.health === 'unknown' ? 'muted' : 'outline'}>{s.health}</Badge>
              </Td>
              <Td className="whitespace-nowrap text-xs">
                <Ago at={s.lastRunAt} />
                {s.lastSuccessAt && s.lastSuccessAt !== s.lastRunAt && (
                  <span className="block text-neutral-500">
                    worked <Ago at={s.lastSuccessAt} />
                  </span>
                )}
              </Td>
              <Td right>{num(s.lastItemCount ?? null)}</Td>
              <Td className="text-xs">{s.missingEnv.length ? <span className="font-mono">{s.missingEnv.join(', ')}</span> : <span className="text-neutral-500">Nothing</span>}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function History({ runs, current, onPick }: { runs: ScrapeRunSummary[]; current: string | null; onPick: (id: string) => void }) {
  if (!runs.length) return <p className="p-4 text-sm text-neutral-500">No runs yet. Press “Scrape now” to start the first one.</p>;
  return (
    <Table className="border-0">
      <thead>
        <tr>
          <Th>Started</Th>
          <Th>By</Th>
          <Th>Status</Th>
          <Th right>Found</Th>
          <Th right>Added</Th>
          <Th right>Updated</Th>
          <Th right>Review</Th>
          <Th right>Errors</Th>
          <Th right>Took</Th>
          <Th right>Open</Th>
        </tr>
      </thead>
      <tbody>
        {runs.map((r) => (
          <tr key={r.id} className={current === r.id ? 'bg-neutral-100' : undefined}>
            <Td className="whitespace-nowrap text-xs">
              <When at={r.startedAt} />
            </Td>
            <Td className="text-xs">{startedByLabel(r.startedBy, r.trigger)}</Td>
            <Td>
              <Badge tone={isActive(r.status) ? 'solid' : r.status === 'failed' ? 'muted' : 'outline'}>{r.status}</Badge>
            </Td>
            <Td right>{num(r.counts.found)}</Td>
            <Td right>{num(r.counts.created)}</Td>
            <Td right>{num(r.counts.updated + r.counts.merged)}</Td>
            <Td right>{num(r.counts.review)}</Td>
            <Td right>{num(r.counts.errors)}</Td>
            <Td right className="text-xs">
              {r.finishedAt ? duration(new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) : '–'}
            </Td>
            <Td right className="whitespace-nowrap">
              <button type="button" className="text-xs underline underline-offset-2" onClick={() => onPick(r.id)}>
                Show here
              </button>
              <Link href={`/admin/scraper/${r.id}`} className="ml-3 text-xs underline underline-offset-2">
                Details
              </Link>
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/** "Scrape now", the live run, the twice-a-day schedule, sources and run history. */
export default function Scraper() {
  const { data, error, mutate } = useSWR<Overview>('/api/admin/scrape', {
    refreshInterval: (latest) => (latest?.runs.some((r) => isActive(r.status)) ? 5000 : 30_000),
  });
  const [runId, setRunId] = useState<string | null>(null);
  const { busy, error: startError, done, run } = useAction();

  // Opening the page while a run is going shows that run.
  useEffect(() => {
    const latest = data?.runs[0];
    if (!runId && latest && isActive(latest.status)) setRunId(latest.id);
  }, [data, runId]);

  const start = async () => {
    const res = await run('start', () => apiFetch<{ runId: string; alreadyRunning: boolean }>('/api/admin/scrape', { body: {} }), (r) =>
      r.alreadyRunning ? 'A scrape was already running, so you’re watching that one.' : 'Scrape started. New hackathons appear below as each source is checked.'
    );
    if (res) {
      setRunId(res.runId);
      void mutate();
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Scraper"
        description={data ? `${data.schedule.label}.` : 'Finds new hackathons on every source.'}
        actions={
          <Button variant="primary" size="lg" icon={Radar} busy={busy === 'start'} onClick={start}>
            Scrape now
          </Button>
        }
      />
      <ActionStatus error={startError} done={done} />
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {data?.error && (
        <ErrorBox>
          {data.error}
          <span className="mt-1 block text-xs">The schedule and buttons are ready; results show here as soon as the scraper engine is connected.</span>
        </ErrorBox>
      )}

      {runId && <ScrapeRun key={runId} id={runId} />}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Panel title="Schedule">
          {data ? (
            <div className="space-y-2 text-sm">
              <p>{data.schedule.label}.</p>
              <p>
                Next run: <strong className="font-semibold"><When at={data.schedule.nextRunAt} /></strong> IST
              </p>
              <p className="text-xs text-neutral-500">“Scrape now” runs the same thing straight away. Only one scrape runs at a time.</p>
            </div>
          ) : (
            <Loading />
          )}
        </Panel>
        <Panel title="Sources" flush>
          <Sources />
        </Panel>
      </div>

      <Panel title="Run history" flush>
        {data ? <History runs={data.runs} current={runId} onPick={setRunId} /> : <Loading />}
      </Panel>
    </div>
  );
}
