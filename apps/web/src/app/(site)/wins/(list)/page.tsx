import type { Metadata } from 'next';
import Link from 'next/link';
import { breadcrumbJsonLd, faqJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
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
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: 'Winning stories', path: '/wins' }]),
          faqJsonLd([
            {
              q: 'What makes a hackathon project win?',
              a: 'Judges usually reward a narrow problem, a demo that works within the first minute, and a team that can explain what they cut and why. A small, finished project with honest trade-offs scores better than an ambitious prototype that only half runs.',
            },
            {
              q: 'Do you have to be a coder to win a hackathon?',
              a: 'No. Teams need a clear problem, a usable interface and a pitch that lands, so design, research and communication matter as much as code. Many winning teams include one person who owns the demo and the story.',
            },
            {
              q: 'Can I share a story if my team was a finalist and not the winner?',
              a: 'Yes. Finalist and special-mention stories often teach more than first-place ones, because they show what the judges compared and what was missing. You can share any result from the story form on this page.',
            },
          ]),
        ]}
      />
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

      <section className="section border-t border-ink/10 bg-surface">
        <div className="container-page max-w-4xl">
          <h2 className="text-2xl font-bold sm:text-3xl">What winning projects have in common</h2>
          <p className="mt-3 max-w-3xl text-ink/70">
            The stories differ, but the pattern is consistent. These three things show up in almost every write-up
            from a team that made the final.
          </p>
          <div className="mt-7 grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="font-semibold text-ink">A demo that works in 30 seconds</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink/70">
                The first screen shows the problem and the result, not a login form or a slide. Teams record a backup
                run so a live failure cannot end the pitch.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">A problem small enough to finish</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink/70">
                One user, one workflow, one working path. The scope is narrow on purpose, and the team can say what
                they deliberately left out.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Trade-offs stated, not hidden</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink/70">
                Answers to “what breaks?” and “what would you do next?” land better than claims of accuracy. Judges
                are comparing judgement as much as code.
              </p>
            </div>
          </div>
          <p className="mt-7 max-w-3xl text-ink/70">
            If you are preparing for an event now, start with the{' '}
            <Link className="font-semibold text-ink" href="/blog/hackathon-project-ideas">project ideas guide</Link>{' '}
            and the{' '}
            <Link className="font-semibold text-ink" href="/blog/checklist-before-you-register">registration checklist</Link>,
            then look at the events on the{' '}
            <Link className="font-semibold text-ink" href="/hackathons">hackathon board</Link>.
          </p>

          <h2 className="mt-12 text-2xl font-bold sm:text-3xl">Frequently asked questions</h2>
          <dl className="mt-4 max-w-3xl space-y-5">
            <div>
              <dt className="font-semibold text-ink">What makes a hackathon project win?</dt>
              <dd className="mt-1 text-[15px] leading-7 text-ink/75">
                Judges usually reward a narrow problem, a demo that works within the first minute, and a team that can
                explain what they cut and why. A small, finished project with honest trade-offs scores better than an
                ambitious prototype that only half runs.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Do you have to be a coder to win a hackathon?</dt>
              <dd className="mt-1 text-[15px] leading-7 text-ink/75">
                No. Teams need a clear problem, a usable interface and a pitch that lands, so design, research and
                communication matter as much as code. Many winning teams include one person who owns the demo and the
                story.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Can I share a story if my team was a finalist and not the winner?</dt>
              <dd className="mt-1 text-[15px] leading-7 text-ink/75">
                Yes. Finalist and special-mention stories often teach more than first-place ones, because they show
                what the judges compared and what was missing. You can share any result from the story form on this
                page.
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
