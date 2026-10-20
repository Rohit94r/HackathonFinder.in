import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { customersData } from '@/data/customerData';
import { siteConfig } from '@/data/siteConfig';

export function generateStaticParams() {
  return customersData.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const customer = customersData.find((c) => c.slug === params.slug);
  if (!customer) return { title: `Case Study Not Found - ${siteConfig.name}` };
  return {
    title: `${customer.title} - ${siteConfig.name} Customers`,
    description: customer.description,
  };
}

export default function CustomerDetailPage({ params }: { params: { slug: string } }) {
  const customer = customersData.find((c) => c.slug === params.slug);

  if (!customer) {
    notFound();
  }

  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      {/* Hero Header */}
      <section style={{ maxWidth: '980px', margin: '0 auto', padding: '60px 24px 32px' }}>
        <Link
          href="/customers"
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
          <span>Back to all customers</span>
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
          {customer.title}
        </h1>

        <p
          style={{
            fontSize: '20px',
            lineHeight: 1.6,
            color: '#555',
            marginBottom: '36px',
            maxWidth: '820px',
          }}
        >
          {customer.description}
        </p>

        {customer.heroImage && (
          <div
            style={{
              borderRadius: '24px',
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
              marginBottom: '48px',
            }}
          >
            <img
              src={customer.heroImage}
              alt={customer.title}
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
          dangerouslySetInnerHTML={{ __html: customer.contentHtml }}
        />

        {/* Bottom CTA */}
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
            Ready to put your content on autopilot?
          </h3>
          <p
            style={{
              fontSize: '16px',
              color: '#c4d7c7',
              maxWidth: '540px',
              margin: '0 auto 24px',
            }}
          >
            Research, writing, value checks, SEO and publishing, set up for your categories and
            your voice.
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
