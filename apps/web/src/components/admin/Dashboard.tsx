'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { BarList, TrafficChart } from './charts';
import TrafficTiles from './TrafficTiles';
import type { ScrapeRunSummary, SeriesPoint, TrafficSummary } from './types';
import { cn } from '@/lib/cn';
import { Ago, Badge, Button, ErrorBox, Loading, num, PageHeader, Panel, Segmented, Table, Td, Th, When } from './ui';

interface Period {
  label: string;
  current: TrafficSummary;
  previous: TrafficSummary;
  compare: string;
}

interface TopRow {
  id: string | null;
  slug: string;
  title: string;
  value: number;
}

interface DashboardData {
  generatedAt: string;
  summaries: { today: Period; week: Period; month: Period };
  series: SeriesPoint[];
  topHackathons: { impressions: TopRow[]; views: TopRow[]; registerClicks: TopRow[] };
  ops: {
    live: number;
    liveBySource: { source: string; name: string; count: number }[];
    pending: number;
    pendingSubs: number;
    openReports: number;
    users: number;
    lastScrape: ScrapeRunSummary | null;
    scrapeError: string;
    nextScrape: string;
    schedule: string;
  };
  recentUsers: { id: string; name: string; handle: string; email: string; college: string; city: string; role: string; createdAt: string; lastLoginAt: string | null }[];
  recentPosts: { kind: string; title: string; href: string; author: string; at: string }[];
}

/** The four things a person may need to act on, as large linked numbers. */
function Attention({ ops }: { ops: DashboardData['ops'] }) {
  const cards = [
    { label: 'Waiting for review', value: ops.pending + ops.pendingSubs, sub: `${num(ops.pending)} listings · ${num(ops.pendingSubs)} submissions`, href: '/admin/review', urgent: ops.pending + ops.pendingSubs > 0 },
    { label: 'Open reports', value: ops.openReports, sub: 'Wrong details, scams, broken links', href: '/admin/reports', urgent: ops.openReports > 0 },
    { label: 'Live hackathons', value: ops.live, sub: 'Shown on the site now', href: '/admin/hackathons?state=live', urgent: false },
    { label: 'Accounts', value: ops.users, sub: 'Signed-up students', href: '/admin/users', urgent: false },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          className={cn(
            'group flex flex-col justify-between rounded-[3px] border bg-white p-4 transition hover:border-black',
            c.urgent ? 'border-black' : 'border-neutral-300'
          )}
        >
          <span className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
            {c.label}
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5 group-hover:text-black" aria-hidden="true" />
          </span>
          <span className="mt-3 text-3xl font-semibold tabular-nums">{num(c.value)}</span>
          <span className="mt-1 text-xs text-neutral-500">{c.sub}</span>
        </Link>
      ))}
    </div>
  );
}

function ScrapeBox({ ops }: { ops: DashboardData['ops'] }) {
  const run = ops.lastScrape;
  return (
    <div className="space-y-2 text-sm">
      <p className="text-neutral-500">{ops.schedule}.</p>
      <p>
        Next run: <strong className="font-semibold"><When at={ops.nextScrape} /></strong>
      </p>
      {ops.scrapeError ? (
        <p className="text-neutral-500">{ops.scrapeError}</p>
      ) : run ? (
        <div>
          <p>
            Last run <Ago at={run.startedAt} /> · <Badge tone={run.status === 'running' || run.status === 'queued' ? 'solid' : 'outline'}>{run.status}</Badge>
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            {num(run.counts.found)} found · {num(run.counts.created)} added · {num(run.counts.updated)} updated · {num(run.counts.review)} to review · {num(run.counts.errors)} errors
          </p>
        </div>
      ) : (
        <p className="text-neutral-500">No scrape has run yet.</p>
      )}
      <Link href="/admin/scraper" className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-2">
        Open the scraper
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}

const topRows = (rows: TopRow[]) => rows.map((r) => ({ label: r.title, value: r.value, href: r.id ? `/admin/hackathons/${r.id}` : undefined }));

type TopKey = keyof DashboardData['topHackathons'];
const TOP_EMPTY: Record<TopKey, string> = {
  impressions: 'No hackathon cards seen yet.',
  views: 'No hackathon pages opened yet.',
  registerClicks: 'No register clicks yet.',
};

/** A titled band of the dashboard. */
function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The admin home: what needs a person first, then how the site is doing. Details live in Analytics. */
export default function Dashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const [top, setTop] = useState<TopKey>('views');
  const { data, error, isLoading, mutate, isValidating } = useSWR<DashboardData>('/api/admin/dashboard', { refreshInterval: 60_000, keepPreviousData: true });

  if (error && !data) return <ErrorBox>{error.message}</ErrorBox>;
  if (isLoading || !data) return <Loading>Loading the dashboard…</Loading>;
  const s = data.summaries[period];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description={
          <>
            Public site only; admin pages and bots aren’t counted. Updated <Ago at={data.generatedAt} />.
          </>
        }
        actions={
          <Button icon={RefreshCw} busy={isValidating} onClick={() => void mutate()}>
            Refresh
          </Button>
        }
      />

      <Section title="Needs attention">
        <Attention ops={data.ops} />
      </Section>

      <Section
        title="Traffic"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              label="Period"
              value={period}
              onChange={setPeriod}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'week', label: '7 days' },
                { value: 'month', label: '30 days' },
              ]}
            />
            <Link href="/admin/analytics" className="text-sm underline underline-offset-2">
              Full analytics
            </Link>
          </div>
        }
      >
        <TrafficTiles current={s.current} previous={s.previous} compare={s.compare} compact />
        <Panel title="Visitors and page views, last 30 days">
          <TrafficChart points={data.series} />
        </Panel>
      </Section>

      <Section title="Listings">
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel title="Scraper">
            <ScrapeBox ops={data.ops} />
          </Panel>
          <Panel title="Live hackathons by source">
            <BarList rows={data.ops.liveBySource.map((r) => ({ label: r.name, value: r.count, href: `/admin/hackathons?state=live&source=${encodeURIComponent(r.source)}` }))} empty="No live listings yet." />
          </Panel>
          <Panel title="Top hackathons, last 7 days">
            <div className="mb-3">
              <Segmented
                label="Rank by"
                value={top}
                onChange={setTop}
                options={[
                  { value: 'views', label: 'Opens' },
                  { value: 'registerClicks', label: 'Registers' },
                  { value: 'impressions', label: 'Seen' },
                ]}
              />
            </div>
            <BarList rows={topRows(data.topHackathons[top])} empty={TOP_EMPTY[top]} />
          </Panel>
        </div>
      </Section>

      <Section title="People">
        <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Recent sign-ups" flush action={<Link href="/admin/users" className="text-xs underline underline-offset-2">All users</Link>}>
          {data.recentUsers.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Who</Th>
                  <Th>From</Th>
                  <Th>Joined</Th>
                </tr>
              </thead>
              <tbody>
                {data.recentUsers.map((u) => (
                  <tr key={u.id}>
                    <Td>
                      <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                        {u.name}
                      </Link>
                      <span className="block text-xs text-neutral-500">
                        @{u.handle}
                        {u.email ? ` · ${u.email}` : ''}
                      </span>
                    </Td>
                    <Td className="text-xs text-neutral-600">{[u.college, u.city].filter(Boolean).join(', ') || '–'}</Td>
                    <Td className="whitespace-nowrap text-xs">
                      <Ago at={u.createdAt} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No sign-ups yet.</p>
          )}
        </Panel>
        <Panel title="Recent community posts" action={<Link href="/admin/community" className="text-xs underline underline-offset-2">Moderate</Link>}>
          {data.recentPosts.length ? (
            <ul className="divide-y divide-neutral-200">
              {data.recentPosts.map((p, i) => (
                <li key={`${p.href}-${i}`} className="flex items-start justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <a href={p.href} target="_blank" rel="noopener noreferrer" className="block truncate font-medium hover:underline">
                      {p.title}
                    </a>
                    <span className="text-xs text-neutral-500">
                      {p.kind} by @{p.author}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-neutral-500">
                    <Ago at={p.at} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Nothing posted yet.</p>
          )}
        </Panel>
        </div>
      </Section>
    </div>
  );
}
