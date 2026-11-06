import { newsIsoDate, newsPosts } from '@/data/newsData';
import { rssFeed } from '@/lib/rss';

export const revalidate = 3600;

export function GET() {
  const feed = rssFeed({
    title: 'HackathonFinder news & trends',
    description: 'Briefings on AI models, in-demand skills and market trends for student builders.',
    path: '/news',
    items: newsPosts.map((p) => ({
      title: p.title,
      path: `/news/${p.slug}`,
      description: p.dek,
      published: newsIsoDate(p.date),
    })),
  });
  return new Response(feed, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
}
