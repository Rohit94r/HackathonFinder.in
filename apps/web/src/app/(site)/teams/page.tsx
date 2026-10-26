import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { CITIES } from '@hackathonfinder/shared';
import TeamBoard from '@/components/teams/TeamBoard';
import { DEFAULT_FILTERS, peopleQuery, teamPostsQuery, type TeamEvent, type TeamTab } from '@/components/teams/teamUtils';
import { byDeadline, openOnly } from '@/lib/hackathons';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';
import { loadTeamBoard } from '@/server/teams';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathon Team Finder: Find Teammates in India',
  description: 'Find hackathon teammates anywhere in India. Browse teams looking for members or students looking for a team, filter by city, distance, skills and hackathon.',
  path: '/teams',
  keywords: ['hackathon team finder', 'find hackathon teammates', 'hackathon team', 'looking for team hackathon'],
});

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function TeamsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const [{ items }, user] = await Promise.all([getHackathons(), getSessionUser().catch(() => null)]);
  // Solo-only events don't need teammates.
  const events: TeamEvent[] = openOnly(items)
    .filter((h) => h.teamMax > 1)
    .sort(byDeadline)
    .map((h) => ({ slug: h.slug, title: h.title, city: h.city, mode: h.mode, teamMax: h.teamMax, daysToDeadline: h.daysToDeadline }));

  const rawCity = one(searchParams.city);
  const rawHackathon = one(searchParams.hackathon);
  const city = rawCity === 'online' || CITIES.some((c) => c.slug === rawCity) ? rawCity : '';
  const hackathon = events.some((e) => e.slug === rawHackathon) ? rawHackathon : '';
  const tab: TeamTab = one(searchParams.tab) === 'people' ? 'people' : 'teams';

  // The board's first queries: no location or skills are known on the server yet.
  const filters = { ...DEFAULT_FILTERS, city, hackathon };
  const teamsQs = teamPostsQuery(filters, { near: null, skills: [] });
  const peopleQs = peopleQuery(filters, { near: null, match: [], lack: [] });
  const initial = await loadTeamBoard(teamsQs, peopleQs, user?.id);

  // No page hero: the board, with its own one-line title, starts right under the navbar.
  return (
    <section className="bg-surface py-6 sm:py-8">
      <div className="container-page">
        <TeamBoard
          events={events}
          initialTab={tab}
          initialCity={city}
          initialHackathon={hackathon}
          initialTeams={{ query: teamsQs, page: initial.teams }}
          initialPeople={{ query: peopleQs, page: initial.people }}
        />
      </div>
    </section>
  );
}
