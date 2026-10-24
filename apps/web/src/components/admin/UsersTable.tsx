'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import type { Paged, Role, UserRow } from './types';
import { Ago, Badge, Empty, ErrorBox, Loading, num, PageHeader, Pager, SearchInput, Segmented, Select, Table, Td, Th, Thumb, When } from './ui';

type Show = 'real' | 'sample' | 'banned' | 'deleted' | 'all';

export function UserBadges({ u }: { u: Pick<UserRow, 'role' | 'adminByEmail' | 'banned' | 'isSample' | 'deletedAt'> }) {
  return (
    <span className="flex flex-wrap gap-1">
      {(u.role === 'admin' || u.adminByEmail) && <Badge tone="solid">admin{u.adminByEmail && u.role !== 'admin' ? ' (email)' : ''}</Badge>}
      {u.role === 'organizer' && <Badge>organizer</Badge>}
      {u.banned && <Badge tone="solid">banned</Badge>}
      {u.isSample && <Badge tone="muted">sample</Badge>}
      {u.deletedAt && <Badge tone="muted">deleted</Badge>}
    </span>
  );
}

/** Search every account and see how much each has posted. Open one to see everything and to ban, change role or delete. */
export default function UsersTable() {
  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('real');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [sort, setSort] = useState<'joined' | 'login' | 'name'>('joined');
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ q, show, role, sort, page: String(page) });
  const { data, error, isLoading } = useSWR<Paged<UserRow>>(`/api/admin/users?${params}`, { keepPreviousData: true });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description="Everyone with an account. Open someone to see everything they created and shared." />
      <Segmented
        label="Show"
        value={show}
        onChange={reset(setShow)}
        options={[
          { value: 'real', label: 'People' },
          { value: 'banned', label: 'Banned' },
          { value: 'sample', label: 'Sample students' },
          { value: 'deleted', label: 'Deleted' },
          { value: 'all', label: 'Everyone' },
        ]}
      />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={reset(setQ)} placeholder="Name, handle, email, college, city" />
        <Select
          label="Role"
          value={role}
          onChange={reset(setRole)}
          className="w-36"
          options={[
            { value: 'all', label: 'Any role' },
            { value: 'student', label: 'Students' },
            { value: 'organizer', label: 'Organizers' },
            { value: 'admin', label: 'Admins' },
          ]}
        />
        <Select
          label="Sort"
          value={sort}
          onChange={reset(setSort)}
          className="w-40"
          options={[
            { value: 'joined', label: 'Newest first' },
            { value: 'login', label: 'Last signed in' },
            { value: 'name', label: 'Name A–Z' },
          ]}
        />
      </div>

      {error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && !data && <Loading>Loading accounts…</Loading>}
      {data && !data.items.length && <Empty title="No accounts match" />}
      {data && data.items.length > 0 && (
        <Table>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>College and city</Th>
              <Th>Joined</Th>
              <Th>Last sign-in</Th>
              <Th right>Threads</Th>
              <Th right>Replies</Th>
              <Th right>Team posts</Th>
              <Th right>Messages</Th>
              <Th right>Wins</Th>
              <Th right>Shared</Th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u.id}>
                <Td className="min-w-[240px]">
                  <div className="flex items-start gap-2.5">
                    <Thumb src={u.image} className="h-8 w-8 rounded-full" />
                    <div className="min-w-0">
                      <Link href={`/admin/users/${u.id}`} className="font-medium hover:underline">
                        {u.name}
                      </Link>
                      <span className="block text-xs text-neutral-500">
                        @{u.handle}
                        {u.email && ` · ${u.email}`}
                      </span>
                      <span className="mt-0.5 block">
                        <UserBadges u={u} />
                      </span>
                    </div>
                  </div>
                </Td>
                <Td className="max-w-[200px] text-xs">{[u.college, u.city].filter(Boolean).join(', ') || <span className="text-neutral-400">–</span>}</Td>
                <Td className="text-xs">
                  <When at={u.joinedAt} time={false} />
                </Td>
                <Td className="whitespace-nowrap text-xs">
                  <Ago at={u.lastLoginAt} />
                </Td>
                <Td right>{num(u.counts?.threads)}</Td>
                <Td right>{num(u.counts?.replies)}</Td>
                <Td right>{num(u.counts?.teamPosts)}</Td>
                <Td right>{num(u.counts?.messages)}</Td>
                <Td right>{num(u.counts?.wins)}</Td>
                <Td right>{num(u.counts?.submissions)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {data && <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />}
    </div>
  );
}
