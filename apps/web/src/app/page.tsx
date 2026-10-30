import type { Metadata } from 'next';
import { CITIES, SOURCES, placeName, sourceBySlug } from '@hackathonfinder/shared';
import { landingSans, landingSerif } from '@/components/landing/fonts';
import { LandingNavbar } from '@/components/landing/navbar';
import { HeroSection } from '@/components/landing/hero';
import { ListingsSection } from '@/components/landing/listings';
import { NearYouSection } from '@/components/landing/near-you';
import { ClosingSoonSection, type ClosingCardData } from '@/components/landing/closing-soon';
import { HowItWorksSection } from '@/components/landing/how-it-works';
import { SmartSearchShowcase } from '@/components/landing/smart-search-showcase';
import { SourcesSection } from '@/components/landing/sources';
import { FeaturesSection, type LiveStat } from '@/components/landing/features';
import { ReadySection } from '@/components/landing/ready';
import { LandingFooter } from '@/components/landing/footer';
import type { PosterData } from '@/components/landing/art';
import '@/components/landing/landing.css';
import { applyFilters } from '@/lib/filters';
import { deadlineLabel, formatDateRange } from '@/lib/format';
import { cityCounts, closingSoon, openOnly, type HackathonView } from '@/lib/hackathons';
import { getHackathons } from '@/server/hackathons';
import { parseSmartQuery } from '@/lib/smartSearch';
import { itemListJsonLd, JsonLd } from '@/lib/seo';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Statuses depend on today, so render per request.
export const dynamic = 'force-dynamic';

const CAROUSEL_SIZE = 20;
const SMART_EXAMPLE = 'Free online AI hackathon for students, deadline this month';

function sourceNames(h: HackathonView): string[] {
  return h.sources.map((s) => sourceBySlug(s)?.name ?? s);
}

function toPoster(h: HackathonView): PosterData {
  return {
    slug: h.slug,
    title: h.title,
    theme: h.themes[0],
    source: sourceNames(h)[0],
    when: formatDateRange(h.startDate, h.endDate),
    where: placeName(h),
    imageUrl: h.imageUrl,
  };
}

function toClosingCard(h: HackathonView): ClosingCardData {
  const names = sourceNames(h);
  return {
    slug: h.slug,
    title: h.title,
    tagline: h.tagline,
    theme: h.themes[0],
    featured: h.featured,
    badge: deadlineLabel(h.daysToDeadline),
    foundOn: names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0],
    imageUrl: h.imageUrl,
  };
}

export default async function HomePage() {
  const { items } = await getHackathons();
  const open = openOnly(items);
  const newestFirst = [...open].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
  // The carousel shows a sample of what's open, events with their own banner first, so the page stays light.
  const carousel = [...newestFirst.filter((h) => h.imageUrl), ...newestFirst.filter((h) => !h.imageUrl)].slice(0, CAROUSEL_SIZE);
  // Featured events lead the search showcase's posters, the rest follow newest first.
  const posters = [...newestFirst.filter((h) => h.featured), ...newestFirst.filter((h) => !h.featured), ...items.filter((h) => !open.includes(h))].map(toPoster);

  const counts = cityCounts(items);
  // Busiest cities first, so the shortcuts lead to real events.
  const topCities = [...CITIES]
    .sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 8)
    .map((c) => ({ slug: c.slug, name: c.name, open: counts[c.slug] ?? 0 }));

  const smart = parseSmartQuery(SMART_EXAMPLE);
  const stats: LiveStat[] = [
    { value: open.length, label: 'open right now', icon: 'open' },
    { value: open.filter((h) => h.daysToDeadline <= 7).length, label: 'closing this week', icon: 'closing' },
    { value: CITIES.length, label: 'cities, plus online', icon: 'cities' },
    { value: SOURCES.length, label: 'sources we check', icon: 'sources' },
  ];

  return (
    <div className={`landing ${landingSans.variable} ${landingSerif.variable}`}>
      {open.length > 0 && <JsonLd data={itemListJsonLd('Upcoming hackathons in India', open)} />}
      <LandingNavbar />
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        <HeroSection sourceCount={SOURCES.length} />
        {/* Sections built from listings only show once there are real ones to show. */}
        {carousel.length > 0 && <ListingsSection items={carousel} total={open.length} />}
        <NearYouSection cities={topCities} totalCities={CITIES.length} />
        {open.length > 0 && <ClosingSoonSection events={closingSoon(items, 4).map(toClosingCard)} />}
        {newestFirst.length > 0 && <HowItWorksSection example={[...newestFirst].sort((a, b) => b.sources.length - a.sources.length)[0]} />}
        {posters.length > 0 && (
          <SmartSearchShowcase
            posters={posters}
            example={{ query: SMART_EXAMPLE, understood: smart.understood, matches: applyFilters(items, smart.filters).length }}
          />
        )}
        <SourcesSection />
        <FeaturesSection stats={stats} />
        <ReadySection />
      </main>
      <LandingFooter />
    </div>
  );
}
