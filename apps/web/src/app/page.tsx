import Link from 'next/link';
import { ArrowRight, Bell, Globe, GraduationCap, Layers, MapPin, Radar, Rocket, Search, Users } from 'lucide-react';
import { CITIES, SOURCES, THEMES } from '@hackathonfinder/shared';
import HeroScene from '@/components/art/HeroScene';
import Sticker from '@/components/art/Sticker';
import HeroSearch from '@/components/search/HeroSearch';
import HackathonCard from '@/components/hackathon/HackathonCard';
import FeaturedSlider from '@/components/hackathon/FeaturedSlider';
import EventArt from '@/components/hackathon/EventArt';
import FAQTabs from '@/components/FAQTabs';
import NewsletterForm from '@/components/NewsletterForm';
import { SampleNotice, SectionHeading } from '@/components/ui';
import { blogPosts } from '@/data/blogData';
import { organizerFaqs, studentFaqs } from '@/data/faqData';
import { getHackathons, closingSoon, openOnly, themeCounts, cityCounts } from '@/lib/hackathons';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';

export const dynamic = 'force-dynamic';

const BENEFITS = [
  {
    icon: Radar,
    title: 'We search everywhere.',
    text: 'Unstop, Devfolio, Devpost, Instagram, LinkedIn, Google, college sites and more. Checked every day, so you don’t have to.',
  },
  {
    icon: Layers,
    title: 'One clear card per event.',
    text: 'Dates, deadline, team size, prizes and who can join, all in one place. The same event on three sites shows up once.',
  },
  {
    icon: Search,
    title: 'Find what fits you.',
    text: 'Filter by city, online, theme, deadline, fee and prize, or just type what you want in plain words.',
  },
  {
    icon: Bell,
    title: 'Never miss a deadline.',
    text: 'Save events to My hackathons and track them from saved to submitted. Email reminders are coming soon.',
  },
];

const AUDIENCE = [
  { icon: GraduationCap, lines: ['College students', 'in Pune and beyond'] },
  { icon: Rocket, lines: ['First-timers', 'and pro hackers'] },
  { icon: Users, lines: ['Teams looking for', 'their next win'] },
];

export default function HomePage() {
  const { items } = getHackathons();
  const open = openOnly(items);
  const urgent = closingSoon(items, 4);
  const featured = open.filter((h) => h.featured);
  const fresh = [...open].sort((a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt)).slice(0, 6);
  const themes = themeCounts(items);
  const cities = cityCounts(items);
  const sourceNames = SOURCES.map((s) => s.name);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="container-page relative flex flex-col items-center pt-16 text-center sm:pt-24">
          <h1 className="text-[12vw] text-surface sm:text-8xl lg:text-[9rem]">Find every</h1>
          <p className="font-display text-[12vw] uppercase leading-[0.9] tracking-tight text-outline sm:text-8xl lg:text-[9rem]">
            hackathon
          </p>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-surface/85">
            Every platform lists only its own events. HackathonFinder searches Unstop, Devfolio,
            Instagram, LinkedIn, Google and {SOURCES.length - 5}+ more places, and puts them all in one
            place. Free for students.
          </p>
          <div className="mt-10 flex w-full justify-center">
            <HeroSearch />
          </div>
        </div>
        <HeroScene className="-mt-4 sm:-mt-10" />
      </section>

      {/* Sources marquee */}
      <section className="overflow-hidden border-y-2 border-ink bg-white py-6" aria-label="Where we look">
        <div className="flex">
          <div className="flex shrink-0 animate-marquee items-center gap-10 pr-10">
            {[...sourceNames, ...sourceNames].map((name, i) => (
              <span key={`${name}-${i}`} className="flex items-center gap-10 whitespace-nowrap font-display text-2xl uppercase text-ink">
                {name}
                <span aria-hidden="true" className="h-3 w-3 rounded-full bg-ink" />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Statement + digest */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <Sticker text="No FOMO" tone="green" className="left-[6%] top-14 hidden -rotate-12 lg:inline-flex" />
        <Sticker text="Free for students" tone="yellow" shape="burst" className="right-[6%] top-10 hidden rotate-12 lg:inline-flex" />
        <Sticker text="Build bold" tone="turquoise" shape="circle" className="bottom-12 left-[10%] hidden rotate-6 lg:inline-flex" />
        <Sticker text="Team up" tone="dark" className="bottom-16 right-[9%] hidden -rotate-6 lg:inline-flex" />
        <div className="container-page flex flex-col items-center text-center">
          <h2 className="max-w-5xl text-5xl sm:text-7xl lg:text-8xl">Every hackathon. One place.</h2>
          <p className="mt-8 max-w-2xl text-lg leading-8 text-ink/75">
            Stop checking ten websites and scrolling Instagram for posters. We find the hackathons,
            clean up the details and send you to the official page to register.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/hackathons" className="btn-primary">
              Explore hackathons
            </Link>
            <Link href="/how-it-works" className="btn-secondary">
              How it works
            </Link>
          </div>
          <div className="mt-10 flex w-full justify-center">
            <NewsletterForm dark={false} />
          </div>
        </div>
      </section>

      {/* Numbered benefits */}
      <section className="container-page pb-24">
        <div className="border-t border-ink/40">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className="grid gap-6 border-b border-ink/40 py-8 md:grid-cols-[1fr_1.2fr_auto] md:items-center">
              <div className="flex items-center gap-5">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-2xl uppercase leading-none sm:text-3xl">{b.title}</h3>
              </div>
              <p className="text-base leading-7 text-ink/75">{b.text}</p>
              <span className="hidden h-24 w-24 items-center justify-center rounded-full bg-white shadow-card md:inline-flex">
                <b.icon className="h-10 w-10 text-ink" />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Closing soon (dark) */}
      <section className="on-dark bg-ink py-24">
        <div className="container-page">
          <div className="mb-12 flex flex-col items-center text-center">
            <h2 className="text-5xl text-surface sm:text-7xl">Closing soon.</h2>
            <p className="mt-5 max-w-xl text-lg text-surface/80">
              Registration ends in the next few days. Lock in your team today.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {urgent.map((h) => (
              <HackathonCard key={h.slug} h={h} />
            ))}
          </div>
          <div className="mt-10 flex justify-center">
            <Link href="/hackathons?sort=deadline" className="btn-primary">
              See all by deadline
            </Link>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-surface/10 bg-ink pb-24">
        <div className="container-page grid gap-10 pt-4 lg:grid-cols-2 lg:items-end">
          <p className="max-w-md text-lg leading-8 text-surface/80 lg:order-1">
            Whether it’s your first hackathon or your fiftieth, HackathonFinder helps you find events
            you can actually join, near you or online.
          </p>
          <div className="text-left lg:order-2 lg:text-right">
            <h2 className="text-6xl text-surface sm:text-8xl">Who it’s</h2>
            <p className="font-display text-6xl uppercase leading-[0.9] tracking-tight text-outline sm:text-8xl">for</p>
          </div>
        </div>
        <div className="container-page mt-16 grid divide-y divide-surface/20 border-y border-surface/20 md:grid-cols-3 md:divide-x md:divide-y-0">
          {AUDIENCE.map((a) => (
            <div key={a.lines[0]} className="flex flex-col items-center gap-5 px-6 py-10 text-center">
              <a.icon className="h-12 w-12 text-white" />
              <div>
                {a.lines.map((line) => (
                  <p key={line} className="font-display text-xl uppercase leading-tight text-surface">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Big stacked statement */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <Sticker text="36h of code" tone="yellow" className="left-[5%] top-16 hidden -rotate-6 lg:inline-flex" />
        <Sticker text="Ship it" tone="green" shape="circle" className="right-[6%] top-24 hidden rotate-12 lg:inline-flex" />
        <Sticker text="Win big" tone="turquoise" shape="burst" className="bottom-10 left-[8%] hidden -rotate-12 lg:inline-flex" />
        <Sticker text="Learn fast" tone="dark" className="bottom-20 right-[8%] hidden rotate-3 lg:inline-flex" />
        <div className="container-page flex flex-col items-center text-center">
          {['No more ten tabs.', 'No more missed', 'deadlines. Just', 'find it, build it,', 'win it.'].map((line) => (
            <p key={line} className="font-display text-4xl uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* Featured slider */}
      {featured.length > 0 && (
        <section className="bg-white py-24">
          <div className="container-page">
            <FeaturedSlider items={featured} />
          </div>
        </section>
      )}

      {/* Themes */}
      <section className="section">
        <div className="container-page">
          <SectionHeading title="What do you want to build?" action={{ href: '/hackathons', label: 'All themes' }} />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {THEMES.slice(0, 10).map((t) => {
              const style = themeStyle(t.slug);
              return (
                <Link
                  key={t.slug}
                  href={`/themes/${t.slug}`}
                  className="group card flex flex-col gap-3 p-5 transition hover:-translate-y-1 hover:shadow-lift"
                >
                  <span className={cn('inline-flex w-fit rounded-full p-3', style.soft)}>
                    <style.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-lg uppercase leading-tight text-ink">{t.name}</span>
                  <span className="text-xs text-ink/60">
                    {themes[t.slug] ?? 0} open {themes[t.slug] === 1 ? 'event' : 'events'}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="section pt-0">
        <div className="container-page">
          <SectionHeading title="Hackathons near you" description="Starting with Pune, plus online events you can join from anywhere." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/cities/pune"
              className="group relative overflow-hidden rounded-[20px] bg-ink p-8 text-surface shadow-card transition hover:-translate-y-1 hover:shadow-lift sm:col-span-2 lg:row-span-2"
            >
              <Sticker text="Launching here" tone="yellow" className="right-6 top-6 rotate-6" />
              <div className="flex h-full flex-col justify-end gap-3 pt-16">
                <MapPin className="h-10 w-10 text-white" />
                <h3 className="font-display text-6xl uppercase leading-none text-surface">Pune</h3>
                <p className="text-surface/80">{cities.pune ?? 0} open hackathons, from college fests to 36-hour builds.</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold uppercase text-white">
                  Explore Pune
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
            <Link href="/hackathons?city=online" className="card group flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lift">
              <span className="rounded-full bg-ink/5 p-3 text-ink">
                <Globe className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display uppercase text-ink">Online</span>
                <span className="text-xs text-ink/60">{cities.online ?? 0} open events</span>
              </span>
            </Link>
            {CITIES.filter((c) => !c.launch).map((c) => (
              <Link key={c.slug} href={`/cities/${c.slug}`} className="card group flex items-center gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="rounded-full bg-ink/5 p-3 text-ink">
                  <MapPin className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display uppercase text-ink">{c.name}</span>
                  <span className="text-xs text-ink/60">{cities[c.slug] ?? 0} open events</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Fresh this week */}
      <section className="section bg-white">
        <div className="container-page">
          <SectionHeading title="Fresh this week" action={{ href: '/hackathons?sort=newest', label: 'See newest' }} />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {fresh.map((h) => (
              <HackathonCard key={h.slug} h={h} />
            ))}
          </div>
          <SampleNotice className="mt-8" />
        </div>
      </section>

      {/* Team Finder + Organizers */}
      <section className="section">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-[20px] border-2 border-ink bg-white p-8 sm:p-12">
            <h2 className="text-4xl sm:text-5xl">Great idea, no team?</h2>
            <p className="mt-4 max-w-md text-ink/80">
              Post the skills you have and the skills you need. Find a designer, a backend dev or a
              pitch person for your next hackathon.
            </p>
            <Link href="/teams" className="btn mt-8 bg-ink text-surface hover:bg-ink-700">
              Find teammates
            </Link>
          </div>
          <div className="on-dark relative overflow-hidden rounded-[20px] bg-ink p-8 sm:p-12">
            <h2 className="text-4xl text-surface sm:text-5xl">Running a hackathon?</h2>
            <p className="mt-4 max-w-md text-surface/80">
              List it for free and reach students who are actively looking. Featured spots are
              available when you want extra reach.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/submit" className="btn-primary">
                Submit your hackathon
              </Link>
              <Link href="/organizers" className="btn-ghost-dark">
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section className="section pt-0">
        <div className="container-page">
          <SectionHeading title="Guides to help you win" action={{ href: '/blog', label: 'Read the blog' }} />
          <div className="grid gap-5 md:grid-cols-3">
            {blogPosts.slice(0, 3).map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                <EventArt theme={post.theme} title={post.title} label={post.category} className="h-40" />
                <div className="p-6">
                  <p className="text-xs text-ink/60">
                    {post.date} · {post.readMinutes} min read
                  </p>
                  <h3 className="mt-2 text-xl font-semibold leading-snug">{post.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-ink/70">{post.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                    Read guide
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faqs" className="section bg-white">
        <div className="container-page">
          <FAQTabs students={studentFaqs} organizers={organizerFaqs} />
        </div>
      </section>
    </>
  );
}
