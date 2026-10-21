import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CITIES } from '@hackathonfinder/shared';
import Explorer from '@/components/hackathon/Explorer';
import { PageHero, SampleNotice } from '@/components/ui';
import { DEFAULT_FILTERS, parseFilters } from '@/lib/filters';
import { getHackathons, cityCounts } from '@/lib/hackathons';

export const dynamic = 'force-dynamic';

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const city = CITIES.find((c) => c.slug === params.slug);
  if (!city) return { title: 'City not found' };
  return {
    title: `Hackathons in ${city.name}`,
    description: `Upcoming hackathons, ideathons and coding contests in ${city.name}, ${city.state}. Filter by deadline, team size, prize and theme.`,
  };
}

export default function CityPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const city = CITIES.find((c) => c.slug === params.slug);
  if (!city) notFound();
  const { items } = getHackathons();
  const base = { ...DEFAULT_FILTERS, city: city.slug };
  const count = cityCounts(items)[city.slug] ?? 0;

  return (
    <>
      <PageHero
        title="Hackathons in"
        accent={city.name}
        description={
          count > 0
            ? `${count} ${count === 1 ? 'event is' : 'events are'} open in ${city.name} right now. Online events you can join from ${city.name} are on the Explore page.`
            : `No open events in ${city.name} right now. We’re adding more cities every month, so check back soon or browse online events.`
        }
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          <SampleNotice className="mb-6" />
          <Explorer items={items} initial={parseFilters(searchParams, base)} base={base} />
        </div>
      </section>
    </>
  );
}
