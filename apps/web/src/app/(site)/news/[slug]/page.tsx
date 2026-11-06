import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock, Flame } from 'lucide-react';
import EventArt from '@/components/hackathon/EventArt';
import { newsCategory, newsIsoDate, newsPost, newsPosts } from '@/data/newsData';
import { breadcrumbJsonLd, faqJsonLd, JsonLd, newsArticleJsonLd, pageMetadata } from '@/lib/seo';

export function generateStaticParams() {
  return newsPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = newsPost(params.slug);
  if (!post) return { title: 'Briefing not found' };
  return pageMetadata({
    title: post.title,
    description: post.dek,
    path: `/news/${post.slug}`,
    keywords: post.keywords,
    type: 'article',
    publishedTime: newsIsoDate(post.date),
    modifiedTime: newsIsoDate(post.updated ?? post.date),
  });
}

export default async function NewsArticlePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const post = newsPost(params.slug);
  if (!post) notFound();

  const category = newsCategory(post.category);
  const related = newsPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 3);
  const fallback = newsPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const more = related.length > 0 ? related : fallback;
  const published = newsIsoDate(post.date);

  const jsonLd: object[] = [
    newsArticleJsonLd({
      slug: post.slug,
      title: post.title,
      dek: post.dek,
      category: category?.name ?? post.category,
      published,
      modified: newsIsoDate(post.updated ?? post.date),
      keywords: post.keywords,
    }),
    breadcrumbJsonLd([
      { name: 'News', path: '/news' },
      { name: post.title, path: `/news/${post.slug}` },
    ]),
  ];
  if (post.faqs?.length) jsonLd.push(faqJsonLd(post.faqs));

  return (
    <article>
      <JsonLd data={jsonLd} />
      <header className="bg-surface">
        <div className="container-page max-w-4xl pb-10 pt-8">
          <Link href="/news" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            <ArrowLeft className="h-4 w-4" />
            All news & trends
          </Link>
          <p className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink">
            {category && (
              <Link href={`/news?category=${category.slug}`} className="underline decoration-board decoration-2 underline-offset-4">
                {category.name}
              </Link>
            )}
            {post.trending && (
              <span className="inline-flex items-center gap-1 rounded bg-ink px-2 py-1 text-surface">
                <Flame className="h-3 w-3" />
                Trending
              </span>
            )}
          </p>
          <h1 className="mt-3 font-sans text-3xl font-semibold leading-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-4 text-lg text-ink/70">{post.dek}</p>
          <p className="mt-5 text-sm text-ink/60">
            {post.author} · <time dateTime={published}>{post.date}</time>
            {post.updated && post.updated !== post.date ? ` · updated ${post.updated}` : ''} ·{' '}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.readMinutes} min read
            </span>
          </p>
          <EventArt title={post.title} label={category?.name} size="hero" className="mt-8 h-56 rounded-lg" />
        </div>
      </header>

      <div className="container-page max-w-3xl py-12">
        <div className="prose-hf" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

        <div className="on-dark mt-14 overflow-hidden rounded-lg bg-ink p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-white">Turn the briefing into practice</h2>
          <p className="mx-auto mt-2 max-w-md text-surface/80">
            Find an open hackathon where you can use it, or read the guides that go with it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/hackathons" className="btn-lime">
              Find hackathons
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/blog" className="btn-secondary">
              Guides
            </Link>
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="bg-surface py-14">
          <div className="container-page max-w-5xl">
            <h2 className="mb-6 text-2xl font-bold">Keep reading</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <Link key={p.slug} href={`/news/${p.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <EventArt title={p.title} label={newsCategory(p.category)?.name} className="h-32" />
                  <div className="p-5">
                    <h3 className="text-lg font-bold leading-snug group-hover:underline">{p.title}</h3>
                    <p className="mt-1 text-xs text-ink/60">
                      {p.date} · {p.readMinutes} min read
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
