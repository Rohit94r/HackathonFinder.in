import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LocalWinStory from '@/components/wins/LocalWinStory';
import WinArticle from '@/components/wins/WinArticle';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';
import { getWin, moreWins } from '@/server/wins';

// The linked listing shows a live status, so render per request like the listing pages.
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getWin(params.slug, null);
  if (!data) return { title: 'Winning story' };
  return { title: `${data.win.projectName}: ${data.win.result} at ${data.win.hackathon}`, description: data.win.tagline };
}

export default async function WinStoryPage({ params }: { params: { slug: string } }) {
  const viewerUser = await getSessionUser();
  const viewer = viewerUser ? { id: viewerUser.id, handle: viewerUser.handle, role: viewerUser.role } : null;
  const data = await getWin(params.slug, viewer);
  const { items } = await getHackathons();

  if (!data) {
    // Stories posted in this browser have "my-" ids and are looked up on the client.
    if (!params.slug.startsWith('my-')) notFound();
    return <LocalWinStory id={params.slug} listings={items} />;
  }

  const listing = data.win.hackathonSlug ? items.find((h) => h.slug === data.win.hackathonSlug) : undefined;
  const more = await moreWins(data.win, viewer);
  return <WinArticle story={data.win} listing={listing} more={more} now={data.now} canManage={data.win.mine || viewer?.role === 'admin'} />;
}
