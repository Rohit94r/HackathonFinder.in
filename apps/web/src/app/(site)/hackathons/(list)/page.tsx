import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Explorer from '@/components/hackathon/Explorer';
import { PageHero } from '@/components/ui';
import { openOnly } from '@/lib/hackathons';
import { getHackathons } from '@/server/hackathons';
import { parseFilters } from '@/lib/filters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Upcoming Hackathons 2026: Online & In Person',
  description: 'Every open hackathon in one place: search by city, online or offline, deadline, team size, prize, fee, theme and eligibility. Updated twice a day.',
  path: '/hackathons',
  keywords: ['upcoming hackathons', 'hackathons near me', 'hackathons 2026', 'online hackathons', 'offline hackathons', 'hackathons for students', 'coding competitions'],
});

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { items } = await getHackathons();
  const initial = parseFilters(searchParams);

  return (
    <>
      <PageHero title="Explore hackathons"
        description={`${openOnly(items).length} events are open for registration right now. Filter by what matters to you and register on the official page.`}
      />
      <section className="bg-surface py-8">
        <div className="container-page">
          <Explorer items={items} initial={initial} />
        </div>
      </section>
    </>
  );
}
