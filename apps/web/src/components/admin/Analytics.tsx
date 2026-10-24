'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ArrowDown } from 'lucide-react';
import { BarList, TrafficChart } from './charts';
import TrafficTiles from './TrafficTiles';
import type { Breakdowns, FunnelRow, SeriesPoint, TrafficSummary } from './types';
import { Button, duration, ErrorBox, inputClass, Loading, num, PageHeader, Panel, pct, SearchInput, Segmented, StateBadge, Table, Td, Th } from './ui';

type RangeKey = 'today' | '7d' | '30d' | '90d' | 'custom';

interface AnalyticsData {
  range: { key: RangeKey; label: string; from: string; to: string; bucket: 'hour' | 'day' };
  summary: TrafficSummary;
  previous: TrafficSummary;
  series: SeriesPoint[];
  breakdowns: Breakdowns;
  funnel: FunnelRow[];
}

const DEVICE_LABEL: Record<string, string> = { mobile: 'Phone', tablet: 'Tablet', desktop: 'Computer' };

/** Today in India as "2026-10-24", for the date inputs. */
function istToday(offsetDays = 0): string {
  return new Date(Date.now() + 330 * 60_000 + offsetDays * 86_400_000).toISOString().slice(0, 10);
}

type FunnelSort = 'impressions' | 'views' | 'registerClicks' | 'saves';

function Funnel({ rows }: { rows: FunnelRow[] }) {
  const [sort, setSort] = useState<FunnelSort>('impressions');
  const [q, setQ] = useState('');
  const shown = useMemo(
    () =>
      rows
        .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.slug.includes(q.toLowerCase()))
        .sort((a, b) => b[sort] - a[sort]),
    [rows, sort, q]
  );
  const head = (key: FunnelSort, label: string) => (
    <Th right>
      <button type="button" onClick={() => setSort(key)} className="inline-flex items-center gap-1 uppercase hover:text-black" aria-pressed={sort === key}>
        {label}
        {sort === key && <ArrowDown className="h-3 w-3" aria-hidden="true" />}
      </button>
    </Th>
  );
  const rate = (a: number, b: number) => (b > 0 ? pct(a / b) : '–');
  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Find a hackathon" />
      {shown.length ? (
        <Table>
          <thead>
            <tr>
              <Th>Hackathon</Th>
              {head('impressions', 'Impressions')}
              {head('views', 'Page views')}
              <Th right>Opened</Th>
              {head('registerClicks', 'Register clicks')}
              <Th right>Clicked</Th>
              {head('saves', 'Saves')}
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.slug}>
                <Td className="max-w-[320px]">
                  {r.id ? (
                    <Link href={`/admin/hackathons/${r.id}`} className="font-medium hover:underline">
                      {r.title}
                    </Link>
                  ) : (
                    <span className="font-medium">{r.title}</span>
                  )}
                  <span className="ml-2 align-middle">
                    <StateBadge state={r.state} />
                  </span>
                </Td>
                <Td right>{num(r.impressions)}</Td>
                <Td right>
                  {num(r.views)}
                  <span className="block text-xs text-neutral-500">{num(r.visitors)} people</span>
                </Td>
                <Td right className="text-neutral-500" >
                  {rate(r.views, r.impressions)}
                </Td>
                <Td right>{num(r.registerClicks)}</Td>
                <Td right className="text-neutral-500">
                  {rate(r.registerClicks, r.views)}
                </Td>
                <Td right>{num(r.saves)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-sm text-neutral-500">No hackathon activity in this period yet.</p>
      )}
      <p className="text-xs text-neutral-500">
        Opened = page views ÷ impressions. Clicked = register clicks ÷ page views. Impressions count cards seen for at least a second, once per page view.
      </p>
    </div>
  );
}

function Pages({ rows }: { rows: Breakdowns['pages'] }) {
  const [q, setQ] = useState('');
  const shown = rows.filter((r) => !q || r.path.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-3">
      <SearchInput value={q} onChange={setQ} placeholder="Filter pages, e.g. /hackathons" />
      <Table>
        <thead>
          <tr>
            <Th>Page</Th>
            <Th right>Views</Th>
            <Th right>Visitors</Th>
            <Th right>Avg. time</Th>
          </tr>
        </thead>
        <tbody>
          {shown.map((p) => (
            <tr key={p.path}>
              <Td className="max-w-[420px] break-all">
                <a href={p.path} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {p.path}
                </a>
              </Td>
              <Td right>{num(p.views)}</Td>
              <Td right>{num(p.visitors)}</Td>
              <Td right>{duration(p.avgTimeMs)}</Td>
            </tr>
          ))}
          {!shown.length && (
            <tr>
              <Td colSpan={4} className="text-neutral-500">
                No pages yet.
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
}

/** Traffic in depth for any range: pages, sources, campaigns, devices, places, and each hackathon's funnel. */
export default function Analytics() {
  const [range, setRange] = useState<RangeKey>('7d');
  const [from, setFrom] = useState(istToday(-13));
  const [to, setTo] = useState(istToday());
  const [applied, setApplied] = useState({ from: istToday(-13), to: istToday() });
  const params = new URLSearchParams({ range, ...(range === 'custom' ? applied : {}) });
  const { data, error, isLoading } = useSWR<AnalyticsData>(`/api/admin/analytics?${params}`, { keepPreviousData: true });
  const b = data?.breakdowns;
  const compare = range === 'today' ? 'yesterday so far' : 'the period before';

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Everyone who visits the public site. Times are India time; admin pages and bots aren’t counted." />

      <div className="flex flex-wrap items-end gap-3">
        <Segmented
          label="Range"
          value={range}
          onChange={setRange}
          options={[
            { value: 'today', label: 'Today' },
            { value: '7d', label: '7 days' },
            { value: '30d', label: '30 days' },
            { value: '90d', label: '90 days' },
            { value: 'custom', label: 'Custom' },
          ]}
        />
        {range === 'custom' && (
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied({ from, to });
            }}
          >
            <label className="text-xs text-neutral-600">
              From
              <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={`${inputClass} mt-1 w-40`} />
            </label>
            <label className="text-xs text-neutral-600">
              To
              <input type="date" value={to} min={from} max={istToday()} onChange={(e) => setTo(e.target.value)} className={`${inputClass} mt-1 w-40`} />
            </label>
            <Button type="submit" variant="primary">
              Apply
            </Button>
          </form>
        )}
        {data && <span className="text-sm text-neutral-500">{data.range.label}</span>}
      </div>

      {error && <ErrorBox>{error.message}</ErrorBox>}
      {!data && isLoading && <Loading>Counting…</Loading>}

      {data && b && (
        <>
          <TrafficTiles current={data.summary} previous={data.previous} compare={compare} extra />

          <Panel title={data.range.bucket === 'hour' ? 'Visitors and page views by hour' : 'Visitors and page views by day'}>
            <TrafficChart points={data.series} />
          </Panel>

          <Panel title="Hackathon funnel: impressions → page views → register clicks → saves">
            <Funnel rows={data.funnel} />
          </Panel>

          <Panel title="Pages">
            <Pages rows={b.pages} />
          </Panel>

          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Referrers (where visitors came from)">
              <BarList rows={b.referrers.map((r) => ({ label: r.key, value: r.visitors, sub: `${num(r.views ?? 0)} views` }))} unit="visitors" empty="No referrers in this period." />
            </Panel>
            <Panel title="Campaigns (UTM)" flush>
              {b.utm.length ? (
                <Table className="border-0">
                  <thead>
                    <tr>
                      <Th>Source</Th>
                      <Th>Medium</Th>
                      <Th>Campaign</Th>
                      <Th right>Visitors</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.utm.map((u) => (
                      <tr key={`${u.source}-${u.medium}-${u.campaign}`}>
                        <Td>{u.source}</Td>
                        <Td>{u.medium || '–'}</Td>
                        <Td>{u.campaign || '–'}</Td>
                        <Td right>{num(u.visitors)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <p className="p-4 text-sm text-neutral-500">
                  No campaign links used. Add <code className="font-mono">?utm_source=instagram&amp;utm_campaign=launch</code> to links you share.
                </p>
              )}
            </Panel>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Panel title="Devices">
              <BarList rows={b.devices.map((d) => ({ label: DEVICE_LABEL[d.key] ?? d.key, value: d.visitors }))} unit="visitors" />
            </Panel>
            <Panel title="Browsers">
              <BarList rows={b.browsers.map((d) => ({ label: d.key, value: d.visitors }))} unit="visitors" />
            </Panel>
            <Panel title="Operating systems">
              <BarList rows={b.os.map((d) => ({ label: d.key, value: d.visitors }))} unit="visitors" />
            </Panel>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Panel title="Countries">
              <BarList rows={b.countries.map((c) => ({ label: c.key, value: c.visitors }))} unit="visitors" empty="Places show once the site runs on a host that sends them (Vercel or Cloudflare)." />
            </Panel>
            <Panel title="Cities">
              <BarList rows={b.cities.map((c) => ({ label: c.key, value: c.visitors }))} unit="visitors" empty="No city data in this period." />
            </Panel>
            <Panel title="Tracked clicks">
              <BarList rows={b.clicks.map((c) => ({ label: c.label, value: c.clicks }))} unit="clicks" empty="No clicks on elements marked data-hf-click yet." />
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
