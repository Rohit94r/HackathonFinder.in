import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { blogPostsData } from '@/data/blogData';
import { siteConfig } from '@/data/siteConfig';

export function generateStaticParams() {
  return blogPostsData.map((b) => ({ slug: b.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = blogPostsData.find((b) => b.slug === params.slug);
  if (!post) return { title: `Post Not Found - ${siteConfig.name} Blog` };
  return {
    title: `${post.title} - ${siteConfig.name} Blog`,
    description: post.description,
  };
}

export default function BlogPostDetailPage({ params }: { params: { slug: string } }) {
  const post = blogPostsData.find((b) => b.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      {/* Hero Header */}
      <section style={{ maxWidth: '980px', margin: '0 auto', padding: '60px 24px 32px' }}>
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#39523c',
            fontWeight: 600,
            fontSize: '15px',
            marginBottom: '24px',
            textDecoration: 'none',
          }}
        >
          <span>←</span>
          <span>Back to all posts</span>
        </Link>

        <h1
          style={{
            fontFamily: 'Graphik, sans-serif',
            fontSize: 'clamp(32px, 5vw, 54px)',
            fontWeight: 600,
            color: '#122315',
            lineHeight: 1.2,
            marginBottom: '20px',
          }}
        >
          {post.title}
        </h1>

        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            fontSize: '15px',
            color: '#666',
            marginBottom: '32px',
          }}
        >
          {post.author && <span>By {post.author}</span>}
          {post.date && (
            <>
              <span>•</span>
              <span>{post.date}</span>
            </>
          )}
        </div>

        {post.heroImage && (
          <div
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
              marginBottom: '48px',
            }}
          >
            <img
              src={post.heroImage}
              alt={post.title}
              style={{ width: '100%', maxHeight: '560px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
      </section>

      {/* Article Content */}
      <article
        style={{
          maxWidth: '820px',
          margin: '0 auto',
          padding: '0 24px 100px',
          fontSize: '18px',
          lineHeight: 1.8,
          color: '#222',
        }}
      >
        <div
          className="rich-text-block w-richtext"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />

        {/* Bottom CTA Card */}
        <div
          style={{
            marginTop: '60px',
            padding: '40px',
            background: '#122315',
            borderRadius: '24px',
            color: '#fff',
            textAlign: 'center',
          }}
        >
          <h3
            style={{
              fontFamily: 'Graphik, sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              marginBottom: '12px',
            }}
          >
            Put your content on autopilot
          </h3>
          <p
            style={{
              fontSize: '16px',
              color: '#c4d7c7',
              maxWidth: '540px',
              margin: '0 auto 24px',
            }}
          >
            Seven agents that research, write, check and publish executive-grade content to your
            website and LinkedIn.
          </p>
          <Link
            href={siteConfig.demoHref}
            className="button-primary w-button"
            style={{ display: 'inline-block' }}
          >
            Book a demo
          </Link>
        </div>
      </article>

      <Footer />
    </div>
  );
}
