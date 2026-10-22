'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { Ban, Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/apiClient';
import Avatar from '@/components/Avatar';
import { Ago, EmptyState, ErrorNote, Notice, Pager, Pill, SearchBox, Tabs } from './parts';

type Role = 'student' | 'organizer' | 'admin';

interface UserRow {
  id: string;
  name: string;
  handle: string;
  email: string;
  image: string;
  role: Role;
  adminByEmail: boolean;
  banned: boolean;
  isSample: boolean;
  emailVerified: boolean;
  college: string;
  city: string;
  joinedAt: string;
  lastLoginAt: string | null;
}

interface Page {
  items: UserRow[];
  total: number;
  page: number;
  pages: number;
}

/** Search accounts, change roles, ban and unban. */
export default function UsersTable() {
  const { data: session } = useSession();
  const [q, setQ] = useState('');
  const [role, setRole] = useState<Role | 'all'>('all');
  const [banned, setBanned] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const [problem, setProblem] = useState('');
  const [note, setNote] = useState('');

  const params = new URLSearchParams({ q, role, page: String(page), ...(banned ? { banned: '1' } : {}) });
  const { data, error, mutate } = useSWR<Page>(`/api/admin/users?${params}`, { keepPreviousData: true });

  const patch = async (u: UserRow, body: { role?: Role; banned?: boolean }) => {
    setBusy(u.id);
    setProblem('');
    setNote('');
    try {
      const res = await apiFetch<{ user: UserRow; note: string }>(`/api/admin/users/${u.id}`, { method: 'PATCH', body });
      if (res.note) setNote(res.note);
      mutate((d) => (d ? { ...d, items: d.items.map((i) => (i.id === u.id ? res.user : i)) } : d), { revalidate: false });
    } catch (err) {
      setProblem(err instanceof ApiClientError ? err.message : 'That didn’t work. Please try again.');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <Tabs
          value={role}
          onChange={(v) => {
            setRole(v);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Everyone' },
            { value: 'student', label: 'Students' },
            { value: 'organizer', label: 'Organizers' },
            { value: 'admin', label: 'Admins' },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBox
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="Search name, handle or email"
          />
          <label className="flex items-center gap-2 text-sm text-ink/80">
            <input
              type="checkbox"
              checked={banned}
              onChange={(e) => {
                setBanned(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 accent-brand-600"
            />
            Banned only
          </label>
        </div>
      </div>

      <Notice>Banned accounts can’t sign in. Role changes apply the next time that person signs in or refreshes their session; admin pages check the account on every visit.</Notice>
      {note && <Notice tone="warn">{note}</Notice>}
      {problem && <ErrorNote>{problem}</ErrorNote>}
      {error && <ErrorNote>{error.message}</ErrorNote>}
      {data && <p className="text-sm text-ink/60">{data.total.toLocaleString('en-IN')} accounts</p>}
      {data && data.items.length === 0 && <EmptyState title="No accounts match" />}

      <ul className="space-y-3">
        {data?.items.map((u) => {
          const self = u.id === session?.user?.id;
          return (
            <li key={u.id} className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={u.name} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/u/${u.handle}`} className="break-words font-semibold text-ink hover:underline">
                      {u.name}
                    </Link>
                    <span className="text-xs text-ink/60">@{u.handle}</span>
                    {u.role === 'admin' && (
                      <Pill tone="brand">
                        <ShieldCheck className="h-3 w-3" />
                        admin
                      </Pill>
                    )}
                    {u.role === 'organizer' && <Pill>organizer</Pill>}
                    {u.banned && (
                      <Pill tone="bad">
                        <Ban className="h-3 w-3" />
                        banned
                      </Pill>
                    )}
                    {self && <Pill>you</Pill>}
                  </div>
                  <p className="break-all text-xs text-ink/60">
                    {u.email || 'No email'}
                    {u.email && !u.emailVerified ? ' (not verified)' : ''}
                    {u.college ? ` · ${u.college}` : ''}
                  </p>
                  <p className="text-xs text-ink/60">
                    Joined <Ago at={u.joinedAt} /> · last sign-in <Ago at={u.lastLoginAt} />
                    {u.adminByEmail ? ' · admin via ADMIN_EMAILS' : ''}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor={`role-${u.id}`}>
                  Role for {u.name}
                </label>
                <select
                  id={`role-${u.id}`}
                  className="input w-auto py-2"
                  value={u.role}
                  disabled={busy === u.id || self}
                  onChange={(e) => {
                    const next = e.target.value as Role;
                    if (next === 'admin' && !window.confirm(`Give ${u.name} admin access to the whole dashboard?`)) return;
                    patch(u, { role: next });
                  }}
                >
                  <option value="student">Student</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-sm"
                  disabled={busy === u.id || self}
                  onClick={() => {
                    if (!u.banned && !window.confirm(`Ban ${u.name}? They won’t be able to sign in.`)) return;
                    patch(u, { banned: !u.banned });
                  }}
                >
                  {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                  {u.banned ? 'Unban' : 'Ban'}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {data && <Pager page={data.page} pages={data.pages} onPage={setPage} />}
    </div>
  );
}
