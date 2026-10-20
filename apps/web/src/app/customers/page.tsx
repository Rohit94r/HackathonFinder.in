import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { customersData } from '@/data/customerData';
import { siteConfig } from '@/data/siteConfig';

export const metadata = {
  title: `Customers - ${siteConfig.name}`,
  description: `See how teams use ${siteConfig.name}'s agents to publish executive-grade content every week.`,
};

export default function CustomersPage() {
  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      {/* Hero Section */}
      <section className="section-hero" style={{ padding: '60px 20px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1
            className="heading-h2-black-centered"
            style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 1, marginBottom: '8px' }}
          >
            Built with
          </h1>
          <h1
            className="heading-h2-green-centered"
            style={{
              fontSize: 'clamp(44px, 6vw, 76px)',
              lineHeight: 1,
              marginBottom: '24px',
              color: '#39523c',
            }}
          >
            Our agents
          </h1>
          <p
            className="paragraph-black-centered"
            style={{ fontSize: '18px', maxWidth: '640px', margin: '0 auto 36px', color: '#444' }}
          >
            See how teams use {siteConfig.name}&#39;s agents to research, write and publish
            executive-grade content, without adding headcount.
          </p>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 100px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '36px',
          }}
        >
          {customersData.map((customer) => (
            <Link
              key={customer.slug}
              href={`/customers/${customer.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              className="customer-card-hover"
            >
              <div style={{ height: '260px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={customer.image}
                  alt={customer.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontFamily: 'Graphik, sans-serif',
                      fontSize: '22px',
                      fontWeight: 600,
                      lineHeight: 1.3,
                      marginBottom: '12px',
                      color: '#122315',
                    }}
                  >
                    {customer.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '15px',
                      lineHeight: 1.6,
                      color: '#666',
                      marginBottom: '20px',
                    }}
                  >
                    {customer.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#39523c',
                    fontWeight: 600,
                    fontSize: '15px',
                  }}
                >
                  <span>Read case study</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}

          {/* Next customer CTA card */}
          <Link
            href={siteConfig.demoHref}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'flex-start',
              gap: '16px',
              background: '#122315',
              borderRadius: '20px',
              padding: '36px',
              minHeight: '360px',
              textDecoration: 'none',
              color: '#fff',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#55dd4a',
              }}
            >
              Your company next
            </span>
            <h3
              style={{
                fontFamily: 'Graphik, sans-serif',
                fontSize: '26px',
                fontWeight: 600,
                lineHeight: 1.3,
                margin: 0,
              }}
            >
              Want agents that write for your readers?
            </h3>
            <p style={{ fontSize: '15px', lineHeight: 1.6, color: '#c4d7c7', margin: 0 }}>
              We set up each agent for your categories, your voice and your channels.
            </p>
            <span style={{ fontWeight: 600, color: '#55dd4a' }}>Book a demo →</span>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
