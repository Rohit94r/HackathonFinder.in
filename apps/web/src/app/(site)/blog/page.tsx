import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Flame } from 'lucide-react';
import EventArt from '@/components/hackathon/EventArt';
import { PageHero, SectionHeading } from '@/components/ui';
import WinCard from '@/components/wins/WinCard';
import { blogPosts, postIsoDate } from '@/data/blogData';
import { newsCategory, newsPosts } from '@/data/newsData';
import { trendingHackathons } from '@/lib/hackathons';
import { blogListJsonLd, breadcrumbJsonLd, JsonLd, pageMetadata, abs } from '@/lib/seo';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';
import { latestWins } from '@/server/wins';

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Hackathon Guides & Tips for Students',
    description:
      'Free hackathon guides for students: what a hackathon is, finding events near you, winning your first one, finding teammates and pitching to judges.',
    path: '/blog',
    keywords: ['hackathon tips', 'how to win a hackathon', 'hackathon guide', 'what is a hackathon', 'hackathons for beginners', 'hackathon resume'],
  }),
  alternates: { canonical: abs('/blog'), types: { 'application/rss+xml': abs('/blog/rss.xml') } },
};

export default async function BlogPage() {
  const [featured, ...rest] = blogPosts;
  const user = await getSessionUser();
  const viewer = user ? { id: user.id, handle: user.handle, role: user.role } : null;
  const wins = await latestWins(3, viewer);
  const trendingEvents = trendingHackathons((await getHackathons()).items, 3);
  const latestNews = newsPosts.slice(0, 3);

  return (
    <>
      <JsonLd
        data={[
          blogListJsonLd(blogPosts.map((p) => ({ slug: p.slug, title: p.title, published: postIsoDate(p.date), modified: postIsoDate(p.updated ?? p.date) }))),
          breadcrumbJsonLd([{ name: 'Blog', path: '/blog' }]),
        ]}
      />
      <PageHero title="Guides to help"
        accent="you hack better"
        description="Practical advice on picking hackathons, building fast, working as a team and pitching to judges."
      />
      <section className="section bg-surface pt-12">
        <div className="container-page">
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group card mb-10 grid overflow-hidden transition hover:shadow-lift md:grid-cols-2"
            >
              <EventArt theme={featured.theme} title={featured.title} label={featured.category} size="hero" className="min-h-[240px]" />
              <div className="flex flex-col justify-center p-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink">Latest guide</p>
                <h2 className="mt-3 font-sans text-3xl font-semibold normal-case leading-tight tracking-normal group-hover:underline">{featured.title}</h2>
                <p className="mt-3 text-ink/70">{featured.excerpt}</p>
                <p className="mt-5 text-sm text-ink/60">
                  {featured.date} · {featured.readMinutes} min read
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Read the guide
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          )}

          <div data-reveal-stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                <EventArt theme={post.theme} title={post.title} label={post.category} className="h-40" />
                <div className="p-6">
                  <p className="text-xs text-ink/60">
                    {post.date} · {post.readMinutes} min read
                  </p>
                  <h3 className="mt-2 text-xl font-bold leading-snug group-hover:underline">{post.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-ink/70">{post.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-ink/10 bg-surface">
        <div className="container-page">
          <SectionHeading
            eyebrow="From students"
            title="Winning stories from students"
            description="How students won (or made the finals): the problem, what they built and what the judges liked."
            action={{ href: '/wins', label: 'All winning stories' }}
          />
          <div data-reveal-stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {wins.items.map((story) => (
              <WinCard key={story.id} story={story} now={wins.now} />
            ))}
          </div>
        </div>
      </section>

      {trendingEvents.length > 0 && (
        <section className="section border-t border-ink/10">
          <div className="container-page">
            <SectionHeading
              eyebrow="Trending hackathons"
              title="Open events students are opening most"
              description="The hackathons getting the most attention right now, so you can pick one before the deadline."
              action={{ href: '/hackathons', label: 'All hackathons' }}
            />
            <div data-reveal-stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trendingEvents.map((h) => (
                <Link key={h.slug} href={`/hackathons/${h.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <EventArt title={h.title} imageUrl={h.imageUrl} label={h.mode === 'online' ? 'Online' : h.cityName ?? h.city} className="h-40" />
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

      <section className="section border-t border-ink/10 bg-surface">
        <div className="container-page">
          <SectionHeading
            eyebrow="News & trends"
            title="What's moving in tech this week"
            description="AI models, the skills internships keep asking for and where the market is heading, briefed for students who build."
            action={{ href: '/news', label: 'All news & trends' }}
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {latestNews.map((post) => (
              <Link key={post.slug} href={`/news/${post.slug}`} className="card flex h-full flex-col p-6 transition hover:-translate-y-1 hover:shadow-lift">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
                  {newsCategory(post.category)?.name} · {post.readMinutes} min
                </p>
                <h3 className="mt-2 text-lg font-bold leading-snug">{post.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink/70">{post.dek}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  Read
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
