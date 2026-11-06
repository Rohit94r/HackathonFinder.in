import type { Metadata } from 'next';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { CITIES } from '@hackathonfinder/shared';
import CityStrip from '@/components/cities/CityStrip';
import LatestDiscussions from '@/components/community/LatestDiscussions';
import Explorer from '@/components/hackathon/Explorer';
import SeoContent from '@/components/seo/SeoContent';
import { PageHero } from '@/components/ui';
import { DEFAULT_FILTERS, parseFilters } from '@/lib/filters';
import { cityCounts } from '@/lib/hackathons';
import { cityCopy } from '@/lib/listingCopy';
import { getHackathons } from '@/server/hackathons';
import { loadCitySnapshot } from '@/server/teams';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const city = CITIES.find((c) => c.slug === params.slug);
  if (!city) return { title: 'City not found' };
  const year = new Date().getFullYear();
  return pageMetadata({
    title: `Hackathons in ${city.name} ${year}: Upcoming & Offline Events`,
    description: `Upcoming hackathons, ideathons and coding contests in ${city.name}, ${city.state}. Filter by deadline, team size, prize and theme, and find teammates from ${city.name}.`,
    path: `/cities/${city.slug}`,
    keywords: [`hackathons in ${city.name}`, `${city.name} hackathons ${year}`, `hackathons near me ${city.name}`, `offline hackathons ${city.name}`, `college hackathons ${city.name}`, `coding competitions ${city.name}`],
  });
}

export default async function CityPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const city = CITIES.find((c) => c.slug === params.slug);
  if (!city) notFound();
  const [{ items }, snapshot] = await Promise.all([getHackathons(), loadCitySnapshot(city.slug)]);
  const base = { ...DEFAULT_FILTERS, city: city.slug };
  const count = cityCounts(items)[city.slug] ?? 0;

  const inCity = items.filter((h) => h.city === city.slug && h.status !== 'completed');
  const copy = cityCopy(city, items);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Cities', path: '/cities' },
            { name: city.name, path: `/cities/${city.slug}` },
          ]),
          itemListJsonLd(`Hackathons in ${city.name}`, inCity),
          faqJsonLd(copy.faqs),
        ]}
      />
      <PageHero
        title="Hackathons in"
        accent={city.name}
        description={
          count > 0
            ? `${count} ${count === 1 ? 'event is' : 'events are'} open in ${city.name} right now. Follow the city to keep them on your shortlist, and find teammates from ${city.name}.`
            : `No open events in ${city.name} right now. We’re adding more cities every month, so follow ${city.name} and check back soon, or browse online events.`
        }
      />
      <section className="bg-surface py-10">
        <div className="container-page">
          <CityStrip slug={city.slug} snapshot={snapshot} />
          <Explorer items={items} initial={parseFilters(searchParams, base)} base={base} />
          <SeoContent
            copy={copy}
            links={[
              { href: '/blog/how-to-win-your-first-hackathon', label: 'Winning your first hackathon' },
              { href: '/teams', label: `Find teammates from ${city.name}` },
              { href: '/blog/checklist-before-you-register', label: 'Checklist before you register' },
            ]}
          />
          <LatestDiscussions city={city.slug} title={`Talk with students in ${city.name}`} className="mt-12" />
        </div>
      </section>
    </>
  );
}
