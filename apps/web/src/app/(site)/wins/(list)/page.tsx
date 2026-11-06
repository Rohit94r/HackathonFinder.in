import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { PageHero } from '@/components/ui';
import WinsBoard, { type WinFilters } from '@/components/wins/WinsBoard';
import { CITIES, THEMES, type ThemeSlug } from '@hackathonfinder/shared';
import { WIN_RESULTS, type WinResult } from '@/data/wins';
import { getSessionUser } from '@/server/auth';
import { getHackathons } from '@/server/hackathons';
import { listWins } from '@/server/wins';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathon Winning Stories & Winning Projects',
  description: 'Students share how they won hackathons: the problem, what they built, what the judges liked and tips for your next one.',
  path: '/wins',
  keywords: ['hackathon winning projects', 'hackathon winners', 'how to win a hackathon', 'hackathon project ideas'],
});

export default async function WinsPage(
  props: { searchParams: Promise<Record<string, string | string[] | undefined>> }
) {
  const searchParams = await props.searchParams;
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
  // The listings and the first page of stories don't depend on each other.
  const [snapshot, initialData] = await Promise.all([
    getHackathons(),
    listWins(
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
    ),
  ]);
  const events = snapshot.items
    .map((h) => ({ slug: h.slug, title: h.title, city: h.mode === 'online' ? undefined : h.city }))
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Winning stories', path: '/wins' }])} />
      <PageHero title="Winning"
        accent="stories"
        description="Students share how they won: the problem, what they built, what the judges liked and what they’d tell you before your next hackathon."
      />
      <section className="bg-surface py-10 sm:py-14">
        <div className="container-page">
          <WinsBoard events={events} initial={initial} initialData={initialData} openForm={one(searchParams.share) === '1'} />
        </div>
      </section>
      <section className="section border-t border-ink/10">
        <div className="container-page max-w-3xl">
          <h2 className="text-2xl font-bold">What a winning story includes</h2>
          <p className="mt-3 text-ink/70">
            Every story is written by the student who was there, so the details are the kind you only get from the
            inside: the problem they picked, the part they had to cut, what the demo actually showed and what the
            judges asked afterwards. Stories cover first wins, finalists and special-mention projects, because a
            shortlist run often teaches more than a trophy.
          </p>
          <p className="mt-3 text-ink/70">
            Read them before you pick your next event, then put the lessons to work with our guide to{' '}
            <Link className="font-semibold text-ink" href="/blog/how-to-win-your-first-hackathon">winning your first hackathon</Link>{' '}
            and the{' '}
            <Link className="font-semibold text-ink" href="/blog/pitch-your-project-in-three-minutes">three-minute pitch structure</Link>.
            Won something recently? Share your story from this page and add the project to your profile.
          </p>
        </div>
      </section>
    </>
  );
}
