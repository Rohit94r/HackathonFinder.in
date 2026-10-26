import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { PageHero, SampleNotice } from '@/components/ui';
import WinsBoard, { type WinFilters } from '@/components/wins/WinsBoard';
import { CITIES, THEMES, type ThemeSlug } from '@hackathonfinder/shared';
import { WIN_RESULTS, type WinResult } from '@/data/wins';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';
import { listWins } from '@/server/wins';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathon Winning Stories & Winning Projects',
  description: 'Students share how they won hackathons in India: the problem, what they built, what the judges liked and tips for your next one.',
  path: '/wins',
  keywords: ['hackathon winning projects', 'hackathon winners', 'how to win a hackathon', 'hackathon project ideas'],
});

export default async function WinsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? '';
  const result = one(searchParams.result);
  const city = one(searchParams.city);
  const sort = one(searchParams.sort);
  const initial: WinFilters = {
    result: WIN_RESULTS.includes(result as WinResult) ? (result as WinResult) : '',
    theme: THEMES.some((theme) => theme.slug === one(searchParams.theme)) ? (one(searchParams.theme) as ThemeSlug) : '',
    city: city === 'online' || CITIES.some((c) => c.slug === city) ? city : '',
    q: one(searchParams.q).trim().slice(0, 100),
    sort: sort === 'cheers' ? 'cheers' : 'newest',
  };
  const viewerUser = await getSessionUser();
  const viewer = viewerUser ? { id: viewerUser.id, handle: viewerUser.handle, role: viewerUser.role } : null;
  const events = (await getHackathons())
    .items.map((h) => ({ slug: h.slug, title: h.title, city: h.mode === 'online' ? undefined : h.city }))
    .sort((a, b) => a.title.localeCompare(b.title));
  const initialData = await listWins(
    {
      result: initial.result || undefined,
      theme: initial.theme ? (initial.theme as ThemeSlug) : undefined,
      city: initial.city || undefined,
      q: initial.q || undefined,
      sort: initial.sort,
      page: 1,
      limit: 12,
    },
    viewer
  );

  return (
    <>
      <PageHero
        title="Winning"
        accent="stories"
        description="Students share how they won: the problem, what they built, what the judges liked and what they’d tell you before your next hackathon."
      />
      <section className="bg-surface py-10 sm:py-14">
        <div className="container-page">
          <SampleNotice className="mb-8">
            Preview: these stories are samples. Stories you post are saved in this browser until student accounts launch.
          </SampleNotice>
          <WinsBoard events={events} initial={initial} initialData={initialData} openForm={one(searchParams.share) === '1'} />
        </div>
      </section>
    </>
  );
}
