'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Inbox as InboxIcon, Undo2, X } from 'lucide-react';
import Avatar from '@/components/Avatar';
import type { Inbox, JoinRequest, TeamInvite, TeamStudent } from '@/data/teamPosts';
import { timeAgo } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ActionError, SampleBadge, StatusChip } from './TeamParts';

type Answer = 'accepted' | 'declined';

interface MyRequestsPanelProps {
  requests: Inbox<JoinRequest>;
  invites: Inbox<TeamInvite>;
  onAnswerRequest: (id: string, status: Answer) => Promise<void>;
  onWithdrawRequest: (id: string) => Promise<void>;
  onAnswerInvite: (id: string, status: Answer) => Promise<void>;
  onWithdrawInvite: (id: string) => Promise<void>;
}

interface Row {
  key: string;
  person: TeamStudent;
  line: React.ReactNode;
  message: string;
  at: string;
  status: JoinRequest['status'];
  onAnswer?: (status: Answer) => Promise<void>;
  onWithdraw?: () => Promise<void>;
}

// Waiting ones first, then the latest.
const byPending = (a: Row, b: Row) =>
  Number(b.status === 'pending') - Number(a.status === 'pending') || Date.parse(b.at) - Date.parse(a.at);

function PersonLink({ person }: { person: TeamStudent }) {
  if (!person.id) return <span className="font-semibold">{person.name}</span>;
  return (
    <Link href={`/u/${person.handle}`} className="font-semibold hover:underline">
      {person.name}
    </Link>
  );
}

function RowItem({ row, now }: { row: Row; now: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const pending = row.status === 'pending';

  return (
    <li className="rounded-xl bg-ink/5 p-3">
      <div className="flex items-start gap-3">
        <Avatar name={row.person.name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">
            {row.line} {row.person.isSample && <SampleBadge />}
          </p>
          {row.message && <p className="mt-0.5 line-clamp-2 text-xs italic text-ink/70">“{row.message}”</p>}
          <p className="mt-0.5 text-[11px] text-ink/50">{timeAgo(row.at, now)}</p>
        </div>
        {!(pending && (row.onAnswer || row.onWithdraw)) && <StatusChip status={row.status} />}
      </div>
      {pending && row.onAnswer && (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={busy} onClick={() => run(() => row.onAnswer!('accepted'))} className="btn-primary flex-1 px-3 py-1.5 text-xs">
            <Check className="h-3.5 w-3.5" />
            Accept
          </button>
          <button type="button" disabled={busy} onClick={() => run(() => row.onAnswer!('declined'))} className="btn-secondary flex-1 px-3 py-1.5 text-xs">
            <X className="h-3.5 w-3.5" />
            Decline
          </button>
        </div>
      )}
      {pending && row.onWithdraw && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusChip status="pending" />
          <button
            type="button"
            disabled={busy}
            onClick={() => run(row.onWithdraw!)}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-ink/70 hover:bg-ink/10 hover:text-ink"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Withdraw
          </button>
        </div>
      )}
      <ActionError>{error}</ActionError>
    </li>
  );
}

function Column({ title, empty, rows, now }: { title: string; empty: string; rows: Row[]; now: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm text-ink">
        {title} ({rows.length})
      </h3>
      {rows.length === 0 ? (
        <p className="text-sm text-ink/60">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <RowItem key={row.key} row={row} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** Join requests and invites, both ways. Rendered only once the student's data has loaded. */
export default function MyRequestsPanel({
  requests,
  invites,
  onAnswerRequest,
  onWithdrawRequest,
  onAnswerInvite,
  onWithdrawInvite,
}: MyRequestsPanelProps) {
  const [open, setOpen] = useState(true);
  const now = new Date().toISOString();
  const event = (r: JoinRequest | TeamInvite) => r.post?.hackathonTitle;

  const received: Row[] = [
    ...requests.received.map<Row>((r) => ({
      key: `rq-${r.id}`,
      person: r.from,
      line: (
        <>
          <PersonLink person={r.from} /> wants to join your team
          {event(r) && <span className="text-ink/60"> for {event(r)}</span>}
        </>
      ),
      message: r.message,
      at: r.updatedAt,
      status: r.status,
      onAnswer: (status) => onAnswerRequest(r.id, status),
    })),
    ...invites.received.map<Row>((i) => ({
      key: `in-${i.id}`,
      person: i.from,
      line: (
        <>
          <PersonLink person={i.from} /> invited you to their team
          {i.post && !i.post.removed && <span className="text-ink/60"> for {event(i)}</span>}
        </>
      ),
      message: i.message,
      at: i.updatedAt,
      status: i.status,
      onAnswer: (status) => onAnswerInvite(i.id, status),
    })),
  ].sort(byPending);

  const sent: Row[] = [
    ...requests.sent.map<Row>((r) => ({
      key: `rq-${r.id}`,
      person: r.to,
      line: r.post?.removed ? (
        <span className="text-ink/60">A team post by {r.to.name} that was removed</span>
      ) : (
        <>
          Asked to join <PersonLink person={r.to} />’s team
          {event(r) && <span className="text-ink/60"> for {event(r)}</span>}
        </>
      ),
      message: r.message,
      at: r.updatedAt,
      status: r.status,
      onWithdraw: r.post?.removed ? undefined : () => onWithdrawRequest(r.id),
    })),
    ...invites.sent.map<Row>((i) => ({
      key: `in-${i.id}`,
      person: i.to,
      line: (
        <>
          Invited <PersonLink person={i.to} />
          {i.post && !i.post.removed && <span className="text-ink/60"> to your team for {event(i)}</span>}
        </>
      ),
      message: i.message,
      at: i.updatedAt,
      status: i.status,
      onWithdraw: () => onWithdrawInvite(i.id),
    })),
  ].sort(byPending);

  const waiting = received.filter((r) => r.status === 'pending').length;

  return (
    <section id="my-requests" className="card mb-6 scroll-mt-24 p-5" aria-labelledby="my-requests-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="my-requests-title" className="flex items-center gap-2 font-sans text-base font-bold normal-case tracking-normal">
          <InboxIcon className="h-5 w-5" />
          My requests & invites
          {waiting > 0 && (
            <span className="rounded-full bg-accent px-2 text-xs font-bold text-white">
              {waiting}
              <span className="sr-only"> waiting for you</span>
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="my-requests-body"
          className="inline-flex items-center gap-1 text-xs font-semibold text-ink/70 hover:text-ink"
        >
          {open ? 'Hide' : 'Show'}
          <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
        </button>
      </div>

      {open && (
        <div id="my-requests-body" className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Column
            title="For you"
            empty="Nothing yet. When someone asks to join your team or invites you, it shows up here."
            rows={received}
            now={now}
          />
          <Column
            title="Sent by you"
            empty="Nothing yet. Ask to join a team below, or invite students from the other tab."
            rows={sent}
            now={now}
          />
        </div>
      )}
    </section>
  );
}
