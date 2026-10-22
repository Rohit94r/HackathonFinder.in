import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { THEMES } from '@hackathonfinder/shared';
import Explorer from '@/components/hackathon/Explorer';
import { PageHero, SampleNotice } from '@/components/ui';
import { DEFAULT_FILTERS, parseFilters } from '@/lib/filters';
import { getHackathons } from '@/server/hackathons';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const theme = THEMES.find((t) => t.slug === params.slug);
  if (!theme) return { title: 'Theme not found' };
  return {
    title: `${theme.name} hackathons`,
    description: `${theme.name} hackathons for students: ${theme.description} Filter by city, online, deadline and prize.`,
  };
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

  return (
    <>
      <PageHero title={theme.name} accent="hackathons" description={theme.description} />
      <section className="bg-surface py-10">
        <div className="container-page">
          {items.some((h) => h.sample) && <SampleNotice className="mb-6" />}
          <Explorer items={items} initial={parseFilters(searchParams, base)} base={base} />
        </div>
      </section>
    </>
  );
}
