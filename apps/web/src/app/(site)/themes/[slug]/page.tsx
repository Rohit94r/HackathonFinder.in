import type { Metadata } from 'next';
import { breadcrumbJsonLd, faqJsonLd, itemListJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { THEMES } from '@hackathonfinder/shared';
import Explorer from '@/components/hackathon/Explorer';
import SeoContent from '@/components/seo/SeoContent';
import { PageHero } from '@/components/ui';
import { DEFAULT_FILTERS, parseFilters } from '@/lib/filters';
import { themeCopy } from '@/lib/listingCopy';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

/** Three useful next reads per theme; the fallback covers the rest. */
const GUIDES: Record<string, { href: string; label: string }[]> = {
  'ai-ml': [
    { href: '/news/choosing-an-ai-model', label: 'Choosing a model for the build' },
    { href: '/news/agentic-ai-explained', label: 'Agentic AI, explained' },
    { href: '/blog/hackathon-project-ideas', label: 'AI project ideas' },
  ],
  'web-dev': [
    { href: '/blog/hackathon-project-ideas', label: 'Project ideas that demo well' },
    { href: '/blog/pitch-your-project-in-three-minutes', label: 'Pitch in three minutes' },
    { href: '/blog/how-to-win-your-first-hackathon', label: 'Winning your first hackathon' },
  ],
  web3: [
    { href: '/blog/hackathon-project-ideas', label: 'Project ideas that demo well' },
    { href: '/blog/checklist-before-you-register', label: 'Checklist before you register' },
    { href: '/blog/pitch-your-project-in-three-minutes', label: 'Pitch in three minutes' },
  ],
  cybersecurity: [
    { href: '/blog/how-to-win-your-first-hackathon', label: 'Winning your first hackathon' },
    { href: '/blog/find-the-right-teammates', label: 'Find the right teammates' },
    { href: '/blog/pitch-your-project-in-three-minutes', label: 'Pitch in three minutes' },
  ],
};

const FALLBACK_GUIDES = [
  { href: '/blog/hackathon-project-ideas', label: 'Project ideas that demo well' },
  { href: '/blog/how-to-win-your-first-hackathon', label: 'Winning your first hackathon' },
  { href: '/blog/find-the-right-teammates', label: 'Find the right teammates' },
];

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const theme = THEMES.find((t) => t.slug === params.slug);
  if (!theme) return { title: 'Theme not found' };
  const year = new Date().getFullYear();
  return pageMetadata({
    title: `${theme.name} Hackathons ${year}`,
    description: `${theme.name} hackathons for students: ${theme.description} Filter by city, online, deadline and prize.`,
    path: `/themes/${theme.slug}`,
    keywords: [`${theme.name} hackathons`, `${theme.name} hackathons near me`, `${theme.name} hackathons ${year}`, `online ${theme.name} hackathons`, `${theme.name} competitions for students`],
  });
}

export default async function ThemePage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const theme = THEMES.find((t) => t.slug === params.slug);
  if (!theme) notFound();
  const { items } = await getHackathons();
  const base = { ...DEFAULT_FILTERS, themes: [theme.slug] };

  const inTheme = items.filter((h) => h.themes.includes(theme.slug) && h.status !== 'completed');
  const copy = themeCopy(theme, items);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Hackathons', path: '/hackathons' },
            { name: `${theme.name} hackathons`, path: `/themes/${theme.slug}` },
          ]),
          itemListJsonLd(`${theme.name} hackathons`, inTheme),
          faqJsonLd(copy.faqs),
        ]}
      />
      <PageHero title={theme.name} accent="hackathons" description={theme.description} />
      <section className="bg-surface py-10">
        <div className="container-page">
          <Explorer items={items} initial={parseFilters(searchParams, base)} base={base} />
          <SeoContent copy={copy} links={GUIDES[theme.slug] ?? FALLBACK_GUIDES} />
        </div>
      </section>
    </>
  );
}
