'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { BarList, TrafficChart } from './charts';
import TrafficTiles from './TrafficTiles';
import type { Breakdowns, ScrapeRunSummary, SeriesPoint, TrafficSummary } from './types';
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
  breakdowns: Breakdowns;
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

const DEVICE_LABEL: Record<string, string> = { mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' };

function Attention({ ops }: { ops: DashboardData['ops'] }) {
  const rows = [
    { label: 'Waiting for review', value: ops.pending + ops.pendingSubs, sub: `${num(ops.pending)} listings, ${num(ops.pendingSubs)} submissions`, href: '/admin/review' },
    { label: 'Open reports', value: ops.openReports, sub: 'Wrong details, scams, broken links', href: '/admin/reports' },
    { label: 'Live hackathons', value: ops.live, sub: 'Shown on the site now', href: '/admin/hackathons?state=live' },
    { label: 'Accounts', value: ops.users, sub: 'Signed-up people, not sample students', href: '/admin/users' },
  ];
  return (
    <ul className="divide-y divide-neutral-200">
      {rows.map((r) => (
        <li key={r.label}>
          <Link href={r.href} className="flex items-center justify-between gap-3 py-2.5 hover:bg-neutral-50">
            <span className="min-w-0">
              <span className="block text-sm font-medium">{r.label}</span>
              <span className="block text-xs text-neutral-500">{r.sub}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xl font-semibold tabular-nums">{num(r.value)}</span>
              <ArrowRight className="h-4 w-4 text-neutral-400" aria-hidden="true" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
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

/** The admin home: how the site is doing and what needs a person. */
export default function Dashboard() {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');
  const { data, error, isLoading, mutate, isValidating } = useSWR<DashboardData>('/api/admin/dashboard', { refreshInterval: 60_000, keepPreviousData: true });

  if (error && !data) return <ErrorBox>{error.message}</ErrorBox>;
  if (isLoading || !data) return <Loading>Loading the dashboard…</Loading>;
  const s = data.summaries[period];
  const b = data.breakdowns;

  return (
    <div className="space-y-5">
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Period"
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'Last 7 days' },
            { value: 'month', label: 'Last 30 days' },
          ]}
        />
        <Link href="/admin/analytics" className="text-sm underline underline-offset-2">
          More in Analytics
        </Link>
      </div>
      <TrafficTiles current={s.current} previous={s.previous} compare={s.compare} />

      <Panel title="Visitors and page views, last 30 days">
        <TrafficChart points={data.series} />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Needs attention" className="lg:col-span-1">
          <Attention ops={data.ops} />
        </Panel>
        <Panel title="Scraper">
          <ScrapeBox ops={data.ops} />
        </Panel>
        <Panel title="Live hackathons by source">
          <BarList rows={data.ops.liveBySource.map((r) => ({ label: r.name, value: r.count, href: `/admin/hackathons?state=live&source=${encodeURIComponent(r.source)}` }))} empty="No live listings yet." />
        </Panel>
      </div>

      <h2 className="pt-2 text-base font-semibold">Last 7 days</h2>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Top pages">
          <BarList rows={b.pages.map((p) => ({ label: p.path, value: p.views, href: p.path, external: true }))} unit="views" />
        </Panel>
        <Panel title="Where visitors came from">
          <BarList rows={b.referrers.map((r) => ({ label: r.key, value: r.visitors }))} unit="visitors" empty="Everyone came directly (or the referrer was hidden)." />
        </Panel>
        <Panel title="Devices and browsers">
          <BarList rows={b.devices.map((d) => ({ label: DEVICE_LABEL[d.key] ?? d.key, value: d.visitors }))} unit="visitors" />
          <div className="mt-4">
            <BarList rows={b.browsers.slice(0, 5).map((d) => ({ label: d.key, value: d.visitors }))} unit="visitors" />
          </div>
        </Panel>
        <Panel title="Countries and cities">
          <BarList rows={b.countries.slice(0, 5).map((c) => ({ label: c.key, value: c.visitors }))} unit="visitors" empty="Places show once the site runs on a host that sends them (Vercel or Cloudflare)." />
          {b.cities.length > 0 && (
            <div className="mt-4">
              <BarList rows={b.cities.slice(0, 5).map((c) => ({ label: c.key, value: c.visitors }))} unit="visitors" />
            </div>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Most seen hackathons (impressions)">
          <BarList rows={topRows(data.topHackathons.impressions)} empty="No hackathon cards seen yet." />
        </Panel>
        <Panel title="Most opened hackathons">
          <BarList rows={topRows(data.topHackathons.views)} empty="No hackathon pages opened yet." />
        </Panel>
        <Panel title="Most register clicks">
          <BarList rows={topRows(data.topHackathons.registerClicks)} empty="No register clicks yet." />
        </Panel>
      </div>

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
    </div>
  );
}
