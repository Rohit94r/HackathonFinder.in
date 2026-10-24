'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { ArrowLeft, Ban, Trash2, Undo2 } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import { apiFetch } from '@/lib/apiClient';
import type { Role, SubmissionRow, UserRow } from './types';
import { UserBadges } from './UsersTable';
import { ActionStatus, Ago, Badge, Button, duration, Empty, ErrorBox, ExtLink, Loading, num, Panel, Segmented, Select, Stat, Table, Td, Th, Thumb, useAction, useConfirm, When } from './ui';

interface Removable {
  id: string;
  createdAt: string;
  deletedAt: string | null;
  removedByAdmin?: boolean;
}

interface Detail {
  user: UserRow & {
    about: string;
    bio: string;
    skills: string[];
    github: string;
    linkedin: string;
    lookingForTeam: boolean;
    followedCities: string[];
    onboarded: boolean;
    emailVerifiedAt: string | null;
    prefs: { reminders: boolean; digest: boolean; teamEmails: boolean };
    signInWith: string[];
    record: { event: string; result: string; project: string; date: string }[];
    createdAt: string;
  };
  counts: Record<'threads' | 'replies' | 'teamPosts' | 'requests' | 'invites' | 'wins' | 'submissions' | 'hackathonsAdded' | 'saved' | 'flags' | 'conversations' | 'messages' | 'reports', number>;
  threads: (Removable & { slug: string; title: string; category: string; replyCount: number; votes: number; pinned: boolean })[];
  replies: (Removable & { text: string; votes: number; thread: { slug: string; title: string } | null })[];
  teamPosts: (Removable & { hackathonSlug: string; hackathonTitle: string; city: string; mode: string; members: number; teamMax: number; idea: string; open: boolean })[];
  requests: { id: string; hackathonSlug: string; to: string; message: string; status: string; createdAt: string }[];
  invites: { id: string; hackathonSlug: string; to: string; message: string; status: string; createdAt: string }[];
  wins: (Removable & { slug: string; projectName: string; hackathon: string; result: string; cheers: number })[];
  submissions: SubmissionRow[];
  hackathonsAdded: { id: string; slug: string; title: string; state: string; createdAt: string }[];
  saved: { hackathonSlug: string; title: string; status: string; createdAt: string }[];
  flags: { id: string; kind: string; excerpt: string; words: string[]; createdAt: string }[];
  analytics: {
    pageViews: number;
    sessions: number;
    firstSeen: string | null;
    lastSeen: string | null;
    avgTimeMs: number | null;
    devices: { device: string; browser: string; os: string; views: number; last: string }[];
    places: { country: string; city: string; views: number }[];
    pages: { path: string; views: number }[];
    recent: { path: string; createdAt: string; durationMs?: number; device: string; referrerHost: string }[];
    events: { type: string; target: string; at: string }[];
  };
  timeline: { at: string; kind: string; text: string; href: string }[];
}

type Tab = 'threads' | 'replies' | 'teamPosts' | 'requests' | 'wins' | 'shared' | 'saved' | 'flags';
type ContentType = 'thread' | 'reply' | 'team-post' | 'win' | 'request' | 'invite';

function Status({ row }: { row: Removable }) {
  if (!row.deletedAt) return <Badge>live</Badge>;
  return <Badge tone="muted">{row.removedByAdmin ? 'removed by admin' : 'deleted'}</Badge>;
}

/** Everything about one account, with ban, role, delete and per-item removal. */
export default function UserDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const { data, error, mutate } = useSWR<Detail>(`/api/admin/users/${id}`);
  const [tab, setTab] = useState<Tab>('threads');
  const [role, setRole] = useState<Role | ''>('');
  const { busy, error: actionError, done, run } = useAction();
  const [dialog, confirm] = useConfirm();

  if (error) return <ErrorBox>{error.message}</ErrorBox>;
  if (!data) return <Loading>Loading the account…</Loading>;
  const u = data.user;
  const self = session?.user?.id === u.id;
  const deleted = Boolean(u.deletedAt);
  const c = data.counts;
  const a = data.analytics;

  const patchUser = async (key: string, body: Record<string, unknown>, message: string) => {
    const res = await run(key, () => apiFetch<{ note: string }>(`/api/admin/users/${id}`, { method: 'PATCH', body }), (r) => (r.note ? `${message} ${r.note}` : message));
    if (res) await mutate();
  };

  const ban = async () => {
    const ok = await confirm({
      title: `Ban @${u.handle}?`,
      body: 'They can’t sign in or post. Their profile and team posts stop showing.',
      checkbox: { label: 'Also hide everything they posted (threads, replies, stories, team posts)', defaultChecked: true },
      confirmLabel: 'Ban',
    });
    if (ok) await patchUser('ban', { banned: true, content: ok.checked }, `@${u.handle} is banned.`);
  };
  const unban = async () => {
    const ok = await confirm({ title: `Unban @${u.handle}?`, body: 'They can sign in and post again.', checkbox: { label: 'Also put back posts that admins hid', defaultChecked: true }, confirmLabel: 'Unban' });
    if (ok) await patchUser('unban', { banned: false, content: ok.checked }, `@${u.handle} is unbanned.`);
  };
  const remove = async () => {
    const ok = await confirm({
      title: `Delete @${u.handle}’s account?`,
      body: 'Their name, email, profile, saves and notifications are wiped and they can’t sign in. This can’t be undone.',
      checkbox: { label: 'Also hide everything they posted (otherwise it stays, shown as “Former student”)' },
      typeToConfirm: u.handle,
      confirmLabel: 'Delete account',
    });
    if (!ok) return;
    const res = await run('delete', () => apiFetch(`/api/admin/users/${id}`, { method: 'DELETE', body: { confirm: u.handle, hideContent: ok.checked } }), 'Account deleted.');
    if (res) router.push('/admin/users');
  };
  const content = async (type: ContentType, itemId: string, action: 'remove' | 'restore' | 'withdraw', label: string) => {
    if (action !== 'restore') {
      const ok = await confirm({ title: `${action === 'withdraw' ? 'Withdraw' : 'Remove'} ${label}?`, body: action === 'remove' ? 'It disappears from the site. You can restore it.' : undefined, confirmLabel: action === 'withdraw' ? 'Withdraw' : 'Remove' });
      if (!ok) return;
    }
    const res = await run(`${type}:${itemId}`, () => apiFetch('/api/admin/content', { body: { type, id: itemId, action } }), `Done: ${action} ${label}.`);
    if (res) await mutate();
  };
  const itemButton = (type: ContentType, row: Removable, label: string) =>
    row.deletedAt ? (
      <Button size="sm" busy={busy === `${type}:${row.id}`} disabled={Boolean(busy)} onClick={() => content(type, row.id, 'restore', label)}>
        Restore
      </Button>
    ) : (
      <Button size="sm" busy={busy === `${type}:${row.id}`} disabled={Boolean(busy)} onClick={() => content(type, row.id, 'remove', label)}>
        Remove
      </Button>
    );

  return (
    <div className="space-y-5">
      {dialog}
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-neutral-600 hover:text-black">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All users
      </Link>

      <div className="flex flex-wrap items-start gap-4">
        <Thumb src={u.image} className="h-16 w-16 rounded-full" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-xl font-semibold">{u.name}</h1>
          <p className="text-sm text-neutral-600">
            @{u.handle}
            {u.email && ` · ${u.email}`} {u.email && (u.emailVerified ? '(verified)' : '(not verified)')}
          </p>
          <div className="mt-1.5">
            <UserBadges u={u} />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">
            Joined <When at={u.joinedAt} /> · last sign-in <Ago at={u.lastLoginAt} /> · signs in with {u.signInWith.join(', ') || 'nothing (sample)'}
          </p>
        </div>
        {!deleted && u.handle && !u.isSample && (
          <a href={`/u/${u.handle}`} target="_blank" rel="noopener noreferrer" className="text-sm underline underline-offset-2">
            Public profile ↗
          </a>
        )}
      </div>

      <ActionStatus error={actionError} done={done} />

      {!deleted && (
        <Panel title="Account actions">
          {self ? (
            <p className="text-sm text-neutral-500">This is your own account. You can’t ban, demote or delete yourself here.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex items-end gap-2">
                <Select
                  label="Role"
                  value={role || u.role}
                  onChange={setRole}
                  className="w-36"
                  options={[
                    { value: 'student', label: 'Student' },
                    { value: 'organizer', label: 'Organizer' },
                    { value: 'admin', label: 'Admin' },
                  ]}
                />
                <Button
                  disabled={!role || role === u.role || Boolean(busy)}
                  busy={busy === 'role'}
                  onClick={async () => {
                    if (!role) return;
                    const ok = await confirm({ title: `Make @${u.handle} ${role === 'admin' ? 'an admin' : `a${role === 'organizer' ? 'n' : ''} ${role}`}?`, body: role === 'admin' ? 'Admins can see and change everything here.' : undefined, confirmLabel: 'Change role' });
                    if (ok) await patchUser('role', { role }, `@${u.handle} is now ${role}.`);
                    setRole('');
                  }}
                >
                  Change role
                </Button>
              </div>
              {u.banned ? (
                <Button icon={Undo2} busy={busy === 'unban'} disabled={Boolean(busy)} onClick={unban}>
                  Unban
                </Button>
              ) : (
                <Button variant="primary" icon={Ban} busy={busy === 'ban'} disabled={Boolean(busy)} onClick={ban}>
                  Ban
                </Button>
              )}
              <Button icon={Trash2} busy={busy === 'delete'} disabled={Boolean(busy)} onClick={remove}>
                Delete account…
              </Button>
            </div>
          )}
        </Panel>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        <Stat label="Threads" value={num(c.threads)} />
        <Stat label="Replies" value={num(c.replies)} />
        <Stat label="Team posts" value={num(c.teamPosts)} />
        <Stat label="Join requests" value={num(c.requests)} sub={<span className="text-xs text-neutral-500">{num(c.invites)} invites sent</span>} />
        <Stat label="Wins" value={num(c.wins)} />
        <Stat label="Shared" value={num(c.submissions)} sub={<span className="text-xs text-neutral-500">{num(c.hackathonsAdded)} became listings</span>} />
        <Stat label="Chats" value={num(c.conversations)} sub={<span className="text-xs text-neutral-500">{num(c.messages)} messages sent</span>} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Profile">
          <dl className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1.5 text-sm">
            <dt className="text-neutral-500">College</dt>
            <dd>{u.college || '–'}</dd>
            <dt className="text-neutral-500">City</dt>
            <dd>{u.city ? cityName(u.city) : '–'}</dd>
            <dt className="text-neutral-500">About</dt>
            <dd className="break-words">{u.about || '–'}</dd>
            <dt className="text-neutral-500">Bio</dt>
            <dd className="whitespace-pre-wrap break-words">{u.bio || '–'}</dd>
            <dt className="text-neutral-500">Skills</dt>
            <dd>{u.skills.join(', ') || '–'}</dd>
            <dt className="text-neutral-500">Links</dt>
            <dd className="space-x-3 break-all">
              {u.github && <ExtLink href={u.github}>GitHub</ExtLink>}
              {u.linkedin && <ExtLink href={u.linkedin}>LinkedIn</ExtLink>}
              {!u.github && !u.linkedin && '–'}
            </dd>
            <dt className="text-neutral-500">Team</dt>
            <dd>{u.lookingForTeam ? 'Looking for a team' : 'Not looking'}</dd>
            <dt className="text-neutral-500">Follows</dt>
            <dd>{u.followedCities.map((s) => cityName(s)).join(', ') || '–'}</dd>
            <dt className="text-neutral-500">Emails</dt>
            <dd>
              {[u.prefs.reminders && 'reminders', u.prefs.digest && 'digest', u.prefs.teamEmails && 'team emails'].filter(Boolean).join(', ') || 'none'}
            </dd>
            <dt className="text-neutral-500">Onboarded</dt>
            <dd>{u.onboarded ? 'Yes' : 'No'}</dd>
            <dt className="text-neutral-500">Reports filed</dt>
            <dd>{num(c.reports)}</dd>
          </dl>
          {u.record.length > 0 && (
            <div className="mt-3 border-t border-neutral-200 pt-3">
              <p className="mb-1 text-xs font-medium text-neutral-600">Hackathon record</p>
              <ul className="space-y-0.5 text-sm">
                {u.record.map((r, i) => (
                  <li key={`${r.event}-${i}`}>
                    {r.event} · {r.result}
                    {r.project && ` · ${r.project}`} <span className="text-xs text-neutral-500">(<When at={r.date} time={false} />)</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel title="How they use the site">
          {a.pageViews ? (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Page views" value={num(a.pageViews)} />
                <Stat label="Visits" value={num(a.sessions)} />
                <Stat label="Avg. time" value={duration(a.avgTimeMs)} />
                <Stat label="Last seen" value={<span className="text-base"><Ago at={a.lastSeen} /></span>} />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-600">Devices</p>
                <ul className="space-y-0.5">
                  {a.devices.map((d, i) => (
                    <li key={i}>
                      {d.device} · {d.browser} · {d.os} <span className="text-xs text-neutral-500">({num(d.views)} views, last <Ago at={d.last} />)</span>
                    </li>
                  ))}
                </ul>
              </div>
              {a.places.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-medium text-neutral-600">Places</p>
                  <p>{a.places.map((p) => `${p.city ? `${p.city}, ` : ''}${p.country} (${p.views})`).join(' · ')}</p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-600">Most opened pages</p>
                <ul className="space-y-0.5">
                  {a.pages.map((p) => (
                    <li key={p.path} className="flex justify-between gap-3">
                      <span className="truncate">{p.path}</span>
                      <span className="tabular-nums">{num(p.views)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No signed-in visits recorded yet. Visits count from when analytics was switched on, and only while they’re signed in.</p>
          )}
        </Panel>
      </div>

      <Panel
        title="What they created and shared"
        action={
          <Segmented
            label="Content"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'threads', label: 'Threads', count: c.threads },
              { value: 'replies', label: 'Replies', count: c.replies },
              { value: 'teamPosts', label: 'Team posts', count: c.teamPosts },
              { value: 'requests', label: 'Requests & invites', count: c.requests + c.invites },
              { value: 'wins', label: 'Wins', count: c.wins },
              { value: 'shared', label: 'Shared hackathons', count: c.submissions },
              { value: 'saved', label: 'Saved', count: c.saved },
              { value: 'flags', label: 'Word filter', count: c.flags },
            ]}
          />
        }
        flush
      >
        {tab === 'threads' &&
          (data.threads.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Thread</Th>
                  <Th right>Replies</Th>
                  <Th>Posted</Th>
                  <Th>Status</Th>
                  <Th right> </Th>
                </tr>
              </thead>
              <tbody>
                {data.threads.map((t) => (
                  <tr key={t.id}>
                    <Td>
                      <a href={`/community/${t.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {t.title}
                      </a>
                      <span className="block text-xs text-neutral-500">
                        {t.category}
                        {t.pinned && ' · pinned'} · {num(t.votes)} votes
                      </span>
                    </Td>
                    <Td right>{num(t.replyCount)}</Td>
                    <Td className="text-xs">
                      <Ago at={t.createdAt} />
                    </Td>
                    <Td>
                      <Status row={t} />
                    </Td>
                    <Td right>{itemButton('thread', t, `the thread “${t.title}”`)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No threads.</p>
          ))}
        {tab === 'replies' &&
          (data.replies.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Reply</Th>
                  <Th>In</Th>
                  <Th>Posted</Th>
                  <Th>Status</Th>
                  <Th right> </Th>
                </tr>
              </thead>
              <tbody>
                {data.replies.map((r) => (
                  <tr key={r.id}>
                    <Td className="max-w-[420px] break-words">{r.text}</Td>
                    <Td className="max-w-[200px] text-xs">
                      {r.thread ? (
                        <a href={`/community/${r.thread.slug}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {r.thread.title}
                        </a>
                      ) : (
                        '–'
                      )}
                    </Td>
                    <Td className="text-xs">
                      <Ago at={r.createdAt} />
                    </Td>
                    <Td>
                      <Status row={r} />
                    </Td>
                    <Td right>{itemButton('reply', r, 'this reply')}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No replies.</p>
          ))}
        {tab === 'teamPosts' &&
          (data.teamPosts.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Team post</Th>
                  <Th>Hackathon</Th>
                  <Th>Team</Th>
                  <Th>Status</Th>
                  <Th right> </Th>
                </tr>
              </thead>
              <tbody>
                {data.teamPosts.map((p) => (
                  <tr key={p.id}>
                    <Td className="max-w-[380px] break-words">
                      {p.idea}
                      <span className="block text-xs text-neutral-500">
                        <Ago at={p.createdAt} />
                      </span>
                    </Td>
                    <Td className="text-xs">{p.hackathonTitle}</Td>
                    <Td className="whitespace-nowrap text-xs">
                      {p.members}/{p.teamMax} · {p.open ? 'open' : 'closed'}
                    </Td>
                    <Td>
                      <Status row={p} />
                    </Td>
                    <Td right>{itemButton('team-post', p, 'this team post')}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No team posts.</p>
          ))}
        {tab === 'requests' &&
          (data.requests.length || data.invites.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Type</Th>
                  <Th>To</Th>
                  <Th>Hackathon</Th>
                  <Th>Message</Th>
                  <Th>Status</Th>
                  <Th right> </Th>
                </tr>
              </thead>
              <tbody>
                {[...data.requests.map((r) => ({ ...r, type: 'request' as const })), ...data.invites.map((i) => ({ ...i, type: 'invite' as const }))]
                  .sort((x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime())
                  .map((r) => (
                    <tr key={`${r.type}-${r.id}`}>
                      <Td className="text-xs">{r.type === 'request' ? 'Join request' : 'Invite'}</Td>
                      <Td className="text-xs">{r.to ? `@${r.to}` : '–'}</Td>
                      <Td className="text-xs">{r.hackathonSlug || '–'}</Td>
                      <Td className="max-w-[320px] break-words text-xs">{r.message || '–'}</Td>
                      <Td>
                        <Badge tone="muted">{r.status}</Badge>
                      </Td>
                      <Td right>
                        {r.status === 'pending' && (
                          <Button size="sm" busy={busy === `${r.type}:${r.id}`} disabled={Boolean(busy)} onClick={() => content(r.type, r.id, 'withdraw', `this ${r.type}`)}>
                            Withdraw
                          </Button>
                        )}
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No join requests or invites.</p>
          ))}
        {tab === 'wins' &&
          (data.wins.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Story</Th>
                  <Th>Result</Th>
                  <Th>Posted</Th>
                  <Th>Status</Th>
                  <Th right> </Th>
                </tr>
              </thead>
              <tbody>
                {data.wins.map((w) => (
                  <tr key={w.id}>
                    <Td>
                      <a href={`/wins/${w.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {w.projectName}
                      </a>
                      <span className="block text-xs text-neutral-500">{w.hackathon}</span>
                    </Td>
                    <Td className="text-xs">{w.result}</Td>
                    <Td className="text-xs">
                      <Ago at={w.createdAt} />
                    </Td>
                    <Td>
                      <Status row={w} />
                    </Td>
                    <Td right>{itemButton('win', w, `the story “${w.projectName}”`)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">No winning stories.</p>
          ))}
        {tab === 'shared' && (
          <div className="space-y-4 p-4">
            {data.submissions.length ? (
              <Table>
                <thead>
                  <tr>
                    <Th>What they shared</Th>
                    <Th>Status</Th>
                    <Th>When</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.submissions.map((s) => (
                    <tr key={s.id}>
                      <Td>
                        <Link href={`/admin/review/${s.id}`} className="font-medium hover:underline">
                          {s.title}
                        </Link>
                        {s.url && (
                          <span className="block break-all text-xs">
                            <ExtLink href={s.url}>{s.url}</ExtLink>
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Badge tone="muted">{s.status}</Badge>
                      </Td>
                      <Td className="text-xs">
                        <Ago at={s.createdAt} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <p className="text-sm text-neutral-500">Nothing shared.</p>
            )}
            {data.hackathonsAdded.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-neutral-600">Listings that came from them</p>
                <ul className="space-y-1 text-sm">
                  {data.hackathonsAdded.map((h) => (
                    <li key={h.id}>
                      <Link href={`/admin/hackathons/${h.id}`} className="hover:underline">
                        {h.title}
                      </Link>{' '}
                      <Badge tone="muted">{h.state}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {tab === 'saved' &&
          (data.saved.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Hackathon</Th>
                  <Th>Their status</Th>
                  <Th>Saved</Th>
                </tr>
              </thead>
              <tbody>
                {data.saved.map((s) => (
                  <tr key={s.hackathonSlug}>
                    <Td>{s.title}</Td>
                    <Td className="text-xs">{s.status}</Td>
                    <Td className="text-xs">
                      <Ago at={s.createdAt} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">Nothing saved.</p>
          ))}
        {tab === 'flags' &&
          (data.flags.length ? (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Where</Th>
                  <Th>What they tried to post</Th>
                  <Th>Matched</Th>
                  <Th>When</Th>
                </tr>
              </thead>
              <tbody>
                {data.flags.map((f) => (
                  <tr key={f.id}>
                    <Td className="text-xs">{f.kind}</Td>
                    <Td className="max-w-[420px] break-words">{f.excerpt}</Td>
                    <Td className="text-xs">{f.words.join(', ')}</Td>
                    <Td className="text-xs">
                      <Ago at={f.createdAt} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="p-4 text-sm text-neutral-500">The word filter never stopped them.</p>
          ))}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Activity timeline">
          {data.timeline.length ? (
            <ol className="space-y-2 text-sm">
              {data.timeline.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-24 shrink-0 text-xs text-neutral-500">
                    <Ago at={t.at} />
                  </span>
                  <span className="min-w-0 break-words">
                    <span className="mr-1.5 text-[11px] uppercase tracking-wide text-neutral-500">{t.kind}</span>
                    {t.href ? (
                      <Link href={t.href} className="hover:underline" target={t.href.startsWith('/admin') ? undefined : '_blank'}>
                        {t.text}
                      </Link>
                    ) : (
                      t.text
                    )}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty title="Nothing yet" />
          )}
        </Panel>
        <Panel title="Recent visits (signed in)">
          {a.recent.length ? (
            <ol className="space-y-1 text-sm">
              {a.recent.map((v, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{v.path}</span>
                  <span className="shrink-0 text-xs text-neutral-500">
                    {duration(v.durationMs)} · {v.device} · <Ago at={v.createdAt} />
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-neutral-500">No visits recorded.</p>
          )}
          {a.events.filter((e) => e.type === 'register').length > 0 && (
            <div className="mt-4 border-t border-neutral-200 pt-3">
              <p className="mb-1 text-xs font-medium text-neutral-600">Register clicks</p>
              <ul className="space-y-0.5 text-sm">
                {a.events
                  .filter((e) => e.type === 'register')
                  .map((e, i) => (
                    <li key={i}>
                      {e.target} <span className="text-xs text-neutral-500">(<Ago at={e.at} />)</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
