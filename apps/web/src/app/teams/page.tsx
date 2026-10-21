import type { Metadata } from 'next';
import TeamBoard from '@/components/teams/TeamBoard';
import { PageHero } from '@/components/ui';
import { getHackathons, openOnly } from '@/lib/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Team Finder',
  description: 'Find teammates for your next hackathon. Post the skills you have and the skills you need.',
};

export default function TeamsPage() {
  const events = openOnly(getHackathons().items).map((h) => ({ slug: h.slug, title: h.title }));
  return (
    <>
      <PageHero
        title="Find your"
        accent="hackathon team"
        description="Got an idea but missing a designer, a backend dev or a pitch person? Post what you need, or join a team that needs you."
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          <TeamBoard events={events} />
        </div>
      </section>
    </>
  );
}
