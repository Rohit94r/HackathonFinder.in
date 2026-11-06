import { newsCategory, newsPost } from '@/data/newsData';
import { OG_SIZE, ogCard } from '@/lib/ogImage';

export const alt = 'HackathonFinder news briefing';
export const size = OG_SIZE;
export const contentType = 'image/png';
// Edge: the Node build of the image renderer can't load its fonts on Windows. Next 15 doesn't
// allow edge together with generateStaticParams, so each image is made on first request and cached.
export const runtime = 'edge';

export default function Image({ params }: { params: { slug: string } }) {
  const post = newsPost(params.slug);
  const category = post ? newsCategory(post.category)?.name : undefined;
  return ogCard({
    eyebrow: post ? `${category ?? 'News'} · ${post.readMinutes} min read` : 'News & trends',
    title: post?.title ?? 'HackathonFinder news',
  });
}
