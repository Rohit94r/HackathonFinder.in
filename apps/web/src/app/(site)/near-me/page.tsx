import type { Metadata } from 'next';
import Explorer from '@/components/hackathon/Explorer';
import { NEAR_ME_FILTERS, parseFilters } from '@/lib/filters';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hackathons near me',
  description:
    'Find the hackathons closest to you. Share your location or pick your city to see in-person events nearest first, plus online events you can join from anywhere.',
};

/** Straight to the listings: nearest in-person events first, then online ones. */
export default async function NearMePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { items } = await getHackathons();

  return (
    <section className="bg-surface py-8">
      <div className="container-page">
        <h1 className="sr-only">Hackathons near you</h1>
        <Explorer items={items} initial={parseFilters(searchParams, NEAR_ME_FILTERS)} base={NEAR_ME_FILTERS} autoLocate />
      </div>
    </section>
  );
}
