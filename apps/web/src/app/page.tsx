import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Megaphone, MessagesSquare, Navigation, Trophy, Users } from 'lucide-react';
import { CITIES, THEMES, cityName, placeName, sourceBySlug, type ThemeSlug } from '@hackathonfinder/shared';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HackathonCard from '@/components/hackathon/HackathonCard';
import HomeSearch, { type CityOption } from '@/components/home/HomeSearch';
import DiscoveryTabs, { type DiscoveryTab } from '@/components/home/DiscoveryTabs';
import CodeField from '@/components/home/CodeField';
import CountUp from '@/components/home/CountUp';
import DeparturesBoard, { type Departure } from '@/components/home/DeparturesBoard';
import { HeroEditor, HeroTerminal, type TerminalRun } from '@/components/home/HeroWindows';
import PosterWall from '@/components/home/PosterWall';
import RotatingWord from '@/components/home/RotatingWord';
import { PHOTOS } from '@/components/landing/photos';
import { formatInrCompact } from '@/lib/format';
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
const countLabel = (n: number | undefined, noun: string) => (n === undefined ? undefined : `${n.toLocaleString('en-IN')} ${noun}`);

// The catalog has one theme for web and mobile apps ("Web & App"), so they share a tile.
const CATEGORIES: { theme: ThemeSlug; label: string }[] = [
  { theme: 'ai-ml', label: 'AI / ML' },
  { theme: 'web-dev', label: 'Web & mobile development' },
  { theme: 'web3', label: 'Blockchain & Web3' },
  { theme: 'fintech', label: 'FinTech' },
  { theme: 'cybersecurity', label: 'Cybersecurity' },
  { theme: 'open-innovation', label: 'Open innovation' },
];

/** "today", "tomorrow", "4 days": short enough for a terminal column. */
function closesIn(days: number): string {
  if (days <= 0) return 'today';
  return days === 1 ? 'tomorrow' : `${days} days`;
}

function terminalRows(list: HackathonView[]): TerminalRun['rows'] {
  return list.slice(0, 3).map((h) => ({ title: h.title, where: placeName(h), when: closesIn(h.daysToDeadline) }));
}

function Grid({ items }: { items: HackathonView[] }) {
  return (
    // Phones show four; the "View all" button below covers the rest.
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-sm:[&>*:nth-child(n+5)]:hidden">
      {items.map((h) => (
        <HackathonCard key={h.slug} h={h} />
      ))}
    </div>
  );
}

function SectionHeader({ title, description, action }: { title: string; description?: string; action?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl sm:text-[1.75rem]">{title}</h2>
        {description && <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-accent hover:text-accent-dark">
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
  // Real banners for the hero's poster wall, soonest deadline first.
  const posters = [...open].filter((h) => h.imageUrl).sort(byDeadline).slice(0, 30);
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
    { label: 'In open prize pools', value: prizeTotal > 0 ? formatInrCompact(prizeTotal) : '—' },
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
  // City pages exist for catalog cities, so the shortcuts use those.
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

  // The hero terminal "runs" real searches over the live listings.
  const aiOnline = [...open].filter((h) => h.mode === 'online' && h.themes.includes('ai-ml')).sort(byDeadline);
  const busiest = topCities[0];
  const inBusiest = busiest ? [...open].filter((h) => h.city === busiest.slug && h.mode !== 'online').sort(byDeadline) : [];
  const runs: TerminalRun[] = [
    { command: 'hf search --open --sort=deadline', summary: `${open.length} hackathons open`, rows: terminalRows([...open].sort(byDeadline)) },
    ...(aiOnline.length ? [{ command: 'hf search --theme=ai-ml --online', summary: `${aiOnline.length} matches`, rows: terminalRows(aiOnline) }] : []),
    ...(inBusiest.length ? [{ command: `hf near ${busiest.slug}`, summary: `${inBusiest.length} in ${busiest.name}`, rows: terminalRows(inBusiest) }] : []),
  ];

  return (
    <>
      {open.length > 0 && <JsonLd data={itemListJsonLd('Upcoming hackathons in India', open)} />}
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {/* Hero: a dark band (data-theme flips the colour tokens inside it), with the live poster wall. */}
        <section data-theme="dark" data-hero-dark className="relative isolate -mt-16 overflow-hidden bg-surface pt-16 text-ink">
          <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0 -z-10" />
          <CodeField className="hero-code pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1100px] w-full" />

          {/* Wide screens: a live terminal and an editor float either side of the headline. */}
          {runs.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-[150px] mx-auto hidden max-w-[1440px] min-[1400px]:block">
              <HeroTerminal runs={runs} className="hero-float absolute left-4 w-[340px] [--tilt:12deg]" />
              <HeroEditor className="hero-float absolute right-4 top-24 w-[330px] [--tilt:-12deg] [animation-delay:-3s]" />
            </div>
          )}

          <div className="container-page pt-14 text-center sm:pt-20">
            {open.length > 0 && (
              <Link
                href="/hackathons?status=closing-soon"
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] py-1 pl-1.5 pr-3.5 text-xs font-medium text-white/85 backdrop-blur transition-colors hover:border-white/30 hover:bg-white/10 sm:text-sm"
              >
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4ade80] opacity-75 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4ade80]" />
                </span>
                <span>
                  <span className="font-semibold text-white">{open.length} hackathons</span> open<span className="hidden sm:inline"> for registration right now</span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
              </Link>
            )}

            <h1 className="mx-auto max-w-5xl text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-white min-[400px]:text-[2.6rem] sm:text-7xl sm:leading-[1.02] lg:text-[5.5rem]">
              <span className="sr-only">Find hackathons. Build something meaningful.</span>
              <span aria-hidden="true">
                Find hackathons.
                <br />
                Build
                {/* Phones: the changing word gets its own line, so a long word never reflows the page. */}
                <span className="hidden sm:inline"> </span>
                <br className="sm:hidden" />
                <RotatingWord
                  words={['something real', 'AI agents', 'Web3 apps', 'with friends', 'for impact', 'to win']}
                  wordClassName="hero-word pb-[0.08em]"
                />
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              Discover upcoming hackathons, explore opportunities, find teammates and compete with builders around the world.
            </p>

            <div className="mx-auto mt-10 max-w-5xl text-left">
              <HomeSearch cities={cityOptions} />
            </div>

            <div className="mx-auto mt-14 max-w-5xl text-left sm:mt-16">
              <DeparturesBoard departures={departures} nowIso={nowIso} />
            </div>
          </div>

          <div className="relative mt-6 sm:mt-4">
            <PosterWall items={posters} />
          </div>

          <div className="container-page relative pb-12 sm:pb-14">
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="bg-surface/90 px-5 py-4 backdrop-blur">
                  <dt className="text-sm text-white/55">{s.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{s.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-xs text-white/40">
              Live from our listings. The prize total adds up stated prizes only (USD converted to INR) and leaves out figures that look like listing
              errors.
            </p>
          </div>
        </section>

        {/* Featured */}
        {featured.length > 0 && (
          <section className="section">
            <div className="container-page">
              <SectionHeader
                title="Featured opportunities"
                description="Promoted listings first, then the biggest prize pools still open for registration."
                action={{ href: '/hackathons?sort=prize', label: 'See all by prize' }}
              />
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <HackathonCard h={featured[0]} variant="featured" eager />
                {featured.length > 1 && (
                  <div className="flex flex-col gap-3">
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

        {/* Community */}
        <section className="section border-t border-line bg-card">
          <div className="container-page">
            <SectionHeader
              title="Build with the community"
              description="Hackathons are better with people. Find a team, ask other students, and read how they won."
            />
            <ul className="grid gap-5 md:grid-cols-3">
              {[
                {
                  href: '/teams',
                  icon: Users,
                  title: 'Team Finder',
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
                  body: 'Ask about an event, share resources, or get feedback on your idea from students across India.',
                  stat: countLabel(shownCount(community, 'discussions'), 'discussions'),
                  cta: 'Join the conversation',
                  photo: PHOTOS.groupSelfie,
                  alt: 'Friends taking a group selfie',
                },
                {
                  href: '/wins',
                  icon: Trophy,
                  title: 'Winning stories',
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
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-card transition-[border-color,box-shadow] hover:border-ink/15 hover:shadow-lift"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#eceef3] dark:bg-[#22242e]">
                      <Image
                        src={c.photo.src}
                        alt={c.alt}
                        fill
                        sizes="(min-width: 768px) 400px, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="flex items-center gap-2 text-lg">
                        <c.icon className="h-[18px] w-[18px] text-accent" aria-hidden="true" />
                        {c.title}
                      </h3>
                      <p className="mt-2 text-[15px] leading-6 text-muted">{c.body}</p>
                      {c.stat && <p className="mt-3 text-sm font-medium text-ink">{c.stat}</p>}
                      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent">
                        {c.cta}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Discovery */}
        {tabs.length > 0 && (
          <section className="section border-t border-line">
            <div className="container-page">
              <SectionHeader title="Discover hackathons" description="Open events, sorted the way you need. Save any of them to track it later." />
              <DiscoveryTabs tabs={tabs} />
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="section border-t border-line bg-card">
          <div className="container-page">
            <SectionHeader title="Browse by category" action={{ href: '/hackathons', label: 'All themes' }} />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c) => {
                const style = themeStyle(c.theme);
                const n = themeOpen[c.theme] ?? 0;
                return (
                  <li key={c.theme}>
                    <Link
                      href={`/hackathons?theme=${c.theme}`}
                      className="group flex h-full items-start gap-4 rounded-xl border border-line bg-card p-5 shadow-card transition-[border-color,box-shadow] hover:border-ink/15 hover:shadow-lift"
                    >
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent dark:bg-accent/15 dark:text-brand-300">
                        <style.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-ink">{c.label}</span>
                          <ArrowUpRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" aria-hidden="true" />
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-muted">{THEMES.find((t) => t.slug === c.theme)?.description}</span>
                        <span className="mt-2 block text-sm font-medium text-ink/80">{n === 1 ? '1 open event' : `${n} open events`}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Cities + near me */}
        <section className="section border-t border-line">
          <div className="container-page grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
            <div>
              <h2 className="text-2xl sm:text-[1.75rem]">Hackathons near you</h2>
              <p className="mt-2 max-w-md text-[15px] leading-6 text-muted">
                Share your location or pick a city to see in-person events closest to you first. Your location stays in this browser.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/near-me" className="btn-primary">
                  <Navigation className="h-4 w-4" aria-hidden="true" />
                  Find nearest events
                </Link>
                <Link href="/cities" className="btn-secondary">
                  All cities
                </Link>
              </div>
            </div>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {topCities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/cities/${c.slug}`}
                    className="flex h-full flex-col rounded-lg border border-line bg-card px-4 py-3 shadow-card transition-colors hover:border-ink/20"
                  >
                    <span className="truncate text-sm font-medium text-ink">{c.name}</span>
                    <span className="mt-0.5 text-xs text-muted">{c.open === 1 ? '1 open' : `${c.open} open`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Sources */}
        {topSources.length > 0 && (
          <section className="border-t border-line bg-card py-10">
            <div className="container-page flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="max-w-sm text-sm leading-6 text-muted">
                Listings are gathered from these sources and more, checked twice a day, and link to the official registration page.{' '}
                <Link href="/how-it-works" className="font-medium text-ink underline-offset-2 hover:underline">
                  How it works
                </Link>
              </p>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {topSources.map((s) => (
                  <li key={s.name} className="flex items-baseline gap-2">
                    <span className="text-[15px] font-semibold text-ink/80">{s.name}</span>
                    <span className="text-xs tabular-nums text-muted">{s.n}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* For organizers */}
        <section className="border-t border-line py-12">
          <div className="container-page flex flex-col gap-5 rounded-xl border border-line bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent dark:bg-accent/15 dark:text-brand-300">
                <Megaphone className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl">Organizing a hackathon?</h2>
                <p className="mt-1 max-w-xl text-[15px] leading-6 text-muted">
                  List it for free. Students see it next to every other open event and register on your page.
                </p>
              </div>
            </div>
            <Link href="/submit" className="btn-primary shrink-0">
              Submit a hackathon
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
