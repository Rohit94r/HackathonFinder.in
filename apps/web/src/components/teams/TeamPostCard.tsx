'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Clock, Lock, LockOpen, MapPin, MessageCircle, Navigation, Send, Ticket, Trash2, Undo2, UserPlus } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import type { JoinRequest, TeamPost } from '@/data/teamPosts';
import { goToLogin } from '@/lib/apiClient';
import { deadlineLabel } from '@/lib/format';
import { ActionError, MatchBadge, MatchNote, ModeBadge, SampleBadge, SkillChips, StatusLine, TeamSize, YouBadge } from './TeamParts';
import { distanceLabel, firstName, joinList, postAge, postedLabel, type SkillMatch, type TeamEvent } from './teamUtils';

interface TeamPostCardProps {
  post: TeamPost;
  /** The open listing the team is for; undefined for "any hackathon" or a listing that closed. */
  event?: TeamEvent;
  km?: number;
  match: SkillMatch | null;
  signedIn: boolean;
  isMine?: boolean;
  /** The student's own request to join this team, if they sent one. */
  request?: JoinRequest;
  /** The chat with the team's author, once they're connected. */
  conversationId?: string;
  /** Set when the viewer still has to set up their profile: actions go there first. */
  setupHref?: string;
  draftMessage: string;
  onRequest?: (message: string) => Promise<void>;
  onWithdraw?: () => Promise<void>;
  onToggleOpen?: () => Promise<void>;
  onRemove?: () => Promise<void>;
}

const messageOf = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

/** One team looking for members: who, where, what for, the idea, skills, seats and what you can do. */
export default function TeamPostCard({
  post,
  event,
  km,
  match,
  signedIn,
  isMine = false,
  request,
  conversationId,
  setupHref,
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
  const href = isMine ? '/profile' : author.id ? `/u/${author.handle}` : undefined;
  const full = post.members >= post.teamMax;
  const first = firstName(author.name);
  const chat = request?.conversationId ?? conversationId;

  const run = async (fn?: () => Promise<void>) => {
    if (!fn) return false;
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
    if (setupHref) return window.location.assign(setupHref);
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

  const profileButton = href && (
    <Link href={href} className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm">
      {isMine ? 'My profile' : 'View profile'}
    </Link>
  );
  const messageButton = chat && (
    <Link href={`/messages/${chat}`} className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm">
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      Message
    </Link>
  );

  return (
    <article className="card flex h-full flex-col p-5" aria-label={`${author.name}’s team for ${post.hackathonTitle}`}>
      <header className="flex items-start gap-3">
        {href ? (
          <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
            <Avatar name={author.name} image={author.image} size="lg" className="ring-0" />
          </Link>
        ) : (
          <Avatar name={author.name} image={author.image} size="lg" className="ring-0" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold leading-tight text-ink">
            {href ? (
              <Link href={href} className="hover:underline">
                {author.name}
              </Link>
            ) : (
              author.name
            )}
            {isMine && <YouBadge />}
            {author.isSample && <SampleBadge />}
          </p>
          {author.about && <p className="mt-0.5 truncate text-xs text-ink/60">{author.about}</p>}
          {author.college && <p className="truncate text-xs text-ink/60">{author.college}</p>}
        </div>
        {match && <MatchBadge match={match} />}
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/70">
        <span className="inline-flex items-center gap-1">
          {km !== undefined ? <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
          {post.city === 'online' ? 'Online team' : cityName(post.city)}
          {km !== undefined && <strong className="font-semibold text-ink">· {distanceLabel(km)}</strong>}
        </span>
        <ModeBadge mode={post.mode} />
        {isMine && !post.open && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-semibold text-ink/80">
            <Lock className="h-3 w-3" aria-hidden="true" />
            {full ? 'Full' : 'Closed'}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-ink/[0.04] px-3 py-2.5">
        <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">Building for</p>
          {event ? (
            <Link href={`/hackathons/${post.hackathonSlug}`} className="block truncate text-sm font-semibold text-ink hover:underline">
              {post.hackathonTitle}
            </Link>
          ) : (
            <p className="truncate text-sm font-semibold text-ink">{post.hackathonSlug ? post.hackathonTitle : 'Any upcoming hackathon'}</p>
          )}
          {event ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {deadlineLabel(event.daysToDeadline)}
            </p>
          ) : (
            !post.hackathonSlug && <p className="mt-0.5 text-xs text-ink/60">Open to teaming up for the next good one</p>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-4 break-words text-sm leading-6 text-ink/80">{post.idea}</p>

      {match && match.matched.length > 0 && (
        <div className="mt-3">
          <MatchNote>You have {joinList(match.matched)} they need.</MatchNote>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <SkillChips label="Has" skills={post.has} />
        <SkillChips label="Needs" skills={post.needs} highlight={match?.matched} />
      </div>

      <div className="mt-auto pt-5">
        <TeamSize members={post.members} teamMax={post.teamMax} />
        <p className="mt-2 text-[11px] text-ink/45">{postedLabel(postAge(post.createdAt))}</p>

        <div className="mt-4 border-t border-ink/10 pt-4">
          {isMine ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void run(onToggleOpen)}
                disabled={busy || (full && !post.open)}
                className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm"
              >
                {post.open ? <Lock className="h-4 w-4" aria-hidden="true" /> : <LockOpen className="h-4 w-4" aria-hidden="true" />}
                {post.open ? 'Close post' : full ? 'Team full' : 'Open again'}
              </button>
              <button type="button" onClick={remove} disabled={busy} className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          ) : author.isSample ? (
            <>
              <StatusLine>A sample team, here to show how Team Finder works. It can’t take requests.</StatusLine>
              <div className="flex flex-wrap gap-2">{profileButton}</div>
            </>
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
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {busy ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {request?.status === 'pending' && <StatusLine tone="good">Request sent. {first} will get a notification.</StatusLine>}
              {request?.status === 'accepted' && <StatusLine tone="good">You’re on {first}’s team. Say hi in your chat.</StatusLine>}
              {request?.status === 'declined' && <StatusLine>{first} passed this time. Plenty of other teams here.</StatusLine>}
              <div className="flex flex-wrap gap-2">
                {request?.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => void run(onWithdraw)}
                    disabled={busy}
                    className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm"
                  >
                    <Undo2 className="h-4 w-4" aria-hidden="true" />
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
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {full ? 'Team full' : !post.open ? 'Closed' : signedIn ? 'Request to join' : 'Sign in to join'}
                    </button>
                  )
                )}
                {messageButton}
                {profileButton}
              </div>
            </>
          )}
          <ActionError>{error}</ActionError>
        </div>
      </div>
    </article>
  );
}
