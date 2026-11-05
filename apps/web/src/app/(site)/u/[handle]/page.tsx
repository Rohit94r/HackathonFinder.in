import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Activity, ArrowRight, Award, BadgeCheck, CalendarCheck, History, Info, Medal, MessageCircle, Pencil, Settings, Star, Trophy } from 'lucide-react';
import ActivityHeatmap from '@/components/profile/ActivityHeatmap';
import Badges from '@/components/profile/Badges';
import InviteButton from '@/components/profile/InviteButton';
import { EmptyNudge, Panel, ProfileLayout } from '@/components/profile/Panel';
import ProfileCard from '@/components/profile/ProfileCard';
import RecordList from '@/components/profile/RecordList';
import ResultRing from '@/components/profile/ResultRing';
import StatTiles from '@/components/profile/StatTiles';
import StoryCard from '@/components/profile/StoryCard';
import { myBadges } from '@/components/profile/badgeData';
import { fromUser } from '@/components/profile/profileData';
import { resultCounts, storyLinks } from '@/components/profile/profileTypes';
import { SampleBadge } from '@/components/teams/TeamParts';
import { getSessionUser } from '@/server/auth';
import { conversationBetween } from '@/server/chat';
import { getPublicProfile } from '@/server/profiles';

export const dynamic = 'force-dynamic';

// generateMetadata and the page share one database read per request.
const load = cache((handle: string) => getPublicProfile(handle));

export async function generateMetadata({ params }: { params: { handle: string } }): Promise<Metadata> {
  const profile = await load(params.handle);
  if (!profile) return { title: 'Profile not found', robots: { index: false } };
  const { user, stats } = profile;
  const record = stats.hackathons
    ? `${stats.hackathons} hackathon${stats.hackathons === 1 ? '' : 's'}, ${stats.wins} win${stats.wins === 1 ? '' : 's'}.`
    : 'New to hackathons.';
  const description = [`${user.name}’s hackathon profile on HackathonFinder.`, record, user.bio].filter(Boolean).join(' ').slice(0, 300);
  return {
    title: `${user.name} (@${user.handle})`,
    description,
    alternates: { canonical: `/u/${user.handle}` },
    openGraph: { title: `${user.name} (@${user.handle})`, description, type: 'profile' },
    // Sample students are made up, so search engines shouldn't list them.
    robots: user.isSample ? { index: false, follow: true } : undefined,
  };
}

export default async function PersonPage({ params }: { params: { handle: string } }) {
  const [profile, viewer] = await Promise.all([load(params.handle), getSessionUser()]);
  if (!profile) notFound();

  const { user, record, stats, counts, stories } = profile;
  const isMe = viewer?.id === user.id;
  const firstName = user.name.split(' ')[0];
  const highlight = stats.wins > 1 ? `${stats.wins}× winner` : stats.wins === 1 ? 'Winner' : undefined;
  // Students who teamed up (an accepted invite or request) can message each other.
  const chatId = viewer && !isMe && !user.isSample ? await conversationBetween(viewer.id, user.id) : null;
  const activityTotal = Object.values(profile.heatmap).reduce((a, b) => a + b, 0);

  return (
    <section className="bg-surface py-8 sm:py-12">
      <div className="container-page">
        <ProfileLayout
          side={
            <>
              <ProfileCard profile={fromUser(user)} highlight={highlight} badge={user.isSample ? <SampleBadge /> : undefined}>
                {isMe ? (
                  <>
                    <Link href="/profile?edit=1" className="btn-secondary w-full">
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                      Edit profile
                    </Link>
                    <Link href="/settings" className="btn-secondary w-full">
                      <Settings className="h-4 w-4" aria-hidden="true" />
                      Settings
                    </Link>
                    <p className="text-xs text-ink/60">This is how other students see your profile.</p>
                  </>
                ) : user.isSample ? (
                  <p className="flex items-start gap-2 rounded-lg bg-ink/[0.05] px-3 py-2.5 text-xs leading-5 text-ink/70">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    {firstName} is a sample student, here so you can see how profiles look. Sample students can’t get invites or
                    messages.
                  </p>
                ) : (
                  <>
                    {chatId && (
                      <Link href={`/messages/${chatId}`} className="btn-primary w-full">
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        Message {firstName}
                      </Link>
                    )}
                    <InviteButton handle={user.handle} name={user.name} secondary={Boolean(chatId)} />
                  </>
                )}
              </ProfileCard>
            </>
          }
        >
          <StatTiles
            items={[
              { label: 'Hackathons', value: stats.hackathons, icon: CalendarCheck, tone: 'cyan' },
              { label: 'Wins', value: stats.wins, icon: Trophy, tone: 'amber' },
              { label: 'Podiums', value: stats.podiums, icon: Medal, tone: 'pink' },
              { label: 'Finals', value: stats.finals, icon: Star, tone: 'violet' },
            ]}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <Panel title="Results" icon={Award}>
              <ResultRing
                counts={resultCounts(record)}
                caption={stats.hackathons ? undefined : `${firstName} hasn’t added a hackathon yet.`}
              />
            </Panel>
            <Panel title="Badges" icon={BadgeCheck}>
              <Badges states={myBadges(profile.badgeInput)} />
            </Panel>
          </div>

          <Panel title="Activity" icon={Activity}>
            <ActivityHeatmap counts={profile.heatmap} todayKey={profile.todayKey} />
            {activityTotal === 0 && (
              <p className="mt-3 text-sm text-ink/60">
                {isMe ? 'Your heatmap fills up as you save, register, post and reply.' : `${firstName} hasn’t been active in the past year.`}
              </p>
            )}
          </Panel>

          <Panel title="Hackathon record" icon={History} action={isMe ? { href: '/profile#record', label: 'Manage' } : undefined}>
            {record.length > 0 ? (
              <RecordList record={record} storyLinks={storyLinks(record, stories)} />
            ) : isMe ? (
              <EmptyNudge text="Add hackathons you’ve been to. They fill your results ring and badges." href="/profile#record" cta="Add a hackathon" />
            ) : (
              <EmptyNudge text={`No hackathons yet. ${firstName} may be looking for a first team.`} href="/teams" cta="Open Team Finder" />
            )}
          </Panel>

          {stories.length > 0 && (
            <section aria-labelledby="their-wins">
              <h2 id="their-wins" className="mb-4 flex items-center gap-2 font-sans text-lg font-bold normal-case tracking-normal">
                <Trophy className="h-5 w-5" aria-hidden="true" />
                {isMe ? 'My winning stories' : `${firstName}’s winning stories`}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {stories.map((s) => (
                  <StoryCard key={s.slug} story={s} mine={isMe} />
                ))}
              </div>
            </section>
          )}

          <dl className="card grid grid-cols-2 gap-4 p-5 text-center sm:grid-cols-4">
            {[
              { label: 'Discussions', value: counts.threads },
              { label: 'Replies', value: counts.replies },
              { label: 'Stories', value: counts.wins },
              { label: 'Team posts', value: counts.teamPosts },
            ].map((c) => (
              <div key={c.label}>
                <dt className="text-xs font-medium uppercase tracking-wider text-ink/60">{c.label}</dt>
                <dd className="mt-1 font-display text-2xl text-ink">{c.value.toLocaleString('en-US')}</dd>
              </div>
            ))}
          </dl>

          <div className="card flex flex-col gap-5 p-7 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-3xl">Looking for a team?</h2>
              <p className="mt-2 max-w-md text-ink/70">
                {user.lookingForTeam && !isMe
                  ? `${firstName} is open to joining one. Find more teammates near you on Team Finder.`
                  : 'Find teammates near you, or post what your team still needs.'}
              </p>
            </div>
            <Link href="/teams" className="btn-primary shrink-0">
              Find teammates
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </ProfileLayout>
      </div>
    </section>
  );
}
