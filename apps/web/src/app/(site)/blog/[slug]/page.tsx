import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import EventArt from '@/components/hackathon/EventArt';
import { blogPosts } from '@/data/blogData';

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return { title: 'Post not found' };
  return { title: post.title, description: post.excerpt };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) notFound();
  const more = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <article>
      <header className="bg-surface">
        <div className="container-page max-w-4xl pb-10 pt-8">
          <Link href="/blog" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink">
            <ArrowLeft className="h-4 w-4" />
            All guides
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink">{post.category}</p>
          <h1 className="mt-3 font-sans text-4xl font-semibold normal-case leading-tight tracking-normal sm:text-5xl">{post.title}</h1>
          <p className="mt-4 text-lg text-ink/70">{post.excerpt}</p>
          <p className="mt-5 text-sm text-ink/60">
            {post.author} · {post.date} · {post.readMinutes} min read
          </p>
          <EventArt theme={post.theme} title={post.title} size="hero" className="mt-8 h-56 rounded-3xl" />
        </div>
      </header>

      <div className="container-page max-w-3xl py-12">
        <div className="prose-hf" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

        <div className="on-dark mt-14 overflow-hidden rounded-3xl bg-ink p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold text-white">Ready for your next hackathon?</h2>
          <p className="mx-auto mt-2 max-w-md text-surface/80">
            Search open hackathons by city, theme, deadline and team size.
          </p>
          <Link href="/hackathons" className="btn-lime mt-6">
            Find hackathons
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {more.length > 0 && (
        <section className="bg-surface py-14">
          <div className="container-page max-w-5xl">
            <h2 className="mb-6 text-2xl font-bold">Keep reading</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {more.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
                  <EventArt theme={p.theme} title={p.title} label={p.category} className="h-32" />
                  <div className="p-5">
                    <h3 className="text-lg font-bold leading-snug group-hover:underline">{p.title}</h3>
                    <p className="mt-1 text-xs text-ink/60">{p.readMinutes} min read</p>
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
