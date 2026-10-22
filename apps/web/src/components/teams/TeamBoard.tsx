'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWRInfinite from 'swr/infinite';
import { CheckCircle2, MapPin, Plus, Search, SlidersHorizontal, Sparkles, UserRound, Users, X } from 'lucide-react';
import { CITIES, cityName } from '@hackathonfinder/shared';
import LocationChooser from '@/components/hackathon/LocationChooser';
import { SampleNotice } from '@/components/ui';
import { SKILLS, type PeoplePage, type Student, type TeamPost, type TeamPostsPage } from '@/data/teamPosts';
import { apiFetch, goToLogin } from '@/lib/apiClient';
import { useMyLocation } from '@/lib/useMyLocation';
import { useProfile } from '@/lib/useProfile';
import { cn } from '@/lib/cn';
import MyRequestsPanel from './MyRequestsPanel';
import PersonCard from './PersonCard';
import TeamPostCard from './TeamPostCard';
import TeamPostForm, { type NewTeamPostInput } from './TeamPostForm';
import {
  DEFAULT_FILTERS,
  STATES,
  TEAM_DISTANCE_OPTIONS,
  firstName,
  joinList,
  kmTo,
  peopleQuery,
  resultCounts,
  skillMatch,
  teamPostsQuery,
  type Filters,
  type SkillMatch,
  type SortKey,
  type TeamEvent,
  type TeamTab,
} from './teamUtils';
import { useMyInvites, useMyRequests, useMyTeamPosts } from './useTeamStore';

export type { TeamTab } from './teamUtils';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'match', label: 'Best match' },
  { value: 'newest', label: 'Newest' },
  { value: 'nearest', label: 'Nearest' },
];

type Answer = 'accepted' | 'declined';

interface Initial<T> {
  /** The query string the page was loaded for (see teamPostsQuery / peopleQuery). */
  query: string;
  page: T;
}

interface TeamBoardProps {
  /** Open listings that take teams. */
  events: TeamEvent[];
  initialTab?: TeamTab;
  initialCity?: string;
  initialHackathon?: string;
  /** First pages rendered on the server, reused while the filters still match. */
  initialTeams?: Initial<TeamPostsPage>;
  initialPeople?: Initial<PeoplePage>;
}

const stateOf = (slug: string) => CITIES.find((c) => c.slug === slug)?.state;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function useDebounced<T>(value: T, ms: number): T {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setCurrent(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return current;
}

/** Pages of a Team Finder list; `more()` loads the next page. */
function usePaged<T extends { page: number; pages: number; total: number; items: { id: string }[] }>(
  path: string,
  query: string,
  initial?: Initial<T>
) {
  const swr = useSWRInfinite<T>((index, prev: T | null) => (prev && prev.page >= prev.pages ? null : `${path}?${query}&page=${index + 1}`), {
    keepPreviousData: true,
    revalidateFirstPage: false,
    fallbackData: initial && initial.query === query ? [initial.page] : undefined,
  });
  const pages = swr.data ?? [];
  const last = pages[pages.length - 1];
  // A post added between page loads can push an item onto the next page twice.
  const items = [...new Map(pages.flatMap((p) => p.items).map((i) => [i.id, i])).values()] as T['items'];
  return {
    items,
    total: pages[0]?.total ?? 0,
    loading: !swr.data && !swr.error,
    stale: Boolean(swr.data) && swr.isLoading,
    error: swr.error as Error | undefined,
    hasMore: Boolean(last && last.page < last.pages),
    loadingMore: swr.isValidating && swr.size > pages.length,
    more: () => swr.setSize(swr.size + 1),
    mutate: swr.mutate,
  };
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 border-b border-ink/10 py-5 first:pt-0 last:border-0">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">{title}</legend>
      {children}
    </fieldset>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={cn('chip text-xs', active && 'chip-active')}>
      {children}
    </button>
  );
}

export default function TeamBoard({
  events,
  initialTab = 'teams',
  initialCity = '',
  initialHackathon = '',
  initialTeams,
  initialPeople,
}: TeamBoardProps) {
  const [tab, setTab] = useState<TeamTab>(initialTab);
  const [filters, setFilters] = useState<Filters>({ ...DEFAULT_FILTERS, city: initialCity, hackathon: initialHackathon });
  const [panelOpen, setPanelOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [justPosted, setJustPosted] = useState(false);

  const { profile, me, ready: profileReady, signedIn } = useProfile();
  const { posts: myPosts, ready: postsReady, mutate: mutateMyPosts } = useMyTeamPosts();
  const { requests, ready: requestsReady, mutate: mutateRequests } = useMyRequests();
  const { invites, ready: invitesReady, mutate: mutateInvites } = useMyInvites();
  const { location, ready: locationReady, state: locateState, locate, pickCity, clear: clearLocation } = useMyLocation();
  const q = useDebounced(filters.q, 300);

  // Only the linkable filters go in the URL, so city and event pages can deep-link here.
  // replaceState keeps the URL shareable without a server round trip per change.
  useEffect(() => {
    const p = new URLSearchParams();
    if (tab === 'people') p.set('tab', 'people');
    if (filters.city) p.set('city', filters.city);
    if (filters.hackathon && tab === 'teams') p.set('hackathon', filters.hackathon);
    const qs = p.toString() ? `?${p.toString()}` : '';
    if (window.location.search !== qs) window.history.replaceState(null, '', `${window.location.pathname}${qs}${window.location.hash}`);
  }, [tab, filters.city, filters.hackathon]);

  useEffect(() => {
    if (!panelOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanelOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panelOpen]);

  const eventBySlug = useMemo(() => new Map(events.map((e) => [e.slug, e])), [events]);
  const mySkills = useMemo(() => profile?.skills ?? [], [profile]);
  const hasSkills = mySkills.length > 0;
  const openPosts = myPosts.filter((p) => p.open);
  const latestNeeds = openPosts[0]?.needs ?? [];
  const peopleBasis: 'post' | 'lack' | null = latestNeeds.length > 0 ? 'post' : hasSkills ? 'lack' : null;
  const canMatch = tab === 'teams' ? hasSkills : peopleBasis !== null;

  const queryFilters = { ...filters, q };
  const teams = usePaged<TeamPostsPage>('/api/team-posts', teamPostsQuery(queryFilters, { near: location, skills: mySkills }), initialTeams);
  const people = usePaged<PeoplePage>(
    '/api/people',
    peopleQuery(queryFilters, {
      near: location,
      match: peopleBasis === 'post' ? latestNeeds : [],
      lack: peopleBasis === 'lack' ? mySkills : [],
    }),
    initialPeople
  );

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const reset = () => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
  const cityFilter = tab === 'people' && filters.city === 'online' ? '' : filters.city;

  const personMatch = (skills: string[]): SkillMatch | null => {
    if (peopleBasis === 'post') return skillMatch(skills, latestNeeds);
    if (peopleBasis === 'lack' && skills.length > 0) {
      const matched = skills.filter((s) => !mySkills.includes(s));
      return { matched, pct: Math.round((matched.length / skills.length) * 100) };
    }
    return null;
  };

  const mePerson: Student | null =
    me && profile?.lookingForTeam
      ? {
          id: me.id,
          handle: me.handle,
          name: me.name,
          image: me.image,
          about: me.about,
          college: me.college,
          city: me.city,
          skills: me.skills,
          isSample: false,
          bio: me.bio,
          github: me.github,
          linkedin: me.linkedin,
          lookingForTeam: true,
          joinedAt: me.joinedAt,
          results: resultCounts(me.record),
        }
      : null;

  const active = tab === 'teams' ? teams : people;
  const total = active.total;
  const requestFor = useMemo(() => new Map(requests.sent.map((r) => [r.post?.id ?? '', r])), [requests]);
  const inviteFor = useMemo(() => new Map(invites.sent.map((i) => [i.to.handle, i])), [invites]);
  const inboxCount = requests.sent.length + requests.received.length + invites.sent.length + invites.received.length;
  const showInbox = signedIn && requestsReady && invitesReady && inboxCount > 0;

  // Notifications link to #my-requests, which only exists once the student's data loads.
  const scrolled = useRef(false);
  useEffect(() => {
    if (!showInbox || scrolled.current || window.location.hash !== '#my-requests') return;
    scrolled.current = true;
    document.getElementById('my-requests')?.scrollIntoView({ block: 'start' });
  }, [showInbox]);

  const draftFor = (post: TeamPost, match: SkillMatch | null) => {
    const hi = `Hi ${firstName(post.author.name)}! `;
    const help = match?.matched.length ? ` and I can help with ${joinList(match.matched)}` : '';
    return profile
      ? `${hi}I’m ${firstName(profile.name)}${help}. Would love to join your team for ${post.hackathonTitle}.`
      : `${hi}I’d love to join your team for ${post.hackathonTitle}.`;
  };
  const inviteDraft = (person: Student) => (post?: TeamPost) => {
    const hi = `Hi ${firstName(person.name)}! ${profile ? `I’m ${firstName(profile.name)}. ` : ''}`;
    return post ? `${hi}I’m putting a team together for ${post.hackathonTitle}. Want to join us?` : `${hi}Want to team up for a hackathon?`;
  };

  // Actions: the server checks everything and writes notifications; here we just refresh.
  const refreshTeams = () => Promise.all([mutateMyPosts(), teams.mutate()]);
  const createPost = async (input: NewTeamPostInput) => {
    await apiFetch('/api/team-posts', { body: input });
    await refreshTeams();
    setFormOpen(false);
    setTab('teams');
    setJustPosted(true);
  };
  const sendRequest = async (post: TeamPost, message: string) => {
    await apiFetch(`/api/team-posts/${post.id}/requests`, { body: { message } });
    await mutateRequests();
  };
  const setRequest = async (id: string, status: Answer | 'withdrawn') => {
    await apiFetch(`/api/requests/${id}`, { method: 'PATCH', body: { status } });
    await Promise.all([mutateRequests(), status === 'accepted' ? refreshTeams() : null]);
  };
  const sendInvite = async (person: Student, message: string, postId?: string) => {
    await apiFetch('/api/invites', { body: { toHandle: person.handle, postId, message } });
    await mutateInvites();
  };
  const setInvite = async (id: string, status: Answer | 'withdrawn') => {
    await apiFetch(`/api/invites/${id}`, { method: 'PATCH', body: { status } });
    await Promise.all([mutateInvites(), status === 'accepted' ? teams.mutate() : null]);
  };
  const togglePost = async (post: TeamPost) => {
    await apiFetch(`/api/team-posts/${post.id}`, { method: 'PATCH', body: { open: !post.open } });
    await refreshTeams();
  };
  const removePost = async (post: TeamPost) => {
    await apiFetch(`/api/team-posts/${post.id}`, { method: 'DELETE' });
    await refreshTeams();
  };
  const startPost = () => {
    if (!signedIn) return goToLogin();
    setFormOpen(true);
    setJustPosted(false);
  };

  const activeChips: { label: string; clear: () => void }[] = [
    ...(filters.km && location ? [{ label: `Within ${filters.km.toLocaleString('en-IN')} km`, clear: () => set({ km: 0 }) }] : []),
    ...(filters.state ? [{ label: filters.state, clear: () => set({ state: '' }) }] : []),
    ...(cityFilter ? [{ label: cityFilter === 'online' ? 'Online teams' : cityName(cityFilter), clear: () => set({ city: '' }) }] : []),
    ...filters.skills.map((s) => ({
      label: tab === 'teams' ? `${filters.skillIn === 'needs' ? 'Needs' : 'Has'} ${s}` : s,
      clear: () => set({ skills: filters.skills.filter((x) => x !== s) }),
    })),
    ...(tab === 'teams' && filters.hackathon
      ? [{ label: eventBySlug.get(filters.hackathon)?.title ?? 'This hackathon', clear: () => set({ hackathon: '' }) }]
      : []),
    ...(tab === 'teams' && filters.mode
      ? [{ label: filters.mode === 'online' ? 'Online-friendly' : 'In person', clear: () => set({ mode: '' }) }]
      : []),
  ];
  const count = activeChips.length;

  const needsLocation = locationReady && !location && (filters.sort === 'nearest' || filters.km > 0);
  const cityOptions = CITIES.filter((c) => !filters.state || c.state === filters.state);

  const panel = (prefix: string) => (
    <div>
      <FilterGroup title="Near you">
        {location ? (
          <>
            <div className="mb-3 flex items-center justify-between gap-2 rounded-xl bg-ink/5 px-3 py-2.5 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 font-semibold leading-snug text-ink">
                <MapPin className="h-4 w-4 shrink-0" />
                {location.label}
              </span>
              <button type="button" onClick={clearLocation} className="shrink-0 text-xs font-semibold text-ink/70 hover:underline">
                Change
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEAM_DISTANCE_OPTIONS.map((o) => (
                <Pill key={o.value} active={filters.km === o.value} onClick={() => set({ km: o.value })}>
                  {o.value ? `Within ${o.label}` : o.label}
                </Pill>
              ))}
            </div>
          </>
        ) : (
          <LocationChooser
            state={locateState}
            onLocate={() => {
              set({ sort: 'nearest' });
              locate();
            }}
            onPickCity={(slug) => {
              set({ sort: 'nearest' });
              pickCity(slug);
            }}
          />
        )}
      </FilterGroup>

      <FilterGroup title="Where">
        <label htmlFor={`${prefix}-state`} className="sr-only">
          State
        </label>
        <select
          id={`${prefix}-state`}
          value={filters.state}
          onChange={(e) => {
            const state = e.target.value;
            set({ state, city: filters.city && state && stateOf(filters.city) !== state ? '' : filters.city });
          }}
          className="input mb-3 py-2.5"
        >
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <label htmlFor={`${prefix}-city`} className="sr-only">
          City
        </label>
        <select id={`${prefix}-city`} value={cityFilter} onChange={(e) => set({ city: e.target.value })} className="input py-2.5">
          <option value="">Any city</option>
          {tab === 'teams' && !filters.state && <option value="online">Online teams</option>}
          {cityOptions.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </FilterGroup>

      <FilterGroup title="Skills">
        {tab === 'teams' && (
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-ink/5 p-1 text-xs font-semibold">
            {(['needs', 'has'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={filters.skillIn === v}
                onClick={() => set({ skillIn: v })}
                className={cn('rounded-lg px-2 py-1.5 transition', filters.skillIn === v ? 'bg-card text-ink shadow-sm' : 'text-ink/60 hover:text-ink')}
              >
                {v === 'needs' ? 'Teams that need' : 'Teams that have'}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {SKILLS.map((s) => (
            <Pill key={s} active={filters.skills.includes(s)} onClick={() => set({ skills: toggle(filters.skills, s) })}>
              {s}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      {tab === 'teams' && (
        <>
          <FilterGroup title="Hackathon">
            <label htmlFor={`${prefix}-hackathon`} className="sr-only">
              Hackathon
            </label>
            <select
              id={`${prefix}-hackathon`}
              value={filters.hackathon}
              onChange={(e) => set({ hackathon: e.target.value })}
              className="input py-2.5"
            >
              <option value="">All hackathons</option>
              {events.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.title}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="How they work">
            <div className="flex flex-wrap gap-2">
              {[
                { value: '' as const, label: 'Any' },
                { value: 'in-person' as const, label: 'In person' },
                { value: 'online' as const, label: 'Online-friendly' },
              ].map((o) => (
                <Pill key={o.value || 'any'} active={filters.mode === o.value} onClick={() => set({ mode: o.value })}>
                  {o.label}
                </Pill>
              ))}
            </div>
          </FilterGroup>
        </>
      )}
    </div>
  );

  const tabs = [
    { value: 'teams' as const, short: 'Teams', long: 'Teams looking for members', icon: Users, total: teams.total },
    { value: 'people' as const, short: 'Students', long: 'Students looking for a team', icon: UserRound, total: people.total + (mePerson ? 1 : 0) },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Team Finder" className="grid grid-cols-2 gap-1 rounded-2xl border border-ink/10 bg-card p-1 sm:inline-grid">
          {tabs.map((t) => {
            const isActive = tab === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="tab"
                id={`team-tab-${t.value}`}
                aria-selected={isActive}
                aria-controls="team-tabpanel"
                onClick={() => setTab(t.value)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition sm:px-4',
                  isActive ? 'bg-brand-600 text-white' : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
                )}
              >
                <t.icon className="h-4 w-4 shrink-0" />
                <span className="sm:hidden">{t.short}</span>
                <span className="hidden sm:inline">{t.long}</span>
                <span className={cn('rounded-full px-1.5 text-xs', isActive ? 'bg-white/20' : 'bg-ink/10')}>{t.total}</span>
              </button>
            );
          })}
        </div>
        {!formOpen && (
          <button type="button" onClick={startPost} className="btn-primary">
            <Plus className="h-4 w-4" />
            Post your team
          </button>
        )}
      </div>

      <SampleNotice className="mb-6">
        Teams and students marked “Sample” show how Team Finder works and won’t answer. Real students get your requests and
        invites as notifications.
      </SampleNotice>

      {formOpen && profile && (
        <TeamPostForm
          events={events}
          profile={profile}
          defaultHackathon={filters.hackathon}
          onCancel={() => setFormOpen(false)}
          onSubmit={createPost}
        />
      )}

      {justPosted && (
        <p
          role="status"
          className="mb-6 flex items-center gap-2 rounded-[14px] bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Your team post is up. Students who match can now ask to join, and you’ll get a notification.
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="card sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-sans text-sm font-semibold normal-case tracking-normal text-ink">Filters</h2>
              {count > 0 && (
                <button type="button" onClick={reset} className="text-xs font-semibold text-ink hover:underline">
                  Clear all
                </button>
              )}
            </div>
            {panel('tf')}
          </div>
        </aside>

        <div id="team-tabpanel" role="tabpanel" aria-labelledby={`team-tab-${tab}`} className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
              <label htmlFor="team-search" className="sr-only">
                {tab === 'teams' ? 'Search teams' : 'Search students'}
              </label>
              <input
                id="team-search"
                type="search"
                value={filters.q}
                onChange={(e) => set({ q: e.target.value })}
                placeholder={tab === 'teams' ? 'Search ideas, skills, colleges or cities' : 'Search names, colleges, skills or cities'}
                className="input pl-11"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPanelOpen(true)} className="btn-secondary flex-1 py-2.5 sm:flex-none lg:hidden" aria-expanded={panelOpen}>
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {count > 0 && <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-white">{count}</span>}
              </button>
              <label htmlFor="team-sort" className="sr-only">
                Sort by
              </label>
              <select
                id="team-sort"
                value={filters.sort}
                onChange={(e) => set({ sort: e.target.value as SortKey })}
                className="input w-auto flex-1 py-2.5 sm:flex-none"
              >
                {SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {needsLocation && (
            <div className="card mb-6 flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-sans text-base font-bold normal-case tracking-normal text-ink">
                  <MapPin className="h-5 w-5" />
                  See who’s closest to you
                </h2>
                <p className="mt-1 text-sm text-ink/70">Share your location or pick your city. It stays in this browser, rounded to about 1 km.</p>
              </div>
              <LocationChooser row state={locateState} onLocate={locate} onPickCity={pickCity} className="shrink-0" />
            </div>
          )}

          {profileReady && signedIn && !canMatch && (
            <div className="card mb-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="flex items-center gap-2 font-semibold text-ink">
                  <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                  Add your skills to see matches
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  {tab === 'teams'
                    ? 'We’ll show how well each team fits you and put the best fits first.'
                    : 'We’ll show which students bring the skills your team is missing.'}
                </p>
              </div>
              <Link href="/profile" className="btn-secondary shrink-0 px-4 py-2 text-sm">
                Add your skills
              </Link>
            </div>
          )}

          {tab === 'people' && peopleBasis && (
            <p className="mb-4 flex items-start gap-2 text-sm text-ink/70">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-600 dark:text-brand-300" />
              {peopleBasis === 'post'
                ? `Matches use what your latest team post needs: ${joinList(latestNeeds)}.`
                : 'Matches show skills you don’t have yet. Post your team to match on exactly what you need.'}
            </p>
          )}

          {showInbox && (
            <MyRequestsPanel
              requests={requests}
              invites={invites}
              onAnswerRequest={(id, status) => setRequest(id, status)}
              onWithdrawRequest={(id) => setRequest(id, 'withdrawn')}
              onAnswerInvite={(id, status) => setInvite(id, status)}
              onWithdrawInvite={(id) => setInvite(id, 'withdrawn')}
            />
          )}

          {tab === 'teams' && postsReady && myPosts.length > 0 && (
            <section className="mb-8" aria-labelledby="my-posts-title">
              <h2 id="my-posts-title" className="mb-4 font-sans text-lg font-bold normal-case tracking-normal">
                Your team posts
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {myPosts.map((post) => (
                  <TeamPostCard
                    key={post.id}
                    post={post}
                    event={eventBySlug.get(post.hackathonSlug)}
                    km={kmTo(post.city, location)}
                    match={null}
                    signedIn={signedIn}
                    isMine
                    draftMessage=""
                    onToggleOpen={() => togglePost(post)}
                    onRemove={() => removePost(post)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm text-ink/70" aria-live="polite">
              <strong className="text-ink">{total}</strong>{' '}
              {tab === 'teams' ? (total === 1 ? 'team' : 'teams') : total === 1 ? 'student' : 'students'}
              {filters.sort === 'match' && canMatch && ' · best match first'}
              {filters.sort === 'nearest' && location && <> · nearest to {location.via === 'gps' ? 'you' : location.label} first</>}
            </p>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-ink/10"
              >
                {chip.label}
                <X className="h-3 w-3" />
                <span className="sr-only">Remove filter</span>
              </button>
            ))}
          </div>

          {tab === 'people' && mePerson && (
            <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <PersonCard person={mePerson} isMe km={kmTo(mePerson.city, location)} match={null} />
            </div>
          )}

          {active.loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2" aria-hidden="true">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="card h-72 animate-pulse" />
              ))}
            </div>
          ) : active.error && active.items.length === 0 ? (
            <div className="card flex flex-col items-center px-6 py-12 text-center">
              <h3 className="text-xl font-bold">We couldn’t load {tab === 'teams' ? 'teams' : 'students'}</h3>
              <p className="mt-2 max-w-md text-sm text-ink/70">{active.error.message}</p>
              <button type="button" onClick={() => void active.mutate()} className="btn-secondary mt-6">
                Try again
              </button>
            </div>
          ) : active.items.length > 0 ? (
            <>
              <div className={cn('grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2', active.stale && 'opacity-60')}>
                {tab === 'teams'
                  ? teams.items.map((post) => {
                      const match = hasSkills ? skillMatch(mySkills, post.needs) : null;
                      return (
                        <TeamPostCard
                          key={post.id}
                          post={post}
                          event={eventBySlug.get(post.hackathonSlug)}
                          km={kmTo(post.city, location)}
                          match={match}
                          signedIn={signedIn}
                          request={requestFor.get(post.id)}
                          draftMessage={draftFor(post, match)}
                          onRequest={(message) => sendRequest(post, message)}
                          onWithdraw={async () => {
                            const r = requestFor.get(post.id);
                            if (r) await setRequest(r.id, 'withdrawn');
                          }}
                        />
                      );
                    })
                  : people.items.map((person) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        km={kmTo(person.city, location)}
                        match={personMatch(person.skills)}
                        matchReason={peopleBasis === 'post' ? 'your team needs' : 'you don’t have'}
                        signedIn={signedIn}
                        myPosts={openPosts}
                        invite={inviteFor.get(person.handle)}
                        draftMessage={inviteDraft(person)}
                        onInvite={(message, postId) => sendInvite(person, message, postId)}
                        onWithdrawInvite={async () => {
                          const i = inviteFor.get(person.handle);
                          if (i) await setInvite(i.id, 'withdrawn');
                        }}
                      />
                    ))}
              </div>
              {active.hasMore && (
                <div className="mt-8 flex justify-center">
                  <button type="button" onClick={() => void active.more()} disabled={active.loadingMore} className="btn-secondary">
                    {active.loadingMore ? 'Loading…' : tab === 'teams' ? 'Show more teams' : 'Show more students'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card flex flex-col items-center px-6 py-14 text-center">
              <div className="mb-4 rounded-2xl bg-ink/5 p-4 text-ink">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold">{tab === 'teams' ? 'No teams match yet' : 'No students match yet'}</h3>
              <p className="mt-2 max-w-md text-sm text-ink/70">
                Try a wider distance or fewer filters. Or post your own team and let people find you.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={reset} className="btn-secondary">
                  Clear filters
                </button>
                <button type="button" onClick={startPost} className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Post your team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {panelOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-navy/60" onClick={() => setPanelOpen(false)} aria-label="Close filters" />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-surface shadow-lift">
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="font-sans text-base font-semibold normal-case tracking-normal">Filters</h2>
              <button type="button" onClick={() => setPanelOpen(false)} aria-label="Close filters" className="rounded-lg p-1.5 hover:bg-ink/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{panel('tfm')}</div>
            <div className="flex gap-3 border-t border-ink/10 p-4">
              <button type="button" onClick={reset} className="btn-secondary flex-1">
                Clear
              </button>
              <button type="button" onClick={() => setPanelOpen(false)} className="btn-primary flex-1">
                Show {total}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
