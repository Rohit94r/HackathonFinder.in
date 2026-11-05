import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import Link from 'next/link';
import { ArrowRight, Award, BookOpen, Facebook, Linkedin, Megaphone, MessageCircle, Send, ShieldCheck, Trophy, Users } from 'lucide-react';
import { CITIES } from '@hackathonfinder/shared';
import NewsletterForm from '@/components/NewsletterForm';
import DiscussionBoard, { type BoardFilters } from '@/components/community/DiscussionBoard';
import { SORTS } from '@/components/community/model';
import { PHOTOS } from '@/components/landing/photos';
import { SectionHeading } from '@/components/ui';
import { isCategoryId } from '@/data/discussions';
import { activeSocials, siteConfig } from '@/data/siteConfig';
import { openOnly } from '@/lib/hackathons';
import { getSessionUser } from '@/server/auth';
import { listThreads } from '@/server/community';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: 'Hackathon Community for Students',
  description: 'Discussions for students everywhere: ask about hackathons, find teammates, get feedback on your project and share free resources. Anyone can read; sign in to post.',
  path: '/community',
  keywords: ['hackathon community', 'hackathon discussion', 'student developer community'],
});

const CHANNELS = activeSocials([
  { name: 'WhatsApp community', text: 'New hackathons in your city, plus deadline nudges.', href: siteConfig.social.whatsapp, icon: MessageCircle },
  { name: 'Instagram', text: 'Weekly roundups, winner stories and quick tips.', href: siteConfig.social.instagram, icon: Megaphone },
  { name: 'LinkedIn', text: 'Big hackathons, company challenges and winners.', href: siteConfig.social.linkedin, icon: Linkedin },
  { name: 'Facebook group', text: 'Share events from your college and ask questions.', href: siteConfig.social.facebook, icon: Facebook },
  { name: 'Telegram channel', text: 'New hackathons the moment we find them.', href: siteConfig.social.telegram, icon: Send },
  { name: 'Discord', text: 'Find teammates, ask questions and share what you build.', href: siteConfig.social.discord, icon: Users },
]);

const WAYS = [
  {
    icon: Users,
    title: 'Team Finder',
    text: 'Post the skills you have and need, and team up for your next hackathon.',
    href: '/teams',
    cta: 'Find teammates',
  },
  {
    icon: BookOpen,
    title: 'Guides & blog',
    text: 'Practical guides on picking events, building fast and pitching well.',
    href: '/blog',
    cta: 'Read the blog',
  },
  {
    icon: Megaphone,
    title: 'Share a hackathon',
    text: 'Spotted one on Instagram, WhatsApp, Facebook or a notice board? Paste the link and add it for everyone.',
    href: '/submit',
    cta: 'Submit an event',
  },
];

const GUIDELINES = [
  'Talk about anything: hackathons, projects, internships, college tech life.',
  'Be kind and respectful. Abusive words and slurs are blocked automatically.',
  'No spam or paid promotion. Organizers can list events for free.',
  'Don’t post phone numbers or personal details. Connect through Team Finder.',
];

const AMBASSADOR_PHOTO = PHOTOS.classroomDesks;

const AMBASSADOR_PERKS = [
  'Get new hackathons for your college before anyone else',
  'Certificate and LinkedIn recommendation',
  'Goodies, and a say in what we build next',
  'Run hackathon prep sessions with our help',
];

type SearchParams = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export default async function CommunityPage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const [{ items }, user] = await Promise.all([getHackathons(), getSessionUser()]);
  const events = openOnly(items).map((h) => ({ slug: h.slug, title: h.title }));
  const titles = Object.fromEntries(items.map((h) => [h.slug, h.title]));

  // Links like /community?city=pune or ?hackathon=codestorm-2026 open a filtered board.
  const category = one(searchParams.category);
  const city = one(searchParams.city);
  const hackathon = one(searchParams.hackathon);
  const sort = one(searchParams.sort);
  const initial: BoardFilters = {
    category: isCategoryId(category) ? category : '',
    city: CITIES.some((c) => c.slug === city) ? city : '',
    hackathon: /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(hackathon) ? hackathon : '',
    sort: SORTS.find((s) => s.value === sort)?.value ?? 'hot',
    q: one(searchParams.q).trim().slice(0, 100),
  };
  // The first page comes with the HTML; the board loads the rest from /api/threads.
  const initialData = await listThreads(
    {
      category: initial.category || undefined,
      city: initial.city || undefined,
      hackathon: initial.hackathon || undefined,
      q: initial.q || undefined,
      sort: initial.sort,
      page: 1,
      limit: 20,
    },
    user
  );

  // No page hero: the discussions start right under the navbar. Reading is open to
  // everyone; posting, replying and voting need an account.
  return (
    <>
      <section id="discussions" className="scroll-mt-16 bg-surface py-6 sm:py-8">
        <div className="container-page grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_300px]">
          <DiscussionBoard
            events={events}
            titles={titles}
            initial={initial}
            initialData={initialData}
            compose={one(searchParams.new) === '1'}
            signedIn={Boolean(user)}
          />

          <aside className="grid grid-cols-1 content-start gap-6 sm:grid-cols-2 xl:grid-cols-1" aria-label="Guidelines, channels and city groups">
            <div className="card p-5">
              <h2 className="flex items-center gap-2 font-sans text-base font-bold normal-case tracking-normal">
                <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" />
                Community guidelines
              </h2>
              <ul className="mt-3 space-y-2.5">
                {GUIDELINES.map((g) => (
                  <li key={g} className="flex items-start gap-2 text-sm leading-6 text-ink/75">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                    {g}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink/60">
                See something wrong?{' '}
                <a href={`mailto:${siteConfig.email}?subject=Community%20report`} className="font-semibold text-brand-700 hover:underline dark:text-brand-300">
                  Tell us
                </a>
                .
              </p>
            </div>

            <div className="card p-5">
              <h2 className="font-sans text-base font-bold normal-case tracking-normal">Join a channel</h2>
              <p className="mt-1 text-sm text-ink/70">Never miss a new hackathon.</p>
              <ul className="mt-4 space-y-1">
                {CHANNELS.map((c) => (
                  <li key={c.name}>
                    <a href={c.href} className="group -mx-2 flex items-start gap-3 rounded-lg px-2 py-2 transition hover:bg-ink/5">
                      <span className="mt-0.5 inline-flex shrink-0 rounded-lg bg-accent/10 p-1.5 text-brand-700 dark:text-brand-300">
                        <c.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                          {c.name}
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </span>
                        <span className="block text-xs leading-5 text-ink/60">{c.text}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-ink/60">Channel links go live at launch.</p>
            </div>

            <div className="card p-5">
              <h2 className="font-sans text-base font-bold normal-case tracking-normal">Your city’s hacker group</h2>
              <p className="mt-1 text-sm text-ink/70">
                One WhatsApp group per city: new hackathons near you, teammates close by and meetups before big events.
              </p>
              <ul className="mt-4 divide-y divide-ink/10">
                {CITIES.map((c) => {
                  const href = siteConfig.cityGroups[c.slug];
                  return (
                    <li key={c.slug} className="flex items-center justify-between gap-3 py-2">
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{c.name}</span>
                        <span className="block text-xs text-ink/60">{c.state}</span>
                      </span>
                      {href ? (
                        <a href={href} className="btn-primary shrink-0 px-3 py-1.5 text-xs">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Join
                        </a>
                      ) : (
                        <span className="shrink-0 rounded-md bg-ink/5 px-2.5 py-1 text-xs font-semibold text-ink/60">Starting soon</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="Get involved" title="Ways to take part" />
          <div data-reveal-stagger className="grid gap-5 md:grid-cols-3">
            {WAYS.map((w) => (
              <Link key={w.title} href={w.href} className="card group p-7 transition hover:-translate-y-1 hover:shadow-lift">
                <span className="mb-4 inline-flex rounded-lg bg-accent p-2.5 text-white">
                  <w.icon className="h-5 w-5" />
                </span>
                <h3 className="text-xl font-bold">{w.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink/70">{w.text}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                  {w.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-surface">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div data-reveal="up">
            <span className="eyebrow mb-4">
              <Award className="h-3.5 w-3.5" />
              Campus Ambassadors
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">Bring HackathonFinder to your college</h2>
            <p className="mt-4 text-lg leading-8 text-ink/70">
              Help your classmates find the right hackathons, share events from your college clubs
              and grow a hacker community on your campus.
            </p>
            <ul className="mt-6 space-y-3">
              {AMBASSADOR_PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-ink/80">
                  <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-ink" />
                  {perk}
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${siteConfig.email}?subject=Campus%20Ambassador%20application`}
              className="btn-primary mt-8"
            >
              Apply to be an ambassador
            </a>
          </div>
          <figure className="card overflow-hidden" data-reveal="up">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={AMBASSADOR_PHOTO.src}
              alt="Engineering students listening in a college classroom"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <figcaption className="p-5">
              <p className="text-lg font-semibold text-ink">One college is all it takes to start.</p>
              <p className="mt-1 text-sm text-ink/70">
                Ambassadors share new events in their college groups, run a prep session each semester and tell us what students need.
              </p>
              <p className="mt-3 text-[11px] text-ink/60">
                Photo:{' '}
                <a href={AMBASSADOR_PHOTO.page} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {AMBASSADOR_PHOTO.by} on Unsplash
                </a>
              </p>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="card flex flex-col gap-6 p-8 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-bold">The weekly digest</h2>
              <p className="mt-2 text-ink/70">Every Monday: the best open hackathons for students, in one short email.</p>
            </div>
            <NewsletterForm dark={false} />
          </div>
        </div>
      </section>
    </>
  );
}
