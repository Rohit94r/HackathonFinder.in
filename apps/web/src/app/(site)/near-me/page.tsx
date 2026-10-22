import type { Metadata } from 'next';
import Explorer from '@/components/hackathon/Explorer';
import { PageHero, SampleNotice } from '@/components/ui';
import { NEAR_ME_FILTERS, parseFilters } from '@/lib/filters';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hackathons near me',
  description:
    'Find the hackathons closest to you. Share your location or pick your city to see in-person events nearest first, plus online events you can join from anywhere.',
};

export default async function NearMePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { items } = await getHackathons();

  return (
    <>
      <PageHero
        title="Hackathons"
        accent="near you"
        description="Share your location or pick your city. We show the closest in-person events first with how far each one is, then online events you can join from anywhere."
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          {items.some((h) => h.sample) && <SampleNotice className="mb-6" />}
          <Explorer items={items} initial={parseFilters(searchParams, NEAR_ME_FILTERS)} base={NEAR_ME_FILTERS} autoLocate />
        </div>
      </section>
    </>
  );
}
