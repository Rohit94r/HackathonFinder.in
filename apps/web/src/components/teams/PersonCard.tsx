'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { MapPin, MessageCircle, Navigation, Pencil, Send, Trophy, Undo2, UserPlus } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import type { Student, TeamInvite, TeamPost } from '@/data/teamPosts';
import { goToLogin } from '@/lib/apiClient';
import { ActionError, MatchBadge, MatchNote, SampleBadge, SkillChips, StatusLine, YouBadge } from './TeamParts';
import { distanceLabel, firstName, joinList, type SkillMatch } from './teamUtils';

interface PersonCardProps {
  person: Student;
  isMe?: boolean;
  km?: number;
  match: SkillMatch | null;
  /** Why the match matters, e.g. "your team needs". */
  matchReason?: string;
  signedIn?: boolean;
  /** The student's own open team posts, to invite someone to one of them. */
  myPosts?: TeamPost[];
  /** An invite the student already sent this person. */
  invite?: TeamInvite;
  /** The chat with this person, once they're connected. */
  conversationId?: string;
  /** Set when the viewer still has to set up their profile: actions go there first. */
  setupHref?: string;
  draftMessage?: (post?: TeamPost) => string;
  onInvite?: (message: string, postId?: string) => Promise<void>;
  onWithdrawInvite?: () => Promise<void>;
}

/** A student looking for a team: photo, who they are, what they bring, and invite or message. */
export default function PersonCard({
  person,
  isMe = false,
  km,
  match,
  matchReason,
  signedIn = false,
  myPosts = [],
  invite,
  conversationId,
  setupHref,
  draftMessage,
  onInvite,
  onWithdrawInvite,
}: PersonCardProps) {
  const id = useId();
  const href = isMe ? '/profile' : `/u/${person.handle}`;
  const stats = person.results;
  const first = firstName(person.name);
  const chat = invite?.conversationId ?? conversationId;
  const [writing, setWriting] = useState(false);
  const [postId, setPostId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openBox = () => {
    if (!signedIn) return goToLogin();
    if (setupHref) return window.location.assign(setupHref);
    const post = myPosts[0];
    setPostId(post?.id ?? '');
    setMessage(draftMessage?.(post) ?? '');
    setError(null);
    setWriting(true);
  };
  const pickPost = (next: string) => {
    setPostId(next);
    setMessage(draftMessage?.(myPosts.find((p) => p.id === next)) ?? message);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onInvite && (await run(() => onInvite(message.trim(), postId || undefined)))) setWriting(false);
  };

  const record =
    stats.hackathons === 0
      ? 'New to hackathons'
      : `${stats.hackathons} ${stats.hackathons === 1 ? 'hackathon' : 'hackathons'}${stats.wins ? ` · ${stats.wins} ${stats.wins === 1 ? 'win' : 'wins'}` : ''}`;

  const profileButton = (
    <Link href={href} className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm">
      View profile
    </Link>
  );

  return (
    <article className="card flex h-full flex-col p-5" aria-label={isMe ? 'Your profile' : person.name}>
      <header className="flex items-start gap-3">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="shrink-0">
          <Avatar name={person.name} image={person.image} size="lg" className="ring-0" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold leading-tight text-ink">
            <Link href={href} className="hover:underline">
              {person.name}
            </Link>
            {isMe && <YouBadge />}
            {person.isSample && <SampleBadge />}
          </p>
          {person.about && <p className="mt-0.5 truncate text-xs text-ink/60">{person.about}</p>}
          {person.college && <p className="truncate text-xs text-ink/60">{person.college}</p>}
        </div>
        {match && !isMe && <MatchBadge match={match} />}
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/70">
        <span className="inline-flex items-center gap-1">
          {km !== undefined ? <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
          {person.city ? cityName(person.city) : 'City not set'}
          {km !== undefined && <strong className="font-semibold text-ink">· {distanceLabel(km)}</strong>}
        </span>
        <span className="inline-flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          {record}
        </span>
      </div>

      {person.bio && <p className="mt-3 line-clamp-3 break-words text-sm leading-6 text-ink/80">{person.bio}</p>}

      {match && !isMe && match.matched.length > 0 && (
        <div className="mt-3">
          <MatchNote>
            Has {joinList(match.matched)} {matchReason}.
          </MatchNote>
        </div>
      )}

      <div className="mt-4">
        <SkillChips label="Skills" skills={person.skills} highlight={isMe ? [] : match?.matched} />
      </div>

      <div className="mt-auto pt-5">
        <div className="border-t border-ink/10 pt-4">
          {isMe ? (
            <Link href="/profile?edit=1&next=/teams" className="btn-secondary w-full px-3 py-2 text-sm">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit my profile
            </Link>
          ) : person.isSample ? (
            <>
              <StatusLine>A sample student, here to show how profiles look. They can’t get invites or messages.</StatusLine>
              <div className="flex flex-wrap gap-2">{profileButton}</div>
            </>
          ) : writing ? (
            <form onSubmit={submit} className="space-y-2">
              {myPosts.length > 0 && (
                <div>
                  <label htmlFor={`${id}-post`} className="label">
                    Invite to
                  </label>
                  <select id={`${id}-post`} value={postId} onChange={(e) => pickPost(e.target.value)} className="input py-2.5">
                    {myPosts.map((p) => (
                      <option key={p.id} value={p.id}>
                        My team for {p.hackathonSlug ? p.hackathonTitle : 'any hackathon'}
                      </option>
                    ))}
                    <option value="">No team yet, just say hi</option>
                  </select>
                </div>
              )}
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
                  {busy ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {invite?.status === 'pending' && <StatusLine tone="good">Invite sent. {first} will get a notification.</StatusLine>}
              {invite?.status === 'accepted' && <StatusLine tone="good">{first} accepted your invite. You can chat now.</StatusLine>}
              {invite?.status === 'declined' && <StatusLine>{first} said no thanks this time.</StatusLine>}
              <div className="flex flex-wrap gap-2">
                {invite?.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => onWithdrawInvite && void run(onWithdrawInvite)}
                    disabled={busy}
                    className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm"
                  >
                    <Undo2 className="h-4 w-4" aria-hidden="true" />
                    Withdraw invite
                  </button>
                ) : (
                  !invite && (
                    <button type="button" onClick={openBox} className="btn-primary flex-1 whitespace-nowrap px-3 py-2 text-sm">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                      {signedIn ? 'Invite to my team' : 'Sign in to invite'}
                    </button>
                  )
                )}
                {chat && (
                  <Link href={`/messages/${chat}`} className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    Message
                  </Link>
                )}
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
