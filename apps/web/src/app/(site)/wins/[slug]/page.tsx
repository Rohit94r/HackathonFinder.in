import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import LocalWinStory from '@/components/wins/LocalWinStory';
import WinArticle from '@/components/wins/WinArticle';
import { articleJsonLd, breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';
import { getWin, moreWins } from '@/server/wins';

// The linked listing shows a live status, so render per request like the listing pages.
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const data = await getWin(params.slug, null);
  if (!data) return { title: 'Winning story', robots: { index: false, follow: true } };
  const w = data.win;
  const lead = w.tagline?.trim() || `${w.projectName} won ${w.result} at ${w.hackathon}. The team explains the problem, what they built and what the judges liked.`;
  return pageMetadata({
    title: `${w.projectName}: ${w.result} at ${w.hackathon}`,
    description: lead,
    path: `/wins/${w.slug ?? params.slug}`,
    keywords: [w.hackathon, `${w.hackathon} winning project`, 'hackathon winning project', w.projectName],
    type: 'article',
  });
}

export default async function WinStoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const viewerUser = await getSessionUser();
  const viewer = viewerUser ? { id: viewerUser.id, handle: viewerUser.handle, role: viewerUser.role } : null;
  const [data, { items }] = await Promise.all([getWin(params.slug, viewer), getHackathons()]);

  if (!data) {
    // Stories posted in this browser have "my-" ids and are looked up on the client.
    if (!params.slug.startsWith('my-')) notFound();
    return <LocalWinStory id={params.slug} listings={items} />;
  }

  const listing = data.win.hackathonSlug ? items.find((h) => h.slug === data.win.hackathonSlug) : undefined;
  const more = await moreWins(data.win, viewer);
  const story = data.win;
  return (
    <>
      <JsonLd
        data={[
          articleJsonLd({
            slug: story.slug,
            title: `${story.projectName}: ${story.result} at ${story.hackathon}`,
            excerpt: story.tagline,
            published: story.createdAt,
            modified: story.updatedAt,
            keywords: [story.hackathon, story.projectName, 'hackathon winning project'],
            category: 'Winning stories',
            path: `/wins/${story.slug}`,
            type: 'Article',
          }),
          breadcrumbJsonLd([
            { name: 'Winning stories', path: '/wins' },
            { name: story.projectName, path: `/wins/${story.slug}` },
          ]),
        ]}
      />
      <WinArticle story={story} listing={listing} more={more} now={data.now} canManage={story.mine || viewer?.role === 'admin'} />
    </>
  );
}
