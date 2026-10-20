'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { blogPostsData } from '@/data/blogData';

export default function BlogIndexPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = blogPostsData.filter(
    (post) =>
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      {/* Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1
            className="heading-h2-black-centered"
            style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 1, marginBottom: '8px' }}
          >
            Notes from
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
            The pipeline
          </h1>
          <p
            className="paragraph-black-centered"
            style={{ fontSize: '18px', maxWidth: '640px', margin: '0 auto', color: '#555' }}
          >
            How we build AI agents that write for executives, and what we learn along the way.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '500px', margin: '0 auto 48px' }}>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: '999px',
              border: '1px solid rgba(0,0,0,0.15)',
              fontSize: '16px',
              outline: 'none',
              background: '#fff',
              boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            }}
          />
        </div>

        {/* Featured Post (first post) */}
        {filteredPosts.length > 0 && !searchTerm && (
          <Link
            href={`/blog/${filteredPosts[0].slug}`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '32px',
              background: '#fff',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.05)',
              marginBottom: '48px',
              textDecoration: 'none',
              color: 'inherit',
            }}
          >
            <div style={{ minHeight: '300px', position: 'relative' }}>
              <img
                src={filteredPosts[0].image}
                alt={filteredPosts[0].title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div
              style={{
                padding: '36px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#39523c',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  marginBottom: '12px',
                }}
              >
                Featured Story
              </div>
              <h2
                style={{
                  fontFamily: 'Graphik, sans-serif',
                  fontSize: '28px',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  marginBottom: '16px',
                  color: '#122315',
                }}
              >
                {filteredPosts[0].title}
              </h2>
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: '#555', marginBottom: '24px' }}>
                {filteredPosts[0].description}
              </p>
              <div
                style={{
                  color: '#39523c',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>Read article</span>
                <span>→</span>
              </div>
            </div>
          </Link>
        )}

        {/* Posts Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '32px',
            marginBottom: '80px',
          }}
        >
          {(searchTerm ? filteredPosts : filteredPosts.slice(1)).map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                background: '#fff',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ height: '220px', overflow: 'hidden' }}>
                <img
                  src={post.image}
                  alt={post.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
              <div
                style={{
                  padding: '24px',
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
                      fontSize: '20px',
                      fontWeight: 600,
                      lineHeight: 1.35,
                      marginBottom: '12px',
                      color: '#122315',
                    }}
                  >
                    {post.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      lineHeight: 1.6,
                      color: '#666',
                      marginBottom: '20px',
                    }}
                  >
                    {post.description}
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#39523c',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <span>Read article</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
