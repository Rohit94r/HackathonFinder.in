'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Lock, LockOpen, MapPin, Navigation, Send, Trash2, Undo2, UserPlus } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import type { JoinRequest, TeamPost } from '@/data/teamPosts';
import { goToLogin } from '@/lib/apiClient';
import { deadlineLabel } from '@/lib/format';
import { ActionError, MatchBadge, MatchNote, ModeBadge, SampleBadge, SkillChips, TeamSize, YouBadge } from './TeamParts';
import { distanceLabel, firstName, joinList, postAge, postedLabel, type SkillMatch, type TeamEvent } from './teamUtils';

interface TeamPostCardProps {
  post: TeamPost;
  /** Undefined when the event is no longer open. */
  event?: TeamEvent;
  km?: number;
  match: SkillMatch | null;
  signedIn: boolean;
  isMine?: boolean;
  /** The student's own request to join this team, if they sent one. */
  request?: JoinRequest;
  draftMessage: string;
  onRequest?: (message: string) => Promise<void>;
  onWithdraw?: () => Promise<void>;
  onToggleOpen?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

export default function TeamPostCard({
  post,
  event,
  km,
  match,
  signedIn,
  isMine = false,
  request,
  draftMessage,
  onRequest,
  onWithdraw,
  onToggleOpen,
  onRemove,
}: TeamPostCardProps) {
  const id = useId();
  const [writing, setWriting] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { author } = post;
  const href = isMine ? '/profile' : `/u/${author.handle}`;
  const full = post.members >= post.teamMax;
  const first = firstName(author.name);

  const run = async (fn?: () => Promise<void>) => {
    if (!fn) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(messageOf(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openBox = () => {
    if (!signedIn) return goToLogin();
    setMessage(draftMessage);
    setError(null);
    setWriting(true);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => onRequest?.(message.trim()) ?? Promise.resolve())) setWriting(false);
  };
  const remove = () => {
    if (window.confirm('Remove this team post? Students won’t see it any more.')) void run(onRemove);
  };

  return (
    <article className="card flex flex-col p-5" aria-label={`${author.name}’s team for ${post.hackathonTitle}`}>
      <div className="flex items-start gap-3">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Avatar name={author.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
            <Link href={href} className="hover:underline">
              {author.name}
            </Link>
            {isMine && <YouBadge />}
            {author.isSample && <SampleBadge />}
          </p>
          {author.about && <p className="text-xs text-ink/60">{author.about}</p>}
          {author.college && <p className="truncate text-xs text-ink/60">{author.college}</p>}
        </div>
        {match && <MatchBadge match={match} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/70">
        <span className="inline-flex items-center gap-1">
          {km !== undefined ? <Navigation className="h-3.5 w-3.5 text-ink" /> : <MapPin className="h-3.5 w-3.5" />}
          {post.city === 'online' ? 'Online team' : cityName(post.city)}
          {km !== undefined && <strong className="font-semibold text-ink">· {distanceLabel(km)}</strong>}
        </span>
        <ModeBadge mode={post.mode} />
        {isMine && !post.open && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink/80">
            <Lock className="h-3 w-3" />
            {full ? 'Full' : 'Closed'}
          </span>
        )}
      </div>

      <div className="mt-4">
        {event ? (
          <Link href={`/hackathons/${post.hackathonSlug}`} className="text-sm font-semibold text-ink hover:underline">
            For: {post.hackathonTitle}
          </Link>
        ) : (
          <p className="text-sm font-semibold text-ink">For: {post.hackathonTitle}</p>
        )}
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
          <Clock className="h-3 w-3" />
          {event ? deadlineLabel(event.daysToDeadline) : 'Registration closed'}
        </p>
      </div>

      <p className="mt-3 flex-1 text-sm leading-6 text-ink/80">{post.idea}</p>

      {match && match.matched.length > 0 && (
        <div className="mt-3">
          <MatchNote>You have {joinList(match.matched)} they need.</MatchNote>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {post.has.length > 0 && <SkillChips label="Has" skills={post.has} />}
        <SkillChips label="Needs" skills={post.needs} highlight={match?.matched} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <TeamSize members={post.members} teamMax={post.teamMax} />
        <span className="text-xs text-ink/50">{postedLabel(postAge(post.createdAt))}</span>
      </div>

      <div className="mt-4 border-t border-ink/10 pt-4">
        {isMine ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void run(onToggleOpen)}
              disabled={busy || (full && !post.open)}
              className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm"
            >
              {post.open ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              {post.open ? 'Close post' : full ? 'Team full' : 'Open again'}
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm text-rose-600 dark:text-rose-300"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </button>
          </div>
        ) : writing ? (
          <form onSubmit={submit} className="space-y-2">
            <label htmlFor={`${id}-msg`} className="label">
              Message to {first}
            </label>
            <textarea
              id={`${id}-msg`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              autoFocus
              className="input min-h-[90px]"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setWriting(false)} className="btn-secondary px-3 py-2 text-sm">
                Cancel
              </button>
              <button type="submit" disabled={busy} className="btn-primary px-3 py-2 text-sm">
                <Send className="h-4 w-4" />
                {busy ? 'Sending…' : 'Send request'}
              </button>
            </div>
          </form>
        ) : (
          <>
            {request && (
              <p
                role="status"
                className={
                  request.status === 'declined'
                    ? 'mb-3 text-xs font-semibold text-ink/60'
                    : 'mb-3 flex items-start gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300'
                }
              >
                {request.status !== 'declined' && <Check className="h-3.5 w-3.5 shrink-0" />}
                {request.status === 'accepted'
                  ? `You’re on ${first}’s team.`
                  : request.status === 'declined'
                    ? `${first} passed this time. Plenty of other teams below.`
                    : author.isSample
                      ? `Request sent. ${first} is a sample student, so this one is just for show.`
                      : `Request sent. ${first} will get a notification.`}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {request?.status === 'pending' ? (
                <button
                  type="button"
                  onClick={() => void run(onWithdraw)}
                  disabled={busy}
                  className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm"
                >
                  <Undo2 className="h-4 w-4" />
                  Withdraw
                </button>
              ) : (
                !request && (
                  <button
                    type="button"
                    onClick={openBox}
                    disabled={full || !post.open}
                    className="btn-primary flex-1 whitespace-nowrap px-3 py-2 text-sm"
                  >
                    <UserPlus className="h-4 w-4" />
                    {full ? 'Team full' : !post.open ? 'Closed' : signedIn ? 'Request to join' : 'Sign in to join'}
                  </button>
                )
              )}
              <Link href={href} className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm">
                View profile
              </Link>
            </div>
          </>
        )}
        <ActionError>{error}</ActionError>
      </div>
    </article>
  );
}
