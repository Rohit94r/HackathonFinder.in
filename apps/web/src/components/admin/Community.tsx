'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { apiFetch } from '@/lib/apiClient';
import type { Paged, PersonRef } from './types';
import { ActionStatus, Ago, Badge, Button, Empty, ErrorBox, Loading, PageHeader, Pager, SearchInput, Segmented, Table, Td, Th, useAction, useConfirm } from './ui';

type Tab = 'threads' | 'replies' | 'teams' | 'wins' | 'flags';
type State = 'live' | 'removed' | 'all';

interface Row {
  id: string;
  slug?: string;
  title?: string;
  text: string;
  author: PersonRef | null;
  createdAt: string;
  deletedAt: string | null;
  // Threads
  category?: string;
  replyCount?: number;
  votes?: number;
  pinned?: boolean;
  // Replies
  thread?: { slug: string; title: string } | null;
  // Team posts
  hackathonTitle?: string;
  members?: number;
  teamMax?: number;
  open?: boolean;
  needs?: string[];
  // Wins
  hackathon?: string;
  result?: string;
  // Word filter
  kind?: string;
  words?: string[];
}

const TYPE: Record<Exclude<Tab, 'flags'>, 'thread' | 'reply' | 'team-post' | 'win'> = { threads: 'thread', replies: 'reply', teams: 'team-post', wins: 'win' };

function Author({ a }: { a: PersonRef | null }) {
  return a ? (
    <Link href={`/admin/users/${a.id}`} className="text-xs hover:underline">
      @{a.handle}
    </Link>
  ) : (
    <span className="text-xs text-neutral-500">signed out / deleted</span>
  );
}

/** Moderation: the latest threads, replies, team posts and stories, plus what the bad-word filter stopped. */
export default function Community() {
  const [tab, setTab] = useState<Tab>('threads');
  const [state, setState] = useState<State>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ tab, state, q, page: String(page) });
  const { data, error, isLoading, mutate } = useSWR<Paged<Row>>(`/api/admin/community?${params}`, { keepPreviousData: true });
  const { busy, error: actionError, done, run } = useAction();
  const [dialog, confirm] = useConfirm();

  const act = async (row: Row, action: 'remove' | 'restore' | 'pin' | 'unpin') => {
    if (tab === 'flags') return;
    const type = TYPE[tab];
    const label = row.title ? `“${row.title}”` : `this ${type.replace('-', ' ')}`;
    if (action === 'remove') {
      const ok = await confirm({ title: `Remove ${label}?`, body: 'It disappears from the site. You can restore it later.', confirmLabel: 'Remove' });
      if (!ok) return;
    }
    const res = await run(`${action}:${row.id}`, () => apiFetch('/api/admin/content', { body: { type, id: row.id, action } }), `Done: ${action} ${label}.`);
    if (res) await mutate();
  };
  const changeTab = (v: Tab) => {
    setTab(v);
    setPage(1);
  };
  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      {dialog}
      <PageHeader title="Community" description="Remove anything that breaks the rules. Removed posts disappear from the site and can be restored." />
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          label="What"
          value={tab}
          onChange={changeTab}
          options={[
            { value: 'threads', label: 'Threads' },
            { value: 'replies', label: 'Replies' },
            { value: 'teams', label: 'Team posts' },
            { value: 'wins', label: 'Winning stories' },
            { value: 'flags', label: 'Word filter log' },
          ]}
        />
        {tab !== 'flags' && (
          <Segmented
            label="State"
            value={state}
            onChange={(v) => {
              setState(v);
              setPage(1);
            }}
            options={[
              { value: 'all', label: 'All' },
              { value: 'live', label: 'Live' },
              { value: 'removed', label: 'Removed' },
            ]}
          />
        )}
        <SearchInput
          value={q}
          onChange={(v) => {
            setQ(v);
            setPage(1);
          }}
          placeholder={tab === 'flags' ? 'Search text or words' : 'Search the text'}
        />
      </div>
      <ActionStatus error={actionError} done={done} />
      {error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && !data && <Loading />}
      {data && !items.length && <Empty title="Nothing here">{tab === 'flags' ? 'The bad-word filter hasn’t stopped anything yet.' : 'No posts match.'}</Empty>}

      {items.length > 0 && tab === 'flags' && (
        <Table>
          <thead>
            <tr>
              <Th>Who</Th>
              <Th>Where</Th>
              <Th>What they tried to post</Th>
              <Th>Matched words</Th>
              <Th>When</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id}>
                <Td>
                  <Author a={f.author} />
                </Td>
                <Td className="text-xs">{f.kind}</Td>
                <Td className="max-w-[460px] break-words">{f.text}</Td>
                <Td className="text-xs">{f.words?.join(', ')}</Td>
                <Td className="whitespace-nowrap text-xs">
                  <Ago at={f.createdAt} />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {items.length > 0 && tab !== 'flags' && (
        <Table>
          <thead>
            <tr>
              <Th>{tab === 'replies' ? 'Reply' : tab === 'teams' ? 'Team post' : tab === 'wins' ? 'Story' : 'Thread'}</Th>
              <Th>{tab === 'replies' ? 'In thread' : tab === 'teams' ? 'Hackathon' : tab === 'wins' ? 'Hackathon' : 'Category'}</Th>
              <Th>By</Th>
              <Th>Posted</Th>
              <Th>Status</Th>
              <Th right>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <Td className="min-w-[240px] max-w-[460px] break-words">
                  {r.title &&
                    (tab === 'threads' || tab === 'wins' ? (
                      <a href={`/${tab === 'threads' ? 'community' : 'wins'}/${r.slug}`} target="_blank" rel="noopener noreferrer" className="block font-medium hover:underline">
                        {r.title}
                      </a>
                    ) : (
                      <span className="block font-medium">{r.title}</span>
                    ))}
                  <span className={r.title ? 'block text-xs text-neutral-600' : ''}>{r.text}</span>
                  {tab === 'teams' && r.needs && r.needs.length > 0 && <span className="block text-xs text-neutral-500">Needs: {r.needs.join(', ')}</span>}
                </Td>
                <Td className="max-w-[220px] text-xs">
                  {tab === 'replies' && (r.thread ? r.thread.title : '–')}
                  {tab === 'teams' && (
                    <>
                      {r.hackathonTitle}
                      <span className="block text-neutral-500">
                        {r.members}/{r.teamMax} · {r.open ? 'open' : 'closed'}
                      </span>
                    </>
                  )}
                  {tab === 'wins' && (
                    <>
                      {r.hackathon}
                      <span className="block text-neutral-500">{r.result}</span>
                    </>
                  )}
                  {tab === 'threads' && (
                    <>
                      {r.category}
                      <span className="block text-neutral-500">
                        {r.replyCount} replies · {r.votes} votes
                      </span>
                    </>
                  )}
                </Td>
                <Td>
                  <Author a={r.author} />
                </Td>
                <Td className="whitespace-nowrap text-xs">
                  <Ago at={r.createdAt} />
                </Td>
                <Td>
                  <span className="flex flex-wrap gap-1">
                    {r.deletedAt ? <Badge tone="muted">removed</Badge> : <Badge>live</Badge>}
                    {r.pinned && <Badge tone="solid">pinned</Badge>}
                  </span>
                </Td>
                <Td right>
                  <div className="flex justify-end gap-1.5">
                    {tab === 'threads' && !r.deletedAt && (
                      <Button size="sm" busy={busy === `${r.pinned ? 'unpin' : 'pin'}:${r.id}`} disabled={Boolean(busy)} onClick={() => act(r, r.pinned ? 'unpin' : 'pin')}>
                        {r.pinned ? 'Unpin' : 'Pin'}
                      </Button>
                    )}
                    {r.deletedAt ? (
                      <Button size="sm" busy={busy === `restore:${r.id}`} disabled={Boolean(busy)} onClick={() => act(r, 'restore')}>
                        Restore
                      </Button>
                    ) : (
                      <Button size="sm" busy={busy === `remove:${r.id}`} disabled={Boolean(busy)} onClick={() => act(r, 'remove')}>
                        Remove
                      </Button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}
