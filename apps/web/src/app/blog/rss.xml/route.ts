import { blogPosts, postIsoDate } from '@/data/blogData';
import { rssFeed } from '@/lib/rss';

export const revalidate = 3600;

export function GET() {
  const feed = rssFeed({
    title: 'HackathonFinder guides',
    description: 'Practical guides on finding hackathons, building fast, working as a team and pitching to judges.',
    path: '/blog',
    items: blogPosts.map((p) => ({
      title: p.title,
      path: `/blog/${p.slug}`,
      description: p.excerpt,
      published: postIsoDate(p.date),
    })),
  });
  return new Response(feed, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
