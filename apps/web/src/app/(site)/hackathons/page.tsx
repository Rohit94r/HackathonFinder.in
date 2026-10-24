import type { Metadata } from 'next';
import Explorer from '@/components/hackathon/Explorer';
import { PageHero } from '@/components/ui';
import { openOnly } from '@/lib/hackathons';
import { getHackathons } from '@/server/hackathons';
import { parseFilters } from '@/lib/filters';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Explore hackathons',
  description:
    'Search every open hackathon by city, online or offline, deadline, team size, prize, fee, theme and eligibility.',
};

export default async function HackathonsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { items } = await getHackathons();
  const initial = parseFilters(searchParams);

  return (
    <>
      <PageHero
        title="Every hackathon"
        accent="one search"
        description={`${openOnly(items).length} events are open for registration right now. Filter by what matters to you and register on the official page.`}
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          <Explorer items={items} initial={initial} />
        </div>
      </section>
    </>
  );
}
