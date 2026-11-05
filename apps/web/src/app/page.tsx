import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, MessagesSquare, Navigation, Trophy, Users } from 'lucide-react';
import { CITIES, THEMES, cityName, placeName, sourceBySlug, type ThemeSlug } from '@hackathonfinder/shared';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HackathonCard from '@/components/hackathon/HackathonCard';
import HomeSearch, { type CityOption } from '@/components/home/HomeSearch';
import DiscoveryTabs, { type DiscoveryTab } from '@/components/home/DiscoveryTabs';
import CountUp from '@/components/home/CountUp';
import DeparturesBoard, { type Departure } from '@/components/home/DeparturesBoard';
import HackathonTrain from '@/components/home/HackathonTrain';
import { PlatformSign, StationBoard } from '@/components/junction/Signs';
import { PHOTOS } from '@/components/landing/photos';
import { formatUsdCompact } from '@/lib/format';
import { byDeadline, openOnly, plausiblePrize, themeCounts, type HackathonView } from '@/lib/hackathons';
import { themeStyle } from '@/lib/themeStyles';
import { getCommunityStats, shownCount } from '@/server/communityStats';
import { getHackathons } from '@/server/hackathons';
import { itemListJsonLd, JsonLd } from '@/lib/seo';

export const metadata: Metadata = { alternates: { canonical: '/' } };

// Statuses depend on today, so render per request.
export const dynamic = 'force-dynamic';

const TAB_SIZE = 8;

/** "1,240 discussions"; nothing when the count isn't shown. Counts here are always 3 or more, so always plural. */
const countLabel = (n: number | undefined, noun: string) => (n === undefined ? undefined : `${n.toLocaleString('en-US')} ${noun}`);

// The catalog has one theme for web and mobile apps ("Web & App"), so they share a tile.
const CATEGORIES: { theme: ThemeSlug; label: string }[] = [
  { theme: 'ai-ml', label: 'AI / ML' },
  { theme: 'web-dev', label: 'Web & mobile' },
  { theme: 'web3', label: 'Blockchain & Web3' },
  { theme: 'fintech', label: 'FinTech' },
  { theme: 'cybersecurity', label: 'Cybersecurity' },
  { theme: 'open-innovation', label: 'Open innovation' },
];

function Grid({ items }: { items: HackathonView[] }) {
  return (
    // Phones show four; the "View all" button below covers the rest.
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-sm:[&>*:nth-child(n+5)]:hidden">
      {items.map((h) => (
        <HackathonCard key={h.slug} h={h} />
      ))}
    </div>
  );
}

/** A section's platform sign, signage title and the link to the full view. */
function SectionHeader({
  pf,
  sign,
  title,
  description,
  action,
}: {
  pf: number;
  sign: string;
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <PlatformSign n={pf} en={sign} />
        <h2 className="mt-4 text-[2.4rem] sm:text-[3.2rem]">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-[16px] leading-7 text-muted">{description}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1 font-display text-[15px] font-bold uppercase tracking-[0.06em] text-ink underline decoration-board decoration-[3px] underline-offset-[5px] hover:text-accent"
        >
          {action.label}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const [{ items, nowIso }, community] = await Promise.all([getHackathons(), getCommunityStats()]);
  const now = Date.parse(nowIso);
  const open = openOnly(items);
  // The train: real banners, soonest deadline first.
  const coaches = [...open].filter((h) => h.imageUrl).sort(byDeadline).slice(0, 14);
  // The departures board: the next deadlines, four pages of six.
  const departures: Departure[] = [...open]
    .sort(byDeadline)
    .slice(0, 24)
    .map((h) => ({ slug: h.slug, title: h.title, gate: placeName(h), deadline: h.registrationDeadline }));

  // Live numbers only; nothing here is estimated.
  const prizeTotal = open.reduce((sum, h) => sum + plausiblePrize(h), 0);
  const stats: { label: string; value: React.ReactNode }[] = [
    { label: 'Hackathons listed', value: <CountUp value={items.length} /> },
    { label: 'Open for registration', value: <CountUp value={open.length} /> },
    { label: 'Upcoming events', value: <CountUp value={items.filter((h) => Date.parse(h.startDate) > now).length} /> },
    { label: 'In open prize pools', value: prizeTotal > 0 ? formatUsdCompact(prizeTotal) : '—' },
  ];

  // Promoted listings first, then the biggest prize pools still open; banners only, so the section looks finished.
  const featured = open
    .filter((h) => h.imageUrl)
    .sort((a, b) => Number(b.featured) - Number(a.featured) || plausiblePrize(b) - plausiblePrize(a) || byDeadline(a, b))
    .slice(0, 4);

  const newest = [...open].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt));
  const online = open.filter((h) => h.mode === 'online');
  const inPerson = open.filter((h) => h.mode !== 'online');
  const topPrizes = open.filter((h) => plausiblePrize(h) > 0).sort((a, b) => plausiblePrize(b) - plausiblePrize(a));
  const tabs: DiscoveryTab[] = [
    { id: 'closing', label: 'Closing soon', count: open.length, href: '/hackathons', list: [...open].sort(byDeadline) },
    { id: 'new', label: 'Newly added', count: newest.length, href: '/hackathons?sort=newest', list: newest },
    { id: 'online', label: 'Online', count: online.length, href: '/hackathons?mode=online', list: online },
    { id: 'in-person', label: 'In person', count: inPerson.length, href: '/hackathons?mode=offline,hybrid', list: inPerson },
    { id: 'prizes', label: 'Top prizes', count: topPrizes.length, href: '/hackathons?sort=prize', list: topPrizes },
  ]
    .filter((t) => t.list.length > 0)
    .map(({ list, ...t }) => ({ ...t, content: <Grid items={list.slice(0, TAB_SIZE)} /> }));

  const themeOpen = themeCounts(items);
  // Catalog cities plus any other city an open event is in (Bhopal, Ludhiana, …), with open counts.
  const cityMap = new Map<string, CityOption>(CITIES.map((c) => [c.slug, { slug: c.slug, name: c.name, open: 0 }]));
  for (const h of open) {
    if (!h.city || h.mode === 'online') continue;
    const entry = cityMap.get(h.city) ?? { slug: h.city, name: cityName(h.city, h.cityName), open: 0 };
    entry.open += 1;
    cityMap.set(h.city, entry);
  }
  const cityOptions = [...cityMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  // City pages exist for catalog cities, so the station boards use those.
  const topCities = CITIES.map((c) => cityMap.get(c.slug)!)
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name))
    .slice(0, 8);

  // Where listings come from, by how many each source found.
  const sourceCounts = new Map<string, number>();
  for (const h of items) for (const s of h.sources) sourceCounts.set(s, (sourceCounts.get(s) ?? 0) + 1);
  const topSources = [...sourceCounts]
    .map(([slug, n]) => ({ name: sourceBySlug(slug)?.name ?? slug, n }))
    .sort((a, b) => b.n - a.n)
    .slice(0, 6);

  return (
    <>
      {open.length > 0 && <JsonLd data={itemListJsonLd('Upcoming hackathons', open)} />}
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* Hero: the station at night (data-theme flips the colour tokens inside it). */}
        <section data-theme="dark" className="relative isolate overflow-hidden bg-surface text-ink">
          <div aria-hidden="true" className="junction-lamps pointer-events-none absolute inset-0 -z-10" />

          <div className="container-page relative pt-10 sm:pt-16">
            {/* The station's own board, hanging from the canopy on wide screens. */}
            <div className="pointer-events-none absolute right-8 top-0 hidden xl:block" aria-hidden="true">
              <div className="swing flex flex-col items-center">
                <div className="flex w-[260px] justify-between px-10">
                  <span className="h-12 w-[3px] bg-gradient-to-b from-[#4a443b] to-[#9c9486]" />
                  <span className="h-12 w-[3px] bg-gradient-to-b from-[#4a443b] to-[#9c9486]" />
                </div>
                <StationBoard en="Hackathon Jn." code="HFJN" note="Every route. One station." size="lg" />
              </div>
            </div>

            <div className="max-w-4xl">
              {open.length > 0 && (
                <Link
                  href="/hackathons?status=closing-soon"
                  className="mb-7 inline-flex items-center gap-2.5 rounded-md border border-ink/15 bg-ink/[0.04] py-1.5 pl-2 pr-3 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-ink/80 transition-colors hover:border-board/60 hover:text-ink sm:text-xs"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22a35a] opacity-75 motion-reduce:hidden" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#22a35a]" />
                  </span>
                  <span>
                    <span className="font-bold text-board">{open.length}</span> open<span className="hidden sm:inline"> · now boarding</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-ink/50" aria-hidden="true" />
                </Link>
              )}

              <h1 className="text-[3.3rem] leading-[0.86] tracking-[-0.01em] min-[400px]:text-[3.8rem] sm:text-[6rem] lg:text-[7.4rem]">
                Every hackathon.
                <br />
                <span className="text-board">One station.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-[17px] leading-7 text-ink/70 sm:text-lg sm:leading-8">
                Live departures from Devpost, MLH, Devfolio, Unstop, DoraHacks, lablab.ai, college sites and more. Online from anywhere or in
                person near you. Find one, grab a team, and board before registration closes.
              </p>
            </div>

            <div className="mt-10 max-w-5xl">
              <HomeSearch cities={cityOptions} />
            </div>

            <div className="mt-14 max-w-5xl sm:mt-16">
              <DeparturesBoard departures={departures} nowIso={nowIso} />
            </div>
          </div>

          <div className="relative mt-10 sm:mt-12">
            <HackathonTrain items={coaches} />
          </div>

          {/* Station information board. */}
          <div className="container-page relative pb-12 pt-10 sm:pb-14">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-ink/15 bg-ink/15 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-surface px-5 py-4">
                  <dt className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink/55">{s.label}</dt>
                  <dd className="mt-1.5 font-display text-4xl font-bold leading-none text-board sm:text-5xl">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-ink/40">
              Live from our listings. The prize total adds up stated prizes only, in US dollars (rupees converted at about ₹84 to $1), and leaves out
              figures that look like listing errors.
            </p>
          </div>
          <div className="platform-edge" aria-hidden="true" />
        </section>

        {/* PF 1: Featured */}
        {featured.length > 0 && (
          <section className="section">
            <div className="container-page">
              <SectionHeader
                pf={1}
                sign="Featured"
                title="Featured opportunities"
                description="Promoted listings first, then the biggest prize pools still open for registration."
                action={{ href: '/hackathons?sort=prize', label: 'See all by prize' }}
              />
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <HackathonCard h={featured[0]} variant="featured" eager />
                {featured.length > 1 && (
                  <div className="flex flex-col gap-4">
                    {featured.slice(1).map((h) => (
                      <HackathonCard key={h.slug} h={h} variant="compact" />
                    ))}
                    <Link href="/hackathons" className="btn-secondary mt-auto">
                      Explore all {open.length} open hackathons
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PF 2: Departures */}
        {tabs.length > 0 && (
          <section className="section border-t border-line bg-card/60">
            <div className="container-page">
              <SectionHeader
                pf={2}
                sign="Departures"
                title="Discover hackathons"
                description="Open events, sorted the way you need. Save any of them to track it later."
              />
              <DiscoveryTabs tabs={tabs} />
            </div>
          </section>
        )}

        {/* PF 3: Community */}
        <section className="section border-t border-line">
          <div className="container-page">
            <SectionHeader
              pf={3}
              sign="Waiting hall"
              title="Build with the community"
              description="Hackathons are better with people. Find a team, ask other students, and read how they won."
            />
            <ul className="grid gap-6 md:grid-cols-3">
              {[
                {
                  href: '/teams',
                  icon: Users,
                  title: 'Team Finder',
                  tag: 'Teams',
                  body: 'Post what your team needs or browse students looking for one. Invite them, then chat privately.',
                  stat: countLabel(shownCount(community, 'teams'), 'teams looking for members'),
                  cta: 'Find teammates',
                  photo: PHOTOS.collegeGroupProject,
                  alt: 'A group of students laughing together around a table',
                },
                {
                  href: '/community',
                  icon: MessagesSquare,
                  title: 'Discussions',
                  tag: 'Ask',
                  body: 'Ask about an event, share resources, or get feedback on your idea from builders everywhere.',
                  stat: countLabel(shownCount(community, 'discussions'), 'discussions'),
                  cta: 'Join the conversation',
                  photo: PHOTOS.groupSelfie,
                  alt: 'Friends taking a group selfie',
                },
                {
                  href: '/wins',
                  icon: Trophy,
                  title: 'Winning stories',
                  tag: 'Wins',
                  body: 'Students share what they built, how they pitched and what they learned. Post yours when you win.',
                  stat: countLabel(shownCount(community, 'stories'), 'stories shared'),
                  cta: 'Read the stories',
                  photo: PHOTOS.codingContest,
                  alt: 'A student holding a hackathon prize cheque and certificate',
                },
              ].map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="group flex h-full flex-col overflow-hidden rounded-lg border-2 border-ink bg-card shadow-[4px_4px_0_0_rgb(var(--hf-ink))] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgb(var(--hf-ink))] motion-reduce:transition-none"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden border-b-2 border-ink bg-[#e6dfd1] dark:bg-[#26231d]">
                      <Image
                        src={c.photo.src}
                        alt={c.alt}
                        fill
                        sizes="(min-width: 768px) 400px, 100vw"
                        className="object-cover grayscale-[35%] transition-[transform,filter] duration-500 group-hover:scale-[1.03] group-hover:grayscale-0 motion-reduce:transition-none"
                      />
                      <span className="station-board absolute left-3 top-3 flex items-center gap-1.5 px-2.5 py-1.5">
                        <c.icon className="h-4 w-4" aria-hidden="true" />
                        <span className="font-display text-[14px] font-extrabold uppercase leading-none tracking-[0.08em]" aria-hidden="true">
                          {c.tag}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-[26px] font-bold uppercase leading-none tracking-[0.01em]">{c.title}</h3>
                      <p className="mt-2.5 text-[15px] leading-6 text-muted">{c.body}</p>
                      {c.stat && <p className="mt-3 font-mono text-xs uppercase tracking-[0.12em] text-ink">{c.stat}</p>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 font-display text-[15px] font-bold uppercase tracking-[0.06em] text-accent dark:text-board">
                        {c.cta}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* PF 4: Routes (categories) */}
        <section className="section border-t border-line bg-card/60">
          <div className="container-page">
            <SectionHeader pf={4} sign="Routes" title="Browse by category" action={{ href: '/hackathons', label: 'All themes' }} />
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c, i) => {
                const style = themeStyle(c.theme);
                const n = themeOpen[c.theme] ?? 0;
                return (
                  <li key={c.theme}>
                    <Link
                      href={`/hackathons?theme=${c.theme}`}
                      className="group flex h-full items-stretch overflow-hidden rounded-md border border-ink/15 bg-card transition-[border-color,box-shadow] hover:border-ink hover:shadow-[4px_4px_0_0_rgb(var(--hf-ink))]"
                    >
                      {/* The platform number plate. */}
                      <span className="flex w-16 shrink-0 flex-col items-center justify-center gap-1 bg-navy text-board">
                        <span className="font-display text-[34px] font-extrabold leading-none">{i + 1}</span>
                        <style.icon className="h-4 w-4 opacity-80" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1 p-4">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-display text-[22px] font-bold uppercase leading-none tracking-[0.01em] text-ink">{c.label}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden="true" />
                        </span>
                        <span className="mt-1.5 line-clamp-2 block text-sm leading-6 text-muted">{THEMES.find((t) => t.slug === c.theme)?.description}</span>
                        <span className="mt-2 inline-block rounded-[3px] bg-board px-1.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-navy">
                          {n === 1 ? '1 open' : `${n} open`}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* PF 5: Stations (cities) */}
        <section className="section border-t border-line">
          <div className="container-page">
            <SectionHeader
              pf={5}
              sign="Stations"
              title="Hackathons near you"
              description="Share your location or pick a city to see in-person events closest to you first. Your location stays in this browser."
            />
            <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {topCities.map((c) => {
                return (
                  <li key={c.slug}>
                    <Link
                      href={`/cities/${c.slug}`}
                      className="group block rounded-md transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent motion-reduce:transition-none"
                    >
                      <StationBoard en={c.name} note={c.open === 1 ? '1 open' : `${c.open} open`} posts />
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/near-me" className="btn-primary">
                <Navigation className="h-4 w-4" aria-hidden="true" />
                Find nearest events
              </Link>
              <Link href="/cities" className="btn-secondary">
                All stations
              </Link>
            </div>
          </div>
        </section>

        {/* Connecting lines (sources) */}
        {topSources.length > 0 && (
          <section className="border-t border-line bg-card/60 py-10">
            <div className="container-page flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-sm text-sm leading-6 text-muted">
                <span className="mb-1 block font-mono text-[11px] uppercase tracking-[0.16em] text-ink">Connecting lines</span>
                Listings are gathered from these sources and more, checked twice a day, and link to the official registration page.{' '}
                <Link href="/how-it-works" className="font-semibold text-ink underline decoration-board decoration-2 underline-offset-2">
                  How it works
                </Link>
              </p>
              <ul className="flex flex-wrap gap-2">
                {topSources.map((s) => (
                  <li key={s.name} className="flex items-center overflow-hidden rounded-[4px] border border-ink/20">
                    <span className="px-2.5 py-1 font-display text-[17px] font-bold uppercase tracking-[0.04em] text-ink">{s.name}</span>
                    <span className="self-stretch bg-navy px-2 py-1 font-mono text-xs font-bold tabular-nums leading-[22px] text-board">{s.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* For organizers: get it on the board */}
        <section className="border-t border-line py-14">
          <div className="container-page">
            <div className="station-board flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-10">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase leading-none tracking-[0.18em]">For organizers</p>
                <h2 className="mt-2 text-[2.2rem] text-navy sm:text-[2.8rem]">Running a hackathon? Get it on the board.</h2>
                <p className="mt-2 max-w-xl text-[15px] leading-6 text-navy/75">
                  List it for free. Students see it next to every other open event and register on your page.
                </p>
              </div>
              <Link
                href="/submit"
                className="btn shrink-0 border-navy bg-navy text-board shadow-[3px_3px_0_0_rgb(22_19_15/0.35)] hover:-translate-x-px hover:-translate-y-px active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                Submit a hackathon
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
