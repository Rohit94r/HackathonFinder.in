'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Check, Minus } from 'lucide-react';
import type { Paged } from './types';
import { Ago, Badge, Empty, ErrorBox, Loading, num, PageHeader, Pager, Panel, SearchInput, Select, Table, Td, Th, When } from './ui';

interface SettingsData {
  services: { name: string; ok: boolean; detail: string }[];
  scraperKeys: { name: string; ok: boolean }[];
  adminEmails: { count: number; withAccount: number };
  admins: { id: string; name: string; handle: string; email: string; byRole: boolean; byEmail: boolean; banned: boolean; lastLoginAt: string | null }[];
  counts: { users: number; listings: Record<string, number>; pageViews: number; events: number; auditEntries: number };
}

interface AuditRow {
  id: string;
  adminId: string;
  adminHandle: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
}

function Yes({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="inline-flex h-5 w-5 items-center justify-center bg-black text-white" aria-label="Yes">
      <Check className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center border border-neutral-400 text-neutral-500" aria-label="No">
      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
    </span>
  );
}

const TARGET_LINK: Record<string, (id: string) => string> = {
  listing: (id) => `/admin/hackathons/${id}`,
  user: (id) => `/admin/users/${id}`,
  submission: (id) => `/admin/review/${id}`,
  scrape: (id) => `/admin/scraper/${id}`,
};

function AuditLog() {
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ q, action, page: String(page) });
  const { data, error } = useSWR<Paged<AuditRow> & { actions: string[] }>(`/api/admin/audit?${params}`, { keepPreviousData: true });
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder="Search the log"
        />
        <Select
          label="Action"
          value={action}
          onChange={(v) => {
            setAction(v);
            setPage(1);
          }}
          className="w-48"
          options={[{ value: '', label: 'Every action' }, ...(data?.actions ?? []).map((a) => ({ value: a, label: a }))]}
        />
      </div>
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && !data.items.length && <Empty title="No admin changes yet" />}
      {data && data.items.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>When</Th>
              <Th>Who</Th>
              <Th>Action</Th>
              <Th>What happened</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((r) => {
              const link = r.targetId && TARGET_LINK[r.targetType]?.(r.targetId);
              return (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap text-xs">
                    <When at={r.createdAt} />
                  </Td>
                  <Td className="text-xs">
                    <Link href={`/admin/users/${r.adminId}`} className="hover:underline">
                      @{r.adminHandle}
                    </Link>
                  </Td>
                  <Td className="whitespace-nowrap font-mono text-xs">{r.action}</Td>
                  <Td className="max-w-[520px] break-words">
                    {link ? (
                      <Link href={link} className="hover:underline">
                        {r.summary}
                      </Link>
                    ) : (
                      r.summary
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}

/** What's connected (yes/no only), who the admins are, and every admin change. */
export default function Settings() {
  const { data, error } = useSWR<SettingsData>('/api/admin/settings');
  return (
    <div className="space-y-5">
      <PageHeader title="Settings and health" description="What’s connected. Keys and secrets are never shown, only whether they’re set." />
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {!data && !error && <Loading />}
      {data && (
        <>
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Services" flush>
              <Table className="border-0">
                <tbody>
                  {data.services.map((s) => (
                    <tr key={s.name}>
                      <Td className="w-8">
                        <Yes ok={s.ok} />
                      </Td>
                      <Td>{s.name}</Td>
                      <Td className="text-xs text-neutral-500">{s.detail}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Panel>
            <Panel title="Scraper keys" flush>
              <Table className="border-0">
                <tbody>
                  {data.scraperKeys.map((s) => (
                    <tr key={s.name}>
                      <Td className="w-8">
                        <Yes ok={s.ok} />
                      </Td>
                      <Td>{s.name}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <p className="px-4 py-3 text-xs text-neutral-500">Sources whose keys are missing are skipped. See Scraper → Sources for each one.</p>
            </Panel>
          </div>

          <Panel title="Admins" flush>
            <p className="px-4 pt-3 text-sm">
              {num(data.adminEmails.count)} email{data.adminEmails.count === 1 ? '' : 's'} in ADMIN_EMAILS ({num(data.adminEmails.withAccount)} with an account). Those accounts are always admins. Anyone else becomes an admin from their
              user page.
            </p>
            <Table className="mt-3 border-0">
              <thead>
                <tr>
                  <Th>Admin</Th>
                  <Th>Why</Th>
                  <Th>Last sign-in</Th>
                </tr>
              </thead>
              <tbody>
                {data.admins.map((a) => (
                  <tr key={a.id}>
                    <Td>
                      <Link href={`/admin/users/${a.id}`} className="font-medium hover:underline">
                        {a.name}
                      </Link>
                      <span className="block text-xs text-neutral-500">
                        @{a.handle} · {a.email}
                      </span>
                    </Td>
                    <Td>
                      <span className="flex flex-wrap gap-1">
                        {a.byEmail && <Badge>ADMIN_EMAILS</Badge>}
                        {a.byRole && <Badge>role</Badge>}
                        {a.banned && <Badge tone="solid">banned</Badge>}
                      </span>
                    </Td>
                    <Td className="text-xs">
                      <Ago at={a.lastLoginAt} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Panel>

          <Panel title="Totals">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
              <dt className="text-neutral-500">Accounts</dt>
              <dd className="tabular-nums sm:col-span-2">{num(data.counts.users)}</dd>
              <dt className="text-neutral-500">Listings</dt>
              <dd className="sm:col-span-2">
                {Object.entries(data.counts.listings)
                  .map(([state, n]) => `${num(n)} ${state}`)
                  .join(' · ') || '0'}
              </dd>
              <dt className="text-neutral-500">Page views stored</dt>
              <dd className="tabular-nums sm:col-span-2">{num(data.counts.pageViews)} (kept about 13 months)</dd>
              <dt className="text-neutral-500">Events stored</dt>
              <dd className="tabular-nums sm:col-span-2">{num(data.counts.events)}</dd>
              <dt className="text-neutral-500">Audit log entries</dt>
              <dd className="tabular-nums sm:col-span-2">{num(data.counts.auditEntries)}</dd>
            </dl>
          </Panel>
        </>
      )}

      <Panel title="Admin audit log">
        <AuditLog />
      </Panel>
    </div>
  );
}
