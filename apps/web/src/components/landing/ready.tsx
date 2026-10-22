import Link from 'next/link';
import { BtnArrow } from './btn-arrow';
import { DigestSignup } from './digest-signup';

/** Final call to action: the weekly digest, or straight to the list. */
export function ReadySection() {
  return (
    <section
      style={{
        position: 'relative',
        background: 'var(--surface)',
        paddingTop: 'clamp(80px, 15vw, 192px)',
        paddingBottom: 'clamp(60px, 10vw, 120px)',
        paddingLeft: 24,
        paddingRight: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontFamily: 'var(--lp-serif)', fontWeight: 400, fontSize: 40, lineHeight: 1, color: 'var(--foreground)', margin: '0 0 12px' }}>
          Ready?
        </h2>
        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', margin: '0 0 24px', lineHeight: 1.25 }}>
          Get new hackathons in your inbox, once a week.
        </p>

        <DigestSignup id="ready-digest-email" />

        <p style={{ fontFamily: 'var(--lp-sans)', fontSize: 20, color: 'var(--foreground)', margin: '48px 0 0', lineHeight: 1.25 }}>
          Or find your next hackathon right now.
        </p>

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
            paddingLeft: 36,
            paddingRight: 36,
            fontFamily: 'var(--lp-sans)',
            fontSize: 20,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            marginTop: 16,
          }}
        >
          Explore hackathons <BtnArrow />
        </Link>

        <p style={{ fontFamily: 'var(--lp-sans)', fontStyle: 'italic', fontSize: 16, color: 'var(--foreground)', margin: '20px 0 0', lineHeight: 1.25 }}>
          One email a week. No spam, and we never sell your data.{' '}
          <Link href="/privacy" className="lp-underline-link">
            Privacy
          </Link>
        </p>
      </div>
    </section>
  );
}
