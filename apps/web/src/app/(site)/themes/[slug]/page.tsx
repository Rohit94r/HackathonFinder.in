import type { Metadata } from 'next';
import { breadcrumbJsonLd, itemListJsonLd, JsonLd, pageMetadata } from '@/lib/seo';
import { notFound } from 'next/navigation';
import { THEMES } from '@hackathonfinder/shared';
import Explorer from '@/components/hackathon/Explorer';
import { PageHero } from '@/components/ui';
import { DEFAULT_FILTERS, parseFilters } from '@/lib/filters';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
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

export default async function ThemePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const theme = THEMES.find((t) => t.slug === params.slug);
  if (!theme) notFound();
  const { items } = await getHackathons();
  const base = { ...DEFAULT_FILTERS, themes: [theme.slug] };

  const inTheme = items.filter((h) => h.themes.includes(theme.slug) && h.status !== 'completed');

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: 'Hackathons', path: '/hackathons' },
            { name: `${theme.name} hackathons`, path: `/themes/${theme.slug}` },
          ]),
          itemListJsonLd(`${theme.name} hackathons`, inTheme),
        ]}
      />
      <PageHero title={theme.name} accent="hackathons" description={theme.description} />
      <section className="bg-surface py-10">
        <div className="container-page">
          <Explorer items={items} initial={parseFilters(searchParams, base)} base={base} />
        </div>
      </section>
    </>
  );
}
