import { OG_SIZE, ogCard } from '@/lib/ogImage';

export const alt = 'HackathonFinder: find hackathons in India and near you';
export const size = OG_SIZE;
export const contentType = 'image/png';
// Edge: the Node build of the image renderer can't load its fonts on Windows.
export const runtime = 'edge';

export default function Image() {
  return ogCard({
    eyebrow: 'Hackathons in India',
    title: 'Find every hackathon near you, in one place',
    subtitle: 'Unstop, Devfolio, Devpost, MLH, college pages and social posts, searchable by city, theme, deadline and prize.',
  });
}
