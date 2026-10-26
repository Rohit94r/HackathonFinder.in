import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import EventArt from '@/components/hackathon/EventArt';
import { PageHero, SectionHeading } from '@/components/ui';
import WinCard from '@/components/wins/WinCard';
import { blogPosts } from '@/data/blogData';
import { pageMetadata } from '@/lib/seo';
import { getSessionUser } from '@/server/auth';
import { latestWins } from '@/server/wins';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathon Guides & Tips for Students in India',
  description:
    'Free hackathon guides for Indian students: what a hackathon is, how to find hackathons near you, win your first one, find teammates, pitch to judges and use wins for internships.',
  path: '/blog',
  keywords: ['hackathon tips', 'how to win a hackathon', 'hackathon guide', 'what is a hackathon', 'hackathons for beginners', 'hackathon resume'],
});

export default async function BlogPage() {
  const [featured, ...rest] = blogPosts;
  const user = await getSessionUser();
  const viewer = user ? { id: user.id, handle: user.handle, role: user.role } : null;
  const wins = await latestWins(3, viewer);

  return (
    <>
      <PageHero
        title="Guides to help"
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
    </>
  );
}
