'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  Activity as ActivityIcon,
  Award,
  BadgeCheck,
  Bookmark,
  CalendarCheck,
  CalendarDays,
  Eye,
  Flag,
  History,
  Map as MapIcon,
  Medal,
  MessagesSquare,
  Pencil,
  Reply,
  Rocket,
  Settings,
  Star,
  Ticket,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cityName } from '@hackathonfinder/shared';
import SignInPrompt from '@/components/auth/SignInPrompt';
import { PHOTOS } from '@/components/landing/photos';
import { useActivity, type Activity, type ActivityType } from '@/lib/activity';
import { timeAgo } from '@/lib/format';
import { useFollowedCities } from '@/lib/useFollowedCities';
import { useMe } from '@/lib/useMe';
import { useProfile, type MyProfile } from '@/lib/useProfile';
import { TRACK_LABELS, useSaved, type TrackStatus } from '@/lib/useSaved';
import { cn } from '@/lib/cn';
import ActivityHeatmap from './ActivityHeatmap';
import Badges from './Badges';
import { myBadges } from './badgeData';
import { countsFromTimestamps, istDayKey } from './heatmap';
import { EmptyNudge, Panel, ProfileLayout } from './Panel';
import ProfileCard from './ProfileCard';
import ProfileForm from './ProfileForm';
import ProfileSetupCard from './ProfileSetupCard';
import { fromUser } from './profileData';
import { recordStats, resultCounts, storyLinks, type ProfileRecord, type ProfileStory, type PublicProfile } from './profileTypes';
import RecordManager from './RecordManager';
import ResultRing from './ResultRing';
import StatTiles from './StatTiles';
import StoryCard from './StoryCard';
import VerifyEmailBanner from './VerifyEmailBanner';

export interface ProfileEvent {
  slug: string;
  title: string;
}

const ACTIVITY_TEXT: Record<ActivityType, { verb: string; icon: LucideIcon }> = {
  saved: { verb: 'Saved', icon: Bookmark },
  registered: { verb: 'Registered for', icon: Ticket },
  submitted: { verb: 'Submitted to', icon: Rocket },
  done: { verb: 'Finished', icon: Flag },
  'team-post': { verb: 'Posted in Team Finder:', icon: Users },
  thread: { verb: 'Started a discussion:', icon: MessagesSquare },
  reply: { verb: 'Replied in', icon: Reply },
  win: { verb: 'Shared a story:', icon: Trophy },
};

const STATUS_ORDER: TrackStatus[] = ['done', 'submitted', 'registered', 'saved'];

const STATUS_STYLES: Record<TrackStatus, string> = {
  saved: 'bg-ink/5 text-ink/80',
  registered: 'bg-accent/10 text-brand-700 dark:text-brand-300',
  submitted: 'bg-accent/20 text-brand-800 dark:text-brand-200',
  done: 'bg-accent text-white',
};

const ONBOARDING_PHOTO = PHOTOS.collegeGroupProject;

/** A story from GET /api/wins (owned by the wins area); read defensively. */
interface WinApiItem {
  id?: string;
  slug?: string;
  projectName?: string;
  hackathon?: string;
  hackathonSlug?: string;
  city?: string;
  result?: string;
  prize?: string;
  tagline?: string;
  themes?: string[];
  cheers?: number;
  coverUrl?: string;
  createdAt?: string;
}

function toStory(w: WinApiItem): ProfileStory | null {
  const slug = w.slug ?? w.id;
  if (!slug || !w.projectName) return null;
  const result = w.result === 'winner' || w.result === 'runner-up' || w.result === 'finalist' ? w.result : 'finalist';
  return {
    slug,
    projectName: w.projectName,
    hackathon: w.hackathon ?? '',
    hackathonSlug: w.hackathonSlug,
    city: w.city,
    result,
    prize: w.prize ?? '',
    tagline: w.tagline ?? '',
    themes: (Array.isArray(w.themes) ? w.themes : []) as ProfileStory['themes'],
    cheers: Number(w.cheers) || 0,
    coverUrl: typeof w.coverUrl === 'string' ? w.coverUrl : undefined,
    createdAt: w.createdAt ?? '',
  };
}

function Onboarding({ firstName, welcome, initial, onSave }: { firstName: string; welcome: boolean; initial: MyProfile; onSave: (p: MyProfile) => Promise<void> }) {
  const perks = [
    { icon: CalendarDays, text: 'An activity heatmap that fills up as you save, register and ship' },
    { icon: BadgeCheck, text: 'Badges for your first save, your first submission, your first win' },
    { icon: History, text: 'Your hackathon record and winning stories in one place' },
    { icon: Users, text: 'A “looking for a team” badge so other students can invite you' },
  ];
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <section className="card overflow-hidden">
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ONBOARDING_PHOTO.src} alt="Five students laughing together around a table" className="aspect-[16/10] w-full object-cover" />
          <figcaption className="px-6 pt-2 text-[11px] text-ink/45">
            Photo:{' '}
            <a href={ONBOARDING_PHOTO.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {ONBOARDING_PHOTO.by} on Unsplash
            </a>
          </figcaption>
        </figure>
        <div className="p-6 sm:p-7">
          <h1 className="font-sans text-3xl font-bold normal-case tracking-normal">{welcome ? `Welcome, ${firstName}` : 'Your hackathon profile'}</h1>
          <p className="mt-3 text-sm leading-6 text-ink/70">
            Like a LeetCode profile, but for hackathons. Add a photo, your college and skills so teammates know who you are, and
            pick your city so we show the nearest hackathons first. It takes a minute, and you can change it any time.
          </p>
          <ul className="mt-5 space-y-3">
            {perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-ink/80">
                <span className="inline-flex shrink-0 rounded-lg bg-accent/10 p-1.5 text-brand-700 dark:text-brand-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ProfileForm initial={initial} mode="create" onSave={onSave} />
    </div>
  );
}

/** The signed-in student's own profile: the public layout plus private bits (tracker, cities, activity). */
export default function MyProfileView({
  events,
  welcome = false,
  verified = null,
  edit = false,
  next = null,
}: {
  events: ProfileEvent[];
  welcome?: boolean;
  verified?: 'ok' | 'expired' | null;
  edit?: boolean;
  /** Where to go once onboarding is done (e.g. back to Team Finder). */
  next?: string | null;
}) {
  const router = useRouter();
  const { me, ready, signedIn, mutate: mutateMe } = useMe();
  const { profile, save } = useProfile();
  const { saved, ready: savedReady } = useSaved();
  const { items, ready: activityReady } = useActivity();
  const { cities, ready: citiesReady } = useFollowedCities();
  const profileKey = me?.onboarded ? `/api/users/${me.handle}` : null;
  const { data: stats, error: statsError, mutate: mutateStats } = useSWR<PublicProfile>(profileKey);
  const { data: wins, error: winsError } = useSWR<{ items: WinApiItem[] }>(me?.onboarded ? `/api/wins?author=${me.handle}&limit=12` : null);
  const [editing, setEditing] = useState(edit);
  const statsReady = Boolean(stats || statsError);
  const allReady = ready && savedReady && activityReady && citiesReady && (!me?.onboarded || statsReady);

  // Everything below only renders after mount (allReady), so reading the clock is safe.
  const todayKey = useMemo(() => (allReady ? istDayKey(Date.now()) : ''), [allReady]);
  const nowIso = useMemo(() => (allReady ? new Date().toISOString() : ''), [allReady, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const counts = useMemo(() => countsFromTimestamps(items.map((a) => a.at)), [items]);

  if (!allReady) {
    return (
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]" aria-busy="true" aria-label="Loading your profile">
        <div className="card h-[520px] animate-pulse bg-ink/5" />
        <div className="space-y-6">
          <div className="card h-24 animate-pulse bg-ink/5" />
          <div className="card h-64 animate-pulse bg-ink/5" />
        </div>
      </div>
    );
  }

  if (!signedIn || !me || !profile) {
    return (
      <SignInPrompt
        next="/profile"
        title="Your hackathon profile"
        text="Sign in to see your heatmap, badges, hackathon record and tracker. Your profile is free and takes a minute."
      />
    );
  }

  const firstName = me.name.split(' ')[0];

  if (!me.onboarded) {
    return (
      <Onboarding
        firstName={firstName}
        welcome={welcome}
        initial={profile}
        onSave={async (p) => {
          await save({ ...p, onboarded: true });
          if (next) router.push(next);
        }}
      />
    );
  }

  if (editing) {
    return (
      <div className="mx-auto max-w-3xl">
        <ProfileForm
          initial={profile}
          onSave={async (p) => {
            await save(p);
            setEditing(false);
            if (next) router.push(next);
            else if (edit) router.replace('/profile', { scroll: false });
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  const record: ProfileRecord[] = me.record;
  const recStats = recordStats(record);
  const statuses = Object.values(saved);
  const tracked = statuses.length;
  const byStatus = (s: TrackStatus) => statuses.filter((x) => x === s).length;
  const registered = statuses.filter((s) => s !== 'saved').length;
  const submitted = byStatus('submitted') + byStatus('done');
  const done = byStatus('done');
  const contentCounts = stats?.counts ?? { threads: 0, replies: 0, wins: 0, teamPosts: 0 };

  // Same rules as the public profile (server/profiles.ts), from live data so changes show at once.
  const badges = myBadges({
    saves: Math.max(tracked, recStats.hackathons),
    registered: Math.max(registered, recStats.hackathons),
    submitted: Math.max(submitted, recStats.hackathons),
    done: Math.max(done, recStats.hackathons),
    cities: cities.length,
    teamPosts: contentCounts.teamPosts,
    threads: contentCounts.threads,
    replies: contentCounts.replies,
    podiums: recStats.podiums,
    wins: recStats.wins,
  });

  // Stories come from the wins API; if it fails, the profile API's copy is a fine fallback.
  const stories: ProfileStory[] = wins ? wins.items.map(toStory).filter((s): s is ProfileStory => s !== null) : stats?.stories ?? [];
  const storiesLoading = !wins && !winsError && !stats;

  const titleFor = (slug: string) => events.find((e) => e.slug === slug)?.title ?? slug;
  const myHackathons = Object.entries(saved).sort(([, a], [, b]) => STATUS_ORDER.indexOf(a) - STATUS_ORDER.indexOf(b));
  const recent: Activity[] = items.slice(0, 8);
  const highlight = recStats.wins > 1 ? `${recStats.wins}× winner` : recStats.wins === 1 ? 'Winner' : undefined;

  const onRecordChange = async (next: ProfileRecord[]) => {
    await mutateMe((data) => (data?.user ? { user: { ...data.user, record: next } } : data), { revalidate: false });
    void mutateStats();
  };

  return (
    <ProfileLayout
      side={
        <>
          <ProfileCard profile={fromUser(me)} highlight={highlight}>
            <button type="button" onClick={() => setEditing(true)} className="btn-secondary w-full">
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit profile
            </button>
            <Link href={`/u/${me.handle}`} className="flex items-start gap-2 rounded-xl bg-ink/5 px-3 py-2.5 text-xs leading-5 text-ink/70 hover:bg-ink/10">
              <Eye className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                See your public profile at <strong className="break-all text-ink">hackathonfinder.in/u/{me.handle}</strong>
              </span>
            </Link>
          </ProfileCard>

          <Panel title="My cities" icon={MapIcon} action={cities.length > 0 ? { href: '/cities', label: 'Edit' } : undefined}>
            {cities.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {cities.map((slug) => (
                  <li key={slug}>
                    <Link href={`/cities/${slug}`} className="chip text-xs">
                      {cityName(slug)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyNudge text="Follow cities to shortlist hackathons near you." href="/cities" cta="Browse cities" />
            )}
          </Panel>

          <Link href="/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/60 hover:text-ink hover:underline">
            <Settings className="h-3.5 w-3.5" aria-hidden="true" />
            Account settings
          </Link>
        </>
      }
    >
      <VerifyEmailBanner email={me.email} verified={me.emailVerified} linkResult={verified} />

      <ProfileSetupCard onEdit={() => setEditing(true)} />

      <StatTiles
        items={[
          { label: 'Hackathons', value: recStats.hackathons, icon: CalendarCheck, tone: 'cyan' },
          { label: 'Wins', value: recStats.wins, icon: Trophy, tone: 'amber' },
          { label: 'Podiums', value: recStats.podiums, icon: Medal, tone: 'pink' },
          { label: 'Finals', value: recStats.finals, icon: Star, tone: 'violet' },
          { label: 'Stories', value: contentCounts.wins, icon: Award, tone: 'amber' },
          { label: 'Discussions', value: contentCounts.threads, icon: MessagesSquare, tone: 'pink' },
          { label: 'Replies', value: contentCounts.replies, icon: Reply, tone: 'pink' },
          { label: 'Team posts', value: contentCounts.teamPosts, icon: Users, tone: 'violet' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Panel title="Results" icon={Award}>
          <ResultRing
            counts={resultCounts(record)}
            caption={record.length ? 'From your hackathon record below.' : 'Add hackathons to your record below to fill this in.'}
          />
        </Panel>
        <Panel title="Badges" icon={BadgeCheck}>
          <Badges states={badges} />
        </Panel>
      </div>

      <Panel title="Activity" icon={ActivityIcon}>
        <ActivityHeatmap counts={counts} todayKey={todayKey} />
        {items.length === 0 && (
          <div className="mt-4">
            <EmptyNudge text="Your heatmap fills up as you save, register and post." href="/near-me" cta="Find hackathons near me" />
          </div>
        )}
      </Panel>

      <div id="record" className="scroll-mt-24">
        <Panel title="Hackathon record" icon={History}>
          <RecordManager record={record} events={events} storyLinks={storyLinks(record, stories)} onChange={onRecordChange} />
        </Panel>
      </div>

      <Panel title="My hackathons" icon={Bookmark} action={tracked > 0 ? { href: '/saved', label: 'Open tracker' } : undefined}>
        {myHackathons.length > 0 ? (
          <>
            <dl className="mb-5 grid grid-cols-4 gap-2 text-center">
              {(['saved', 'registered', 'submitted', 'done'] as TrackStatus[]).map((s) => (
                <div key={s} className={cn('rounded-xl px-2 py-2.5', STATUS_STYLES[s])}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider">{TRACK_LABELS[s]}</dt>
                  <dd className="font-display text-2xl leading-tight">{byStatus(s)}</dd>
                </div>
              ))}
            </dl>
            <ul className="divide-y divide-ink/10">
              {myHackathons.slice(0, 6).map(([slug, status]) => (
                <li key={slug} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <Link href={`/hackathons/${slug}`} className="min-w-0 truncate font-semibold text-ink hover:underline">
                    {titleFor(slug)}
                  </Link>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLES[status])}>{TRACK_LABELS[status]}</span>
                </li>
              ))}
            </ul>
            {myHackathons.length > 6 && (
              <p className="mt-3 text-xs text-ink/60">
                And {myHackathons.length - 6} more in{' '}
                <Link href="/saved" className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                  your tracker
                </Link>
                .
              </p>
            )}
          </>
        ) : (
          <EmptyNudge text="Save your first hackathon, then track it from saved to done." href="/near-me" cta="Save your first hackathon" icon={Bookmark} />
        )}
      </Panel>

      <section aria-labelledby="my-wins-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="my-wins-title" className="flex items-center gap-2 font-sans text-lg font-bold normal-case tracking-normal">
            <Trophy className="h-5 w-5" aria-hidden="true" />
            My winning stories
          </h2>
          {stories.length > 0 && (
            <Link href="/wins?share=1" className="text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300">
              Share another
            </Link>
          )}
        </div>
        {storiesLoading ? (
          <div className="grid gap-6 sm:grid-cols-2" aria-busy="true" aria-label="Loading your stories">
            <div className="card h-64 animate-pulse bg-ink/5" />
          </div>
        ) : stories.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2">
            {stories.map((s) => (
              <StoryCard key={s.slug} story={s} mine />
            ))}
          </div>
        ) : (
          <div className="card p-5">
            <EmptyNudge text="Won, came second or made the finals? Tell other students how you did it." href="/wins?share=1" cta="Share your win" icon={Trophy} />
          </div>
        )}
      </section>

      <Panel title="Recent activity" icon={ActivityIcon}>
        {recent.length > 0 ? (
          <ul className="space-y-3">
            {recent.map((a) => {
              const { verb, icon: Icon } = ACTIVITY_TEXT[a.type] ?? ACTIVITY_TEXT.saved;
              return (
                <li key={a.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 inline-flex rounded-lg bg-ink/5 p-1.5 text-ink/70">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 text-ink/80">
                    {verb}{' '}
                    {a.href ? (
                      <Link href={a.href} className="font-semibold text-ink hover:underline">
                        {a.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-ink">{a.label}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-ink/50">{timeAgo(a.at, nowIso)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyNudge text="Nothing yet. Save a hackathon to start your streak." href="/near-me" cta="Hackathons near me" />
        )}
      </Panel>
    </ProfileLayout>
  );
}
