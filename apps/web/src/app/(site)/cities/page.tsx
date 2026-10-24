import type { Metadata } from 'next';
import CityDirectory from '@/components/cities/CityDirectory';
import { PageHero } from '@/components/ui';
import { openOnly } from '@/lib/hackathons';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Hackathons by city',
  description:
    'Hackathons city by city across India. Follow the cities you care about to build a shortlist, see open events and the next deadline in each, and how far each city is from you.',
};

export default async function CitiesPage() {
  const items = openOnly((await getHackathons()).items);

  return (
    <>
      <PageHero
        title="Hackathons"
        accent="city by city"
        description="Star the cities you care about and their open hackathons collect in your shortlist. See what’s on in each city, the next deadline and how far it is from you."
      />
      <section className="bg-surface py-10 sm:py-14">
        <div className="container-page">
          <CityDirectory items={items} />
        </div>
      </section>
    </>
  );
}
