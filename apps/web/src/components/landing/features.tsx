'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Bookmark, Building2, CalendarClock, Globe2, Layers, Megaphone, Search, Users } from 'lucide-react';
import { BtnArrowSvg } from './btn-arrow';
import { DeadlineBuddy } from './art';
import { PHOTOS, type Photo } from './photos';
import { WaveUp } from './waves';
import { InlineStyle } from './inline-style';

export interface LiveStat {
  value: number;
  label: string;
  icon: 'open' | 'closing' | 'cities' | 'sources';
}

const DIGIT_HEIGHT_PX = 24;

const cardWrapStyle: CSSProperties = { position: 'relative', borderRadius: 16, boxShadow: 'var(--feature-card-shadow)' };
const cardContentStyle: CSSProperties = { position: 'relative', zIndex: 1, padding: '32px 44px 32px' };
const srOnly: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};
const cardTitleStyle: CSSProperties = {
  fontFamily: 'var(--lp-serif)',
  fontSize: 40,
  fontWeight: 'normal',
  lineHeight: 1,
  color: 'var(--paper)',
  margin: 0,
};
const cardBodyStyle: CSSProperties = { fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--paper)', margin: 0, lineHeight: 1.25 };
const cardBodyGapStyle: CSSProperties = { ...cardBodyStyle, margin: '1em 0 0' };
const cardCtaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  paddingLeft: 20,
  paddingRight: 20,
  height: 44,
  background: 'var(--red)',
  color: 'var(--paper)',
  borderRadius: 32,
  fontFamily: 'var(--lp-sans)',
  fontSize: 20,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  marginTop: 16,
  lineHeight: 1,
  gap: 8,
};

/** Dark card background: an event photo under an ink wash, with a coloured glow in the corner. */
function CardBg({ photo, glow }: { photo: Photo; glow: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden', pointerEvents: 'none', background: '#17171d' }}>
      <Image src={photo.src} alt="" fill sizes="(max-width: 1366px) 100vw, 980px" style={{ objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(23,23,29,0.9) 0%, rgba(23,23,29,0.76) 55%, rgba(23,23,29,0.6) 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 140% at 100% 0%, ${glow} 0%, transparent 60%)`, opacity: 0.55 }} />
    </div>
  );
}

function CardIcon({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span
      style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: color,
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function CardCta({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link href={href} style={cardCtaStyle} className="cta-btn">
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, lineHeight: 1 }}>
        {children}{' '}
        <span className="btn-arrow" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
          <BtnArrowSvg />
        </span>
      </span>
    </Link>
  );
}

const STAT_ICONS = { open: Layers, closing: CalendarClock, cities: Building2, sources: Globe2 } as const;

function OdometerNumber({ value, animate, baseDelay }: { value: number; animate: boolean; baseDelay: number }) {
  const formatted = value.toLocaleString('en-IN');
  const chars = formatted.split('');
  const totalDigits = chars.filter((char) => /\d/.test(char)).length;
  const digitIndexes = chars.flatMap((char, index) => (/\d/.test(char) ? [index] : []));

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1, fontVariantNumeric: 'tabular-nums', position: 'relative' }}>
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
        {chars.map((char, charIndex) => {
          if (!/\d/.test(char)) {
            return (
              <span key={`sep-${charIndex}`} style={{ width: '0.34em', textAlign: 'center' }}>
                {char}
              </span>
            );
          }

          const targetDigit = Number(char);
          const digitPosition = digitIndexes.indexOf(charIndex);
          const digitPlaceFromRight = totalDigits - digitPosition - 1;
          const loops = Math.max(2, 4 - Math.floor(digitPlaceFromRight / 2));
          const finalStep = loops * 10 + targetDigit;
          const wheel = Array.from({ length: finalStep + 1 }, (_, idx) => idx % 10);

          return (
            <span
              key={`digit-${charIndex}`}
              style={{ width: '0.62em', height: DIGIT_HEIGHT_PX, overflow: 'hidden', display: 'inline-flex', alignItems: 'flex-start', justifyContent: 'center' }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  flexDirection: 'column',
                  transform: animate ? `translateY(-${finalStep * DIGIT_HEIGHT_PX}px)` : 'translateY(0)',
                  transition: `transform ${700 + digitPlaceFromRight * 130}ms cubic-bezier(0.19, 1, 0.22, 1) ${baseDelay + digitPosition * 60}ms`,
                  willChange: 'transform',
                }}
              >
                {wheel.map((digit, wheelIdx) => (
                  <span key={wheelIdx} style={{ height: DIGIT_HEIGHT_PX, lineHeight: `${DIGIT_HEIGHT_PX}px`, textAlign: 'center' }}>
                    {digit}
                  </span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span style={srOnly}>{formatted}</span>
    </span>
  );
}

function StatBadge({ stat, animate, delay }: { stat: LiveStat; animate: boolean; delay: number }) {
  const Icon = STAT_ICONS[stat.icon];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--elevated)',
        border: '1px solid var(--border)',
        borderRadius: 52,
        height: 50,
        paddingLeft: 16,
        paddingRight: 24,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        minWidth: 270,
        opacity: animate ? 1 : 0,
        transform: animate ? 'translateX(0)' : 'translateX(12px)',
        transition: `opacity 240ms ease-out ${delay}ms, transform 280ms cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms`,
      }}
    >
      <Icon size={18} strokeWidth={2} color="var(--foreground)" aria-hidden="true" />
      <span style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <OdometerNumber value={stat.value} animate={animate} baseDelay={delay} />
        <span>{stat.label}</span>
      </span>
    </div>
  );
}

function LiveStatBadges({ stats }: { stats: LiveStat[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasEnteredView, setHasEnteredView] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || hasEnteredView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHasEnteredView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasEnteredView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasEnteredView]);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end', justifyContent: 'center' }}>
      {stats.map((stat, idx) => (
        <StatBadge key={stat.icon} stat={stat} animate={hasEnteredView} delay={idx * 55} />
      ))}
    </div>
  );
}

/** Mock of the "My hackathons" tracker, hanging off the card's right edge. */
function TrackerMock() {
  const rows = [
    ['CodeStorm 2026', 'Registered', '#33d6a6'],
    ['HackHer Pune', 'Saved', '#f1c40f'],
    ['GreenCode Climate Hack', 'Submitted', '#338eda'],
  ];
  return (
    <div
      className="features-tracker"
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: -60,
        top: 96,
        width: 380,
        background: 'var(--mock-card)',
        borderRadius: 14,
        boxShadow: 'var(--tracker-shadow)',
        padding: '18px 20px',
        zIndex: 1,
        transform: 'rotate(2deg)',
        fontFamily: 'var(--lp-sans)',
        color: 'var(--foreground)',
      }}
    >
      <p style={{ margin: '0 0 12px', fontWeight: 800, fontSize: 16 }}>My hackathons</p>
      {rows.map(([name, status, color]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderTop: '1px solid var(--mock-rule)' }}>
          <span style={{ fontSize: 16 }}>{name}</span>
          <span style={{ background: color, color: '#17171d', borderRadius: 999, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>{status}</span>
        </div>
      ))}
    </div>
  );
}

/** "Everything you get, free": the four things HackathonFinder does for students and organizers. */
export function FeaturesSection({ stats }: { stats: LiveStat[] }) {
  return (
    <section style={{ background: 'var(--surface)', paddingTop: 80, paddingBottom: 48, position: 'relative' }}>
      <DeadlineBuddy
        style={{
          position: 'absolute',
          right: 'calc(60 / 1920 * 100vw)',
          top: -22,
          width: 'calc(300 / 1920 * 100vw)',
          minWidth: 96,
          height: 'auto',
          transform: 'translateY(calc(-50% - 8px)) rotate(6deg)',
          zIndex: 30,
          pointerEvents: 'none',
        }}
      />

      <WaveUp color="var(--surface)" style={{ top: -54, zIndex: 25 }} />

      <div
        className="section-padded"
        style={{ maxWidth: 1366, margin: '0 auto', paddingLeft: 'clamp(24px, 14.29%, 195px)', paddingRight: 'clamp(24px, 14.29%, 195px)' }}
      >
        <h2 style={{ fontFamily: 'var(--lp-serif)', fontSize: 40, fontWeight: 'normal', lineHeight: 1, color: 'var(--foreground)', margin: '0 0 20px' }}>
          Everything you get, for free.
        </h2>
        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', margin: '0 0 48px', lineHeight: 1.25 }}>
          No account needed to browse. Here’s what HackathonFinder does for students, and for the people who run the events.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          {/* Card 1: one list, with live counts */}
          <div style={cardWrapStyle}>
            <CardBg photo={PHOTOS.lateNightCode} glow="rgba(236,55,80,0.55)" />
            <div className="features-card1-content" style={{ ...cardContentStyle, maxWidth: 'calc(100% - 260px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <CardIcon color="#ec3750">
                  <Search size={24} aria-hidden="true" />
                </CardIcon>
                <h3 className="features-card-title" style={cardTitleStyle}>One list of every hackathon</h3>
              </div>
              <p style={cardBodyStyle}>
                Search by name, organizer, theme or keyword. Filter by city, mode, dates, deadline, team size, prize, fee and who can join.
              </p>
              <p style={cardBodyGapStyle}>Plus “near me” to see the closest ones first, a calendar view, city and theme pages and a “closing soon” list, so you always know what’s next.</p>
              <CardCta href="/hackathons">Explore hackathons</CardCta>
            </div>
            <div className="features-stats" style={{ position: 'absolute', right: -60, top: 32, bottom: 32, display: 'flex', alignItems: 'center' }}>
              <LiveStatBadges stats={stats} />
            </div>
          </div>

          {/* Card 2: tracker and reminders */}
          <div style={cardWrapStyle}>
            <CardBg photo={PHOTOS.openHall} glow="rgba(51,142,218,0.6)" />
            <TrackerMock />
            <div className="features-card-content" style={{ ...cardContentStyle, zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <CardIcon color="#338eda">
                  <Bookmark size={24} aria-hidden="true" />
                </CardIcon>
                <h3 className="features-card-title" style={cardTitleStyle}>My hackathons</h3>
              </div>
              <div className="features-card2-body" style={{ maxWidth: 'calc(100% - 340px)' }}>
                <p style={cardBodyStyle}>Save events and track each one from saved to registered, submitted and done.</p>
                <p style={cardBodyGapStyle}>Deadline reminders by email, then WhatsApp and Telegram, are on the way. So is a weekly digest picked for you.</p>
              </div>
              <CardCta href="/saved">Open My hackathons</CardCta>
            </div>
          </div>

          {/* Card 3: Team Finder */}
          <div style={cardWrapStyle}>
            <CardBg photo={PHOTOS.longTable} glow="rgba(166,51,214,0.6)" />
            <div className="features-card-content" style={{ ...cardContentStyle, maxWidth: 'calc(100% - 88px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <CardIcon color="#a633d6">
                  <Users size={24} aria-hidden="true" />
                </CardIcon>
                <h3 className="features-card-title" style={cardTitleStyle}>Great idea, no team?</h3>
              </div>
              <p style={cardBodyStyle}>Post the skills you have and the skills you need on any hackathon.</p>
              <p style={cardBodyGapStyle}>Find a frontend dev, an ML person, a designer or someone who can pitch, and team up before the deadline.</p>
              <CardCta href="/teams">Find teammates</CardCta>
            </div>
          </div>

          {/* Card 4: organizers */}
          <div style={cardWrapStyle}>
            <CardBg photo={PHOTOS.stageLights} glow="rgba(255,140,55,0.6)" />
            <div className="features-card-content" style={{ ...cardContentStyle, maxWidth: 'calc(100% - 88px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <CardIcon color="#ff8c37">
                  <Megaphone size={24} aria-hidden="true" />
                </CardIcon>
                <h3 className="features-card-title" style={cardTitleStyle}>Running a hackathon?</h3>
              </div>
              <p style={cardBodyStyle}>
                List it for free, claim a listing we already found, and reach students who are actively looking. Featured spots are there
                when you want extra reach.
              </p>
              <CardCta href="/submit?as=organizer">Submit your hackathon</CardCta>
            </div>
          </div>
        </div>
      </div>

      <InlineStyle css={`
        @media (max-width: 1100px) {
          .features-stats { display: none !important; }
          .features-card1-content { max-width: 100% !important; }
        }
        @media (max-width: 900px) {
          .features-tracker { display: none !important; }
          .features-card2-body { max-width: 100% !important; }
        }
        @media (max-width: 767px) {
          .features-card1-content, .features-card-content { max-width: 100% !important; padding: 24px 20px !important; }
          .features-card-title { font-size: 28px !important; }
        }
      `} />
    </section>
  );
}
