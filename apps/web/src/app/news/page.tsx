'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  categories,
  categoryName,
  sampleNews,
  type CategorySlug,
  type NewsStatus,
} from '@hackathonfinder/shared';

type CategoryFilter = 'all' | CategorySlug;
type SortOrder = 'relevance' | 'newest';

const statusStyles: Record<NewsStatus, { bg: string; color: string }> = {
  'Sent to writer': { bg: 'rgba(85,221,74,0.15)', color: '#2f7a28' },
  New: { bg: 'rgba(18,35,21,0.08)', color: '#122315' },
  Skipped: { bg: 'rgba(0,0,0,0.05)', color: '#888' },
};

function relevanceColor(score: number) {
  if (score >= 85) return '#55dd4a';
  if (score >= 70) return '#9fd36b';
  return '#c4d7c7';
}

export default function NewsFeedPage() {
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('relevance');
  const [hideSkipped, setHideSkipped] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, NewsStatus>>(() =>
    Object.fromEntries(sampleNews.map((item) => [item.id, item.status]))
  );

  const items = useMemo(() => {
    const filtered = sampleNews.filter(
      (item) =>
        (category === 'all' || item.category === category) &&
        (!hideSkipped || statuses[item.id] !== 'Skipped')
    );
    // sampleNews is already ordered newest first.
    return sortOrder === 'relevance'
      ? [...filtered].sort((a, b) => b.relevance - a.relevance)
      : filtered;
  }, [category, sortOrder, hideSkipped, statuses]);

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: sampleNews.length };
    for (const item of sampleNews) {
      result[item.category] = (result[item.category] ?? 0) + 1;
    }
    return result;
  }, []);

  const setStatus = (id: string, status: NewsStatus) => {
    setStatuses((prev) => ({ ...prev, [id]: status }));
  };

  const filterButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 18px',
    borderRadius: '999px',
    border: active ? '1px solid #122315' : '1px solid rgba(0,0,0,0.15)',
    background: active ? '#122315' : '#fff',
    color: active ? '#fff' : '#122315',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  return (
    <div className="body-home-page" style={{ background: '#f5f4ef' }}>
      <Navbar variant="off-white" />

      {/* Hero Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px 30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1
            className="heading-h2-black-centered"
            style={{ fontSize: 'clamp(44px, 6vw, 76px)', lineHeight: 1, marginBottom: '8px' }}
          >
            News Feed
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
            By category
          </h1>
          <p
            className="paragraph-black-centered"
            style={{ fontSize: '18px', maxWidth: '660px', margin: '0 auto', color: '#555' }}
          >
            Everything the news finder picked up, sorted into your categories and scored for
            relevance. Send the best stories to the writer and skip the rest.
          </p>
        </div>

        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto 32px',
            padding: '12px 18px',
            borderRadius: '12px',
            background: 'rgba(85,221,74,0.1)',
            border: '1px solid rgba(85,221,74,0.35)',
            fontSize: '14px',
            color: '#39523c',
            textAlign: 'center',
          }}
        >
          Sample data for the demo. Live stories appear here once your sources are connected.
        </div>

        {/* Category filters */}
        <div
          role="tablist"
          aria-label="Filter by category"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={category === 'all'}
            onClick={() => setCategory('all')}
            style={filterButtonStyle(category === 'all')}
          >
            All ({counts.all})
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={category === c.slug}
              onClick={() => setCategory(c.slug)}
              style={filterButtonStyle(category === c.slug)}
            >
              {c.name} ({counts[c.slug] ?? 0})
            </button>
          ))}
        </div>

        {/* Sort + skipped toggle */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '40px',
            fontSize: '14px',
            color: '#555',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Sort by
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(0,0,0,0.15)',
                background: '#fff',
                fontSize: '14px',
              }}
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={hideSkipped}
              onChange={(e) => setHideSkipped(e.target.checked)}
              style={{ accentColor: '#122315' }}
            />
            Hide skipped
          </label>
        </div>

        {/* Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '80px' }}>
          {items.length === 0 && (
            <p style={{ textAlign: 'center', color: '#666' }}>No stories match these filters.</p>
          )}
          {items.map((item) => {
            const status = statuses[item.id];
            const badge = statusStyles[status];
            return (
              <article
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) auto',
                  gap: '20px',
                  alignItems: 'center',
                  background: '#fff',
                  borderRadius: '18px',
                  border: '1px solid rgba(0,0,0,0.06)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.03)',
                  padding: '22px 24px',
                  opacity: status === 'Skipped' ? 0.6 : 1,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '10px',
                      alignItems: 'center',
                      marginBottom: '10px',
                      fontSize: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: '#39523c',
                      }}
                    >
                      {categoryName(item.category)}
                    </span>
                    <span style={{ color: '#999' }}>•</span>
                    <span style={{ color: '#777' }}>{item.source}</span>
                    <span style={{ color: '#999' }}>•</span>
                    <span style={{ color: '#777' }}>{item.foundAgo}</span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 600,
                      }}
                    >
                      {status}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'Graphik, sans-serif',
                      fontSize: '19px',
                      fontWeight: 600,
                      lineHeight: 1.4,
                      color: '#122315',
                      margin: 0,
                    }}
                  >
                    {item.headline}
                  </h3>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                    {status !== 'Sent to writer' && (
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, 'Sent to writer')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#122315',
                          color: '#fff',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Send to writer
                      </button>
                    )}
                    {status !== 'Skipped' && (
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, 'Skipped')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.15)',
                          background: 'transparent',
                          color: '#122315',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Skip
                      </button>
                    )}
                    {status === 'Skipped' && (
                      <button
                        type="button"
                        onClick={() => setStatus(item.id, 'New')}
                        style={{
                          padding: '8px 14px',
                          borderRadius: '8px',
                          border: '1px solid rgba(0,0,0,0.15)',
                          background: 'transparent',
                          color: '#122315',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'center', minWidth: '72px' }}>
                  <div
                    aria-label={`Relevance ${item.relevance} out of 100`}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      margin: '0 auto 6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `conic-gradient(${relevanceColor(item.relevance)} ${item.relevance * 3.6}deg, rgba(0,0,0,0.06) 0deg)`,
                    }}
                  >
                    <div
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        background: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'Deacon, sans-serif',
                        fontWeight: 900,
                        fontSize: '18px',
                        color: '#122315',
                      }}
                    >
                      {item.relevance}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#777', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Relevance
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <Link href="/dashboard" className="button-primary w-button" style={{ display: 'inline-block' }}>
            See the pipeline run
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
