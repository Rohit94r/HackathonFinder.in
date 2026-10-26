import { blogPosts } from '@/data/blogData';
import { OG_SIZE, ogCard } from '@/lib/ogImage';

export const alt = 'HackathonFinder guide';
export const size = OG_SIZE;
export const contentType = 'image/png';
// Edge: the Node build of the image renderer can't load its fonts on Windows.
export const runtime = 'edge';

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export default function Image({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  return ogCard({ eyebrow: post ? `${post.category} · ${post.readMinutes} min read` : 'Guide', title: post?.title ?? 'HackathonFinder guides' });
}
