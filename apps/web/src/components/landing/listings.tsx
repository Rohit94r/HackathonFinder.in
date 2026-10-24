import Link from 'next/link';
import { eventTypeLabel, placeName, sourceBySlug } from '@hackathonfinder/shared';
import EventArt from '@/components/hackathon/EventArt';
import { formatDateRange, formatPrizeShort } from '@/lib/format';
import type { HackathonView } from '@/lib/hackathons';
import { BtnArrow } from './btn-arrow';
import { WaveDown } from './waves';
import { InlineStyle } from './inline-style';

const CARD_W = 290;
const GAP = 20;

function ListingCard({ h, copy }: { h: HackathonView; copy: boolean }) {
  const where = h.mode === 'online' ? 'online' : `in ${placeName(h)}`;
  const prize = h.prizePool > 0 ? `${formatPrizeShort(h.prizePool, h.prizeCurrency)} in prizes.` : '';
  const source = sourceBySlug(h.sources[0])?.name;

  return (
    <div
      data-hf-impression={copy ? undefined : h.slug}
      style={{
        flexShrink: 0,
        width: CARD_W,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'var(--surface)',
        boxShadow: 'var(--card-shadow)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <EventArt title={h.title} imageUrl={h.imageUrl} label={eventTypeLabel(h.type)} className="h-[200px] shrink-0" />

      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 19, color: 'var(--foreground)', margin: 0, lineHeight: 1.25, flex: 1 }}>
          <strong>{h.title}</strong> by {h.organizer}. {formatDateRange(h.startDate, h.endDate)}, {where}. {prize}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href={`/hackathons/${h.slug}`}
            tabIndex={copy ? -1 : undefined}
            className="cta-btn"
            style={{
              fontSize: 19,
              color: 'var(--red-text)',
              textDecoration: 'none',
              fontFamily: 'var(--lp-sans)',
              display: 'inline-flex',
              alignItems: 'center',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            View details <BtnArrow />
          </Link>
          {source && (
            <span
              style={{
                marginLeft: 'auto',
                minWidth: 0,
                fontFamily: 'var(--lp-sans)',
                fontSize: 14,
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              via {source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** "Imagine every hackathon in one list": an auto-scrolling carousel of open listings. */
export function ListingsSection({ items, total }: { items: HackathonView[]; total: number }) {
  // Repeat the cards so the loop is seamless.
  const carouselItems = [...items, ...items, ...items];

  return (
    <section className="listings-section" style={{ position: 'relative', zIndex: 1, background: 'var(--background)', paddingTop: 80, paddingBottom: 100 }}>
      {/* Headline */}
      <div
        className="section-padded"
        style={{ position: 'relative', zIndex: 5, paddingLeft: 'clamp(24px, 15vw, 260px)', paddingRight: 32, marginBottom: 8, maxWidth: 1017 + 260 }}
      >
        <h2 style={{ fontFamily: 'var(--lp-serif)', fontSize: 40, lineHeight: 1.05, color: 'var(--foreground)', margin: 0, fontWeight: 'normal' }}>
          Imagine every hackathon{' '}
          <span
            style={{
              background: 'var(--grad-deep)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline',
            }}
          >
            in one list:
          </span>
        </h2>
      </div>

      {/* Subtext */}
      <div
        className="section-padded"
        style={{ position: 'relative', zIndex: 5, paddingLeft: 'clamp(24px, 15vw, 260px)', paddingRight: 32, marginBottom: 40, maxWidth: 1279 + 260 }}
      >
        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', lineHeight: 1.25, margin: 0 }}>
          Unstop, Devfolio, Devpost, Instagram posts, LinkedIn updates and college sites, cleaned up into one card per event. Same event on
          three sites? It shows up once.
        </p>
      </div>

      {/* Auto-scrolling carousel */}
      <div style={{ position: 'relative', zIndex: 5, marginBottom: 24, overflow: 'hidden' }}>
        <div
          className="carousel-fade-left"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 120,
            background: 'linear-gradient(90deg, var(--background) 0%, transparent 100%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
        <div
          className="carousel-fade-right"
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 120,
            background: 'linear-gradient(270deg, var(--background) 0%, transparent 100%)',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        <div className="carousel-track" style={{ display: 'flex', gap: GAP, paddingTop: 8, paddingBottom: 16, width: 'max-content' }}>
          {carouselItems.map((h, i) => (
            // Only the first copy is reachable by keyboard and screen readers.
            <div key={`${h.slug}-${i}`} style={{ display: 'flex' }} aria-hidden={i >= items.length || undefined}>
              <ListingCard h={h} copy={i >= items.length} />
            </div>
          ))}
        </div>

        <InlineStyle css={`
          .carousel-pause-toggle {
            position: absolute;
            inset: 0;
            opacity: 0;
            margin: 0;
            cursor: pointer;
          }
          .carousel-pause-button .play-icon { display: none; }
          .carousel-pause-toggle:checked ~ .pause-icon { display: none; }
          .carousel-pause-toggle:checked ~ .play-icon { display: block; }
          .carousel-pause-toggle:focus-visible {
            outline: 3px solid var(--red);
            outline-offset: 2px;
          }
          .carousel-track {
            animation: carousel-scroll ${items.length * 4}s linear infinite;
          }
          .carousel-track:hover,
          .carousel-track:focus-within {
            animation-play-state: paused;
          }
          .listings-section:has(.carousel-pause-toggle:checked) .carousel-track {
            animation-play-state: paused;
          }
          @keyframes carousel-scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-${items.length * (CARD_W + GAP)}px); }
          }
          @media (prefers-reduced-motion: reduce) {
            .carousel-track { animation: none !important; }
          }
          .listings-cta-short { display: none; }
          @media (max-width: 640px) {
            .carousel-fade-left, .carousel-fade-right { display: none !important; }
            .listings-cta-full { display: none; }
            .listings-cta-short { display: inline; }
          }
        `} />
      </div>

      {/* CTA, aligned with the headline */}
      <div className="section-padded" style={{ paddingLeft: 'clamp(24px, 15vw, 260px)', paddingRight: 32, position: 'relative', zIndex: 5, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href="/hackathons"
            className="cta-btn dark-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--foreground)',
              color: 'var(--background)',
              borderRadius: 41,
              height: 52,
              paddingLeft: 32,
              paddingRight: 32,
              fontFamily: 'var(--lp-sans)',
              fontSize: 20,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <span className="listings-cta-full">Explore all {total} hackathons</span>
            <span className="listings-cta-short">Explore all</span> <BtnArrow />
          </Link>

          <label
            className="carousel-pause-button"
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              color: 'var(--muted)',
              border: '3px solid var(--muted)',
              borderRadius: 999,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input type="checkbox" className="carousel-pause-toggle" aria-label="Pause the carousel" />
            <svg className="pause-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <line x1="8" y1="6" x2="8" y2="18" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
              <line x1="16" y1="6" x2="16" y2="18" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
            </svg>
            <svg className="play-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M8 6 Q8 5 9 5 L16.5 9.9 Q17.8 10.8 17.8 12 Q17.8 13.2 16.5 14.1 L9 19 Q8 19 8 18 Z" fill="currentColor" />
            </svg>
          </label>
        </div>
      </div>

      <WaveDown color="var(--background)" style={{ bottom: -40, zIndex: 10 }} />
    </section>
  );
}
