'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Check, MapPin, Navigation, Pencil, Send, Trophy, Undo2, UserPlus } from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import Avatar from '@/components/Avatar';
import type { Student, TeamInvite, TeamPost } from '@/data/teamPosts';
import { goToLogin } from '@/lib/apiClient';
import { ActionError, MatchBadge, MatchNote, SampleBadge, SkillChips, YouBadge } from './TeamParts';
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
  draftMessage?: (post?: TeamPost) => string;
  onInvite?: (message: string, postId?: string) => Promise<void>;
  onWithdrawInvite?: () => Promise<void>;
}

export default function PersonCard({
  person,
  isMe = false,
  km,
  match,
  matchReason,
  signedIn = false,
  myPosts = [],
  invite,
  draftMessage,
  onInvite,
  onWithdrawInvite,
}: PersonCardProps) {
  const id = useId();
  const href = isMe ? '/profile' : `/u/${person.handle}`;
  const stats = person.results;
  const first = firstName(person.name);
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

  return (
    <article className="card flex flex-col p-5" aria-label={isMe ? 'Your profile' : person.name}>
      <div className="flex items-start gap-3">
        <Link href={href} tabIndex={-1} aria-hidden="true">
          <Avatar name={person.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-semibold text-ink">
            <Link href={href} className="hover:underline">
              {person.name}
            </Link>
            {isMe && <YouBadge />}
            {person.isSample && <SampleBadge />}
          </p>
          {person.about && <p className="text-xs text-ink/60">{person.about}</p>}
          {person.college && <p className="truncate text-xs text-ink/60">{person.college}</p>}
        </div>
        {match && !isMe && <MatchBadge match={match} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink/70">
        <span className="inline-flex items-center gap-1">
          {km !== undefined ? <Navigation className="h-3.5 w-3.5 text-ink" /> : <MapPin className="h-3.5 w-3.5" />}
          {person.city ? cityName(person.city) : 'City not set'}
          {km !== undefined && <strong className="font-semibold text-ink">· {distanceLabel(km)}</strong>}
        </span>
        <span className="inline-flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" />
          {stats.hackathons === 0
            ? 'New to hackathons'
            : `${stats.hackathons} ${stats.hackathons === 1 ? 'hackathon' : 'hackathons'}${stats.wins ? ` · ${stats.wins} ${stats.wins === 1 ? 'win' : 'wins'}` : ''}`}
        </span>
      </div>

      {person.bio && <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-ink/80">{person.bio}</p>}

      {match && !isMe && match.matched.length > 0 && (
        <div className="mt-3">
          <MatchNote>
            Has {joinList(match.matched)} {matchReason}.
          </MatchNote>
        </div>
      )}

      <div className="mt-4">
        {person.skills.length > 0 ? (
          <SkillChips skills={person.skills} highlight={isMe ? [] : match?.matched} />
        ) : (
          <p className="text-xs text-ink/60">No skills added yet.</p>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="border-t border-ink/10 pt-4">
          {isMe ? (
            <Link href="/profile" className="btn-secondary w-full px-3 py-2 text-sm">
              <Pencil className="h-4 w-4" />
              Edit my profile
            </Link>
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
                        My team for {p.hackathonTitle}
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
                  <Send className="h-4 w-4" />
                  {busy ? 'Sending…' : 'Send invite'}
                </button>
              </div>
            </form>
          ) : (
            <>
              {invite && (
                <p
                  role="status"
                  className={
                    invite.status === 'declined'
                      ? 'mb-3 text-xs font-semibold text-ink/60'
                      : 'mb-3 flex items-start gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300'
                  }
                >
                  {invite.status !== 'declined' && <Check className="h-3.5 w-3.5 shrink-0" />}
                  {invite.status === 'accepted'
                    ? `${first} accepted your invite.`
                    : invite.status === 'declined'
                      ? `${first} said no thanks this time.`
                      : person.isSample
                        ? `Invite sent. ${first} is a sample student, so this one is just for show.`
                        : `Invite sent. ${first} will get a notification.`}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {invite?.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => onWithdrawInvite && void run(onWithdrawInvite)}
                    disabled={busy}
                    className="btn-secondary flex-1 whitespace-nowrap px-3 py-2 text-sm"
                  >
                    <Undo2 className="h-4 w-4" />
                    Withdraw invite
                  </button>
                ) : (
                  !invite && (
                    <button type="button" onClick={openBox} className="btn-primary flex-1 whitespace-nowrap px-3 py-2 text-sm">
                      <UserPlus className="h-4 w-4" />
                      {signedIn ? 'Invite to my team' : 'Sign in to invite'}
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
      </div>
    </article>
  );
}
