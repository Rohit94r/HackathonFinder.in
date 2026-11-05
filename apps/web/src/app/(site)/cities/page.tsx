import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import CityDirectory from '@/components/cities/CityDirectory';
import { PageHero } from '@/components/ui';
import { openOnly } from '@/lib/hackathons';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathons by City: Pune, Mumbai, Bengaluru & More',
  description: 'Hackathons city by city. See open events and the next deadline in Pune, Mumbai, Bengaluru, Delhi NCR, Hyderabad, Chennai and more, and how far each city is from you.',
  path: '/cities',
  keywords: ['hackathons by city', 'hackathons in Pune', 'hackathons in Mumbai', 'hackathons in Bengaluru', 'hackathons in Delhi', 'hackathons in Hyderabad'],
});

export default async function CitiesPage() {
  const items = openOnly((await getHackathons()).items);

  return (
    <>
      <PageHero title="Hackathons"
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
