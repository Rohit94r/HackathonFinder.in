import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Flame, TrendingUp } from 'lucide-react';
import EventArt from '@/components/hackathon/EventArt';
import NewsletterForm from '@/components/NewsletterForm';
import { PageHero, SectionHeading } from '@/components/ui';
import { NEWS_CATEGORIES, newsCategory, newsPosts, newsIsoDate } from '@/data/newsData';
import { trendingHackathons } from '@/lib/hackathons';
import { breadcrumbJsonLd, JsonLd, newsListJsonLd, pageMetadata } from '@/lib/seo';
import { getHackathons } from '@/server/hackathons';
import { cn } from '@/lib/cn';

export const metadata: Metadata = pageMetadata({
  title: 'AI, Skills & Hackathon News',
  description:
    'AI models, in-demand skills and market trends, briefed for student builders. Plus what is moving in hackathons and how to act on it.',
  path: '/news',
  keywords: ['ai news for students', 'tech skills 2026', 'hackathon trends', 'ai models', 'market trends', 'tech careers'],
});

export default async function NewsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const searchParams = await props.searchParams;
  const raw = Array.isArray(searchParams.category) ? searchParams.category[0] : searchParams.category;
  const current = raw ? newsCategory(raw) : undefined;
  const posts = current ? newsPosts.filter((p) => p.category === current.slug) : newsPosts;
  const [featured, ...rest] = posts;
  const trendingNews = newsPosts.filter((p) => p.trending).slice(0, 3);
  const trendingEvents = trendingHackathons((await getHackathons()).items, 3);

  return (
    <>
      <JsonLd
        data={[
          newsListJsonLd(newsPosts.map((p) => ({ slug: p.slug, title: p.title, published: newsIsoDate(p.date) }))),
          breadcrumbJsonLd([
            { name: 'News', path: '/news' },
            ...(current ? [{ name: current.name, path: `/news?category=${current.slug}` }] : []),
          ]),
        ]}
      />
      <PageHero
        eyebrow="News & trends"
        title="What's moving"
        accent="in tech right now"
        description="Short briefings on AI models, the skills internships keep asking for and where the market is heading, written for students who build."
      >
        <nav aria-label="News categories" className="flex flex-wrap gap-2">
          <Link
            href="/news"
            aria-current={!current ? 'page' : undefined}
            className={cn(
              'rounded-md border px-3 py-1.5 text-sm font-semibold transition',
              !current ? 'border-ink bg-ink text-surface' : 'border-line text-ink hover:border-ink'
            )}
          >
            All
          </Link>
          {NEWS_CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/news?category=${c.slug}`}
              aria-current={current?.slug === c.slug ? 'page' : undefined}
              className={cn(
                'rounded-md border px-3 py-1.5 text-sm font-semibold transition',
                current?.slug === c.slug ? 'border-ink bg-ink text-surface' : 'border-line text-ink hover:border-ink'
              )}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </PageHero>

      <section className="section bg-surface pt-12">
        <div className="container-page">
          {featured ? (
            <Link
              href={`/news/${featured.slug}`}
              className="group card mb-10 grid overflow-hidden transition hover:shadow-lift md:grid-cols-2"
            >
              <EventArt title={featured.title} label={newsCategory(featured.category)?.name} size="hero" className="min-h-[240px]" />
              <div className="flex flex-col justify-center p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink">
                  {current ? current.name : 'Latest briefing'}
                </p>
                <h2 className="mt-3 font-sans text-3xl font-semibold normal-case leading-tight tracking-normal group-hover:underline">
                  {featured.title}
                </h2>
                <p className="mt-3 text-ink/70">{featured.dek}</p>
                <p className="mt-5 text-sm text-ink/60">
                  {featured.date} · {featured.readMinutes} min read
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Read the briefing
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ) : (
            <p className="mb-10 text-ink/70">Nothing filed under this desk yet. <Link href="/news" className="font-semibold text-ink underline">See all briefings</Link>.</p>
          )}

          <div data-reveal-stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link key={post.slug} href={`/news/${post.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                <EventArt title={post.title} label={newsCategory(post.category)?.name} className="h-40" />
                <div className="p-6">
                  <p className="text-xs text-ink/60">
                    {post.date} · {post.readMinutes} min read
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-snug group-hover:underline">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-ink/70">{post.dek}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {trendingEvents.length > 0 && (
        <section className="section border-t border-ink/10">
          <div className="container-page">
            <SectionHeading
              eyebrow="Trending now"
              title="Hackathons students are opening most"
              description="The events getting the most attention on HackathonFinder right now."
              action={{ href: '/hackathons', label: 'All hackathons' }}
            />
            <div data-reveal-stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trendingEvents.map((h) => (
                <Link key={h.slug} href={`/hackathons/${h.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <EventArt title={h.title} imageUrl={h.imageUrl} label={h.mode === 'online' ? 'Online' : h.city} className="h-40" />
                  <div className="p-6">
                    <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink/60">
                      <Flame className="h-3.5 w-3.5" />
                      {h.status === 'closing-soon' ? 'Closing soon' : 'Open now'}
                    </p>
                    <h3 className="mt-2 text-xl font-bold leading-snug group-hover:underline">{h.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-ink/70">{h.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section border-t border-ink/10">
        <div className="container-page">
          <SectionHeading
            eyebrow="Worth reading"
            title="Still moving this week"
            description="The briefings with the most attention from students right now."
            action={{ href: '/news', label: 'All briefings' }}
          />
          <ul className="grid gap-4 sm:grid-cols-3">
            {trendingNews.map((post) => (
              <li key={post.slug}>
                <Link href={`/news/${post.slug}`} className="card flex h-full flex-col justify-between p-6 transition hover:-translate-y-1 hover:shadow-lift">
                  <div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-ink/60">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {newsCategory(post.category)?.name}
                    </span>
                    <h3 className="mt-2 text-lg font-bold leading-snug group-hover:underline">{post.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-ink/60">{post.readMinutes} min read</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section border-t border-ink/10 bg-surface">
        <div className="container-page max-w-3xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Get the weekly digest</h2>
          <p className="mx-auto mt-2 max-w-xl text-ink/70">
            New hackathons for your cities and themes, plus the deadlines closing soon. One email every Monday.
          </p>
          <div className="mx-auto mt-6 max-w-md">
            <NewsletterForm dark={false} />
          </div>
        </div>
      </section>
    </>
  );
}
