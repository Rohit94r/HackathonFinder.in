import Link from 'next/link';
import { SOURCES } from '@hackathonfinder/shared';
import { BtnArrowSvg } from './btn-arrow';
import { WaveUp } from './waves';
import { InlineStyle } from './inline-style';

// Shown big, as a wordmark wall. Names only: these are not our logos to use.
const HEADLINERS = ['unstop', 'devfolio', 'devpost', 'instagram', 'linkedin', 'google', 'facebook', 'whatsapp', 'mlh'];

/** "We look everywhere": the places our agents check, and the promise that comes with it. */
export function SourcesSection() {
  const headliners = HEADLINERS.map((slug) => SOURCES.find((s) => s.slug === slug)).filter((s) => s !== undefined);
  const rest = SOURCES.filter((s) => !HEADLINERS.includes(s.slug));

  return (
    <section
      className="section-padded"
      style={{
        position: 'relative',
        background: 'var(--background)',
        paddingTop: 80,
        paddingBottom: 160,
        paddingLeft: 'clamp(24px, 14.29%, 220px)',
        paddingRight: 'clamp(24px, 14.29%, 220px)',
        textAlign: 'center',
      }}
    >
      {/* Red gradient, bottom portion only */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '30%',
          background: 'linear-gradient(0deg, rgba(236,55,80,0.40) 0%, rgba(236,55,80,0.04) 75%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <WaveUp color="var(--surface)" style={{ bottom: -2, zIndex: 20 }} />

      <h2
        className="sources-headline"
        style={{
          fontFamily: 'var(--lp-serif)',
          fontSize: 'clamp(26px, 2.4vw, 40px)',
          fontWeight: 'normal',
          lineHeight: 1.05,
          color: 'var(--foreground)',
          margin: '48px auto 32px',
          maxWidth: 1200,
        }}
      >
        We look everywhere, so you don’t have to.
      </h2>

      <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', margin: '0 auto 40px', maxWidth: 560, lineHeight: 1.25 }}>
        HackathonFinder is free for every student. Forever.
      </p>

      {/* Wordmark wall */}
      <ul
        className="sources-wall"
        style={{
          listStyle: 'none',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, auto)',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px clamp(20px, 4vw, 64px)',
          margin: '0 auto 28px',
          padding: '8px 0',
        }}
      >
        {headliners.map((s, i) => (
          <li
            key={s.slug}
            style={{
              fontFamily: i % 2 ? 'var(--lp-serif)' : 'var(--lp-sans)',
              fontWeight: i % 2 ? 400 : 800,
              fontSize: 'clamp(24px, 2.8vw, 40px)',
              letterSpacing: i % 2 ? 0 : '-0.02em',
              color: 'var(--foreground)',
              opacity: 0.82,
              whiteSpace: 'nowrap',
            }}
          >
            {s.name}
          </li>
        ))}
      </ul>

      {/* Everything else, as pills */}
      <ul
        style={{
          listStyle: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
          margin: '0 auto 48px',
          padding: 0,
          maxWidth: 980,
        }}
      >
        {rest.map((s) => (
          <li
            key={s.slug}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--surface-hover)',
              borderRadius: 9999,
              minHeight: 40,
              padding: '0 20px',
              fontFamily: 'var(--lp-sans)',
              fontSize: 16,
              color: 'var(--foreground)',
              whiteSpace: 'nowrap',
            }}
          >
            {s.name}
          </li>
        ))}
      </ul>

      <div style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', margin: '0 auto 36px', maxWidth: 900, lineHeight: 1.25 }}>
        <p className="sources-line" style={{ margin: 0 }}>
          Every listing shows where we found it and when we last checked it.{' '}
          <Link href="/how-it-works" className="lp-underline-link">
            Read our data rules
          </Link>
        </p>
        <p style={{ margin: '0.75em 0 0' }}>
          We don’t host events or take registrations. We send you to the official page.{' '}
          <Link href="/organizers" className="lp-underline-link">
            For organizers
          </Link>
        </p>
      </div>

      <Link
        href="/how-it-works"
        className="cta-btn dark-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          lineHeight: 1,
          background: 'var(--foreground)',
          color: 'var(--background)',
          borderRadius: 41,
          height: 48,
          paddingLeft: 32,
          paddingRight: 32,
          fontFamily: 'var(--lp-sans)',
          fontSize: 20,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 1,
          marginBottom: 80,
        }}
      >
        How we find events
        <BtnArrowSvg />
      </Link>

      <InlineStyle css={`
        @media (max-width: 900px) {
          .sources-headline { padding-left: 24px; padding-right: 24px; }
        }
        @media (max-width: 640px) {
          .sources-wall { grid-template-columns: repeat(2, auto) !important; }
        }
        .sources-line { white-space: nowrap; }
        @media (max-width: 1100px) {
          .sources-line { white-space: normal; }
        }
      `} />
    </section>
  );
}
