'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { themeStyle } from '@/lib/themeStyles';
import { cn } from '@/lib/cn';
import { BtnArrow } from './btn-arrow';
import { DoodleField, DotTexture } from './art';
import { InlineStyle } from './inline-style';

export interface ClosingCardData {
  slug: string;
  title: string;
  tagline: string;
  theme: string;
  featured: boolean;
  /** "Closes in 2 days". */
  badge: string;
  /** "Unstop and Instagram". */
  foundOn: string;
}

function ClosingCard({ event }: { event: ClosingCardData }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { gradient } = themeStyle(event.theme);

  return (
    <div
      ref={wrapperRef}
      onMouseMove={(e) => {
        const el = wrapperRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const dx = (e.clientX - rect.left) / rect.width - 0.5;
        const dy = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(900px) scale(1.012) rotateY(${dx * 4}deg) rotateX(${-dy * 3}deg)`;
      }}
      onMouseLeave={() => {
        const el = wrapperRef.current;
        if (!el) return;
        el.style.transition = 'transform 0.4s ease';
        el.style.transform = 'perspective(900px) scale(1) rotateY(0deg) rotateX(0deg)';
        setTimeout(() => {
          if (wrapperRef.current) wrapperRef.current.style.transition = 'transform 0.06s ease';
        }, 400);
      }}
      onMouseEnter={() => {
        if (wrapperRef.current) wrapperRef.current.style.transition = 'transform 0.06s ease';
      }}
      style={{ position: 'relative', transition: 'transform 0.06s ease', willChange: 'transform' }}
    >
      <div
        className={cn('bg-gradient-to-br', gradient)}
        style={{
          position: 'relative',
          borderRadius: 16,
          boxShadow: '2px 4px 6px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '28px 32px 16px',
          minHeight: 260,
          height: '100%',
          color: '#ffffff',
        }}
      >
        <DotTexture opacity={0.22} />

        {/* Pin for featured listings */}
        {event.featured && (
          <div
            title="Featured"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 36,
              height: 36,
              background: '#ec3750',
              borderBottomRightRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 2,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-label="Featured">
              <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
            </svg>
          </div>
        )}

        <h3
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--lp-serif)',
            fontSize: 40,
            fontWeight: 'normal',
            margin: '0 0 8px',
            lineHeight: 1,
            textAlign: 'center',
            width: '100%',
            textShadow: '0 2px 12px rgba(0,0,0,0.15)',
          }}
        >
          {event.title}
        </h3>

        <p style={{ position: 'relative', zIndex: 1, fontFamily: 'var(--lp-sans)', fontSize: 20, opacity: 0.95, margin: '0 0 4px', lineHeight: 1.2 }}>
          {event.tagline}
        </p>

        <div style={{ flex: '1 0 12px' }} />

        <Link
          href={`/hackathons/${event.slug}`}
          className="cta-btn"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 20px',
            background: '#ffffff',
            borderRadius: 44,
            fontFamily: 'var(--lp-sans)',
            fontWeight: 700,
            fontSize: 19,
            color: '#17171d',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            marginBottom: 6,
          }}
        >
          See details <BtnArrow />
        </Link>

        <p
          style={{
            position: 'relative',
            zIndex: 1,
            fontFamily: 'var(--lp-sans)',
            fontStyle: 'italic',
            fontSize: 16,
            margin: 0,
            lineHeight: 1.2,
            paddingRight: 150,
          }}
        >
          Found on {event.foundOn}
        </p>

        {/* Deadline badge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            height: 36,
            minWidth: 130,
            padding: '0 14px',
            background: '#ec3750',
            borderTopLeftRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontFamily: 'var(--lp-sans)', fontWeight: 700, fontSize: 16, color: 'var(--paper)', whiteSpace: 'nowrap' }}>{event.badge}</span>
        </div>
      </div>
    </div>
  );
}

/** "Imagine never missing a deadline again": the four open hackathons that close first. */
export function ClosingSoonSection({ events }: { events: ClosingCardData[] }) {
  return (
    <section
      className="section-padded"
      style={{
        background: 'var(--background)',
        paddingTop: 80,
        paddingBottom: 60,
        paddingLeft: 'clamp(24px, 14.29%, 220px)',
        paddingRight: 'clamp(24px, 14.29%, 220px)',
        position: 'relative',
      }}
    >
      {/* Red gradient at the top of the section, below the wave */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'linear-gradient(180deg, rgba(236,55,80,0.15) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Doodles, flipped and faint, tucked behind the wave */}
      <div style={{ position: 'absolute', top: -40, left: 0, right: 0, transform: 'scaleY(-1)', opacity: 0.12, pointerEvents: 'none', zIndex: 0 }}>
        <DoodleField />
      </div>

      <h2 style={{ textAlign: 'right', marginBottom: 4, marginTop: 100, position: 'relative', zIndex: 1 }}>
        <span style={{ display: 'block', fontFamily: 'var(--lp-serif)', fontSize: 40, lineHeight: 1.05, color: 'var(--foreground)', fontWeight: 'normal' }}>
          Imagine never missing
        </span>
        <span
          style={{
            fontFamily: 'var(--lp-serif)',
            fontSize: 40,
            lineHeight: 1.15,
            fontWeight: 'normal',
            display: 'inline-block',
            background: 'linear-gradient(90deg, #ec3750 0%, #ff8c37 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            paddingBottom: 4,
          }}
        >
          a deadline again:
        </span>
      </h2>

      <p
        style={{
          fontFamily: 'var(--lp-sans)',
          fontSize: 20,
          color: 'var(--foreground)',
          textAlign: 'right',
          marginBottom: 32,
          marginTop: 8,
          lineHeight: 1.25,
          position: 'relative',
          zIndex: 1,
        }}
      >
        These close first. Deadlines and statuses update on their own, so what you see is always current.
      </p>

      <div className="closing-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, position: 'relative', zIndex: 1, alignItems: 'stretch' }}>
        {events.map((event) => (
          <ClosingCard key={event.slug} event={event} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 24, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', margin: '40px 0 8px' }}>Want more time to prepare?</p>
        <Link
          href="/hackathons?sort=deadline"
          className="cta-btn dark-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--foreground)',
            color: 'var(--background)',
            borderRadius: 41,
            height: 48,
            paddingLeft: 28,
            paddingRight: 28,
            fontFamily: 'var(--lp-sans)',
            fontSize: 20,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          See all by deadline <BtnArrow />
        </Link>
      </div>

      <InlineStyle css={`
        @media (max-width: 640px) {
          .closing-grid { grid-template-columns: 1fr !important; }
          .closing-grid > div { min-height: 280px; }
        }
      `} />
    </section>
  );
}
